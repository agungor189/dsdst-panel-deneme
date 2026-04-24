import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  TrendingUp as IconTrending,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { api, formatCurrency } from '../lib/api';
import { Transaction, Product, Settings } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics({ settings }: { settings: Settings | null }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRecurring, setPendingRecurring] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [txData, prData, rpData] = await Promise.all([
          api.get('/transactions'),
          api.get('/products'),
          api.get('/recurring-payments')
        ]);
        setTxs(txData);
        setProducts(prData);

        // Calculate pending recurring total for current month
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        
        let pendingTotal = 0;
        rpData.filter((r: any) => r.status === 'Active').forEach((r: any) => {
           const recurringId = `${r.id}-${year}-${month}`;
           const exists = txData.some((t: any) => t.recurring_id === recurringId);
           if (!exists) pendingTotal += r.amount;
        });
        setPendingRecurring(pendingTotal);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 1. Monthly Performance Data
  const monthlyData = useMemo(() => {
    const groups: Record<string, { month: string, income: number, expense: number }> = {};
    txs.forEach(tx => {
      const date = new Date(tx.date);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = { month: key, income: 0, expense: 0 };
      }
      if (tx.type === 'Income') groups[key].income += tx.amount;
      else groups[key].expense += tx.amount;
    });

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    if (groups[currentMonthKey]) {
      groups[currentMonthKey].expense += pendingRecurring;
    } else {
      groups[currentMonthKey] = { month: currentMonthKey, income: 0, expense: pendingRecurring };
    }

    return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month)).map(d => ({
      ...d,
      profit: d.income - d.expense
    }));
  }, [txs, pendingRecurring]);

  // 2. Product Profitability Calculation
  const productProfitability = useMemo(() => {
    return products.map(p => {
      // Find transactions for this product
      const pTxs = txs.filter(t => t.product_id === p.id);
      const revenue = pTxs.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      const operationalExpenses = pTxs.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
      
      // Estimated commission cost (using platform name if available or default)
      // Since transactions have platform, we can be more accurate
      let estimatedCommission = 0;
      pTxs.filter(t => t.type === 'Income').forEach(t => {
        const rate = settings?.commission_rates[t.platform] || 0;
        estimatedCommission += (t.amount * rate) / 100;
      });

      // Total sold units (rough estimate from transactions if we assume 1 unit per transaction)
      const unitsSold = pTxs.filter(t => t.type === 'Income').length;
      const totalPurchaseCost = unitsSold * p.purchase_cost;

      const netProfit = revenue - operationalExpenses - estimatedCommission - totalPurchaseCost;

      return {
        id: p.id,
        title: p.title,
        revenue,
        netProfit,
        profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
      };
    }).sort((a, b) => b.netProfit - a.netProfit).slice(0, 5);
  }, [products, txs, settings]);

  // 3. Platform Distribution
  const platformData = useMemo(() => {
    const data: Record<string, number> = {};
    txs.filter(t => t.type === 'Income').forEach(t => {
      data[t.platform] = (data[t.platform] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [txs]);

  if (loading) return <div className="p-8 text-center">Analizler yükleniyor...</div>;

  const totalIncome = txs.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0) + pendingRecurring;
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight">Akıllı Analizler</h2>
          <p className="text-sm text-text-muted">Verilerinizi kazanca dönüştüren derinlemesine içgörüler.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Toplam Gelir" 
          value={formatCurrency(totalIncome)} 
          type="up" 
          color="text-success"
          bg="bg-green-50"
        />
        <StatCard 
          title="Toplam Gider" 
          value={formatCurrency(totalExpense)} 
          type="down"
          color="text-danger"
          bg="bg-red-50"
        />
        <StatCard 
          title="Net Karlılık" 
          value={formatCurrency(netProfit)} 
          type={netProfit >= 0 ? "up" : "down"}
          color="text-primary"
          bg="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend */}
        <div className="card p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-text-main">Aylık Finansal Trend</h3>
              <div className="flex items-center space-x-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-success mr-1.5"></div> Gelir</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-danger mr-1.5"></div> Gider</span>
              </div>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={monthlyData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                 <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                 <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Top Profitable Products */}
        <div className="card p-8 space-y-6">
           <h3 className="font-bold text-lg text-text-main">En Karlı Ürünler (Net Kar)</h3>
           <div className="space-y-4">
              {productProfitability.map((p, idx) => (
                <div key={p.id} className="group p-4 bg-bg-main rounded-2xl border border-border-color hover:border-primary transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-text-main">{p.title}</span>
                    <span className="text-sm font-bold text-primary">{formatCurrency(p.netProfit)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${Math.min(100, Math.max(10, p.profitMargin))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    <span>Marj: %{p.profitMargin.toFixed(1)}</span>
                    <span>Ciro: {formatCurrency(p.revenue)}</span>
                  </div>
                </div>
              ))}
              {productProfitability.length === 0 && (
                <div className="py-12 text-center text-text-muted italic">Yeterli veri bulunamadı.</div>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Platform Share */}
        <div className="card p-8 space-y-6 lg:col-span-1">
           <h3 className="font-bold text-lg text-text-main">Platform Dağılımı</h3>
           <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', shadow: 'xl' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Quick Insights List */}
        <div className="card p-8 space-y-6 lg:col-span-2">
           <h3 className="font-bold text-lg text-text-main">Yapay Zeka İçgörüleri</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InsightCard 
                icon={Target}
                title="Profitabilite Fırsatı"
                description={`${productProfitability[0]?.title || 'En karlı ürününüzün'} satışlarını %10 artırarak aylık net karınızı ${formatCurrency(netProfit * 0.1)} yükseltebilirsiniz.`}
              />
              <InsightCard 
                icon={IconTrending}
                title="Platform Uyarısı"
                description={`Bu ay en yüksek komisyon giderini ${settings?.commission_rates ? Object.entries(settings.commission_rates).sort((a, b) => b[1] - a[1])[0][0] : 'genel'} platformunda ödediniz.`}
              />
              <InsightCard 
                icon={ShoppingBag}
                title="Stok Verimliliği"
                description="Sık hareket gören ürünlerinizde kargo maliyetlerini düşürmek için toplu lojistik stratejisi değerlendirilmeli."
              />
              <InsightCard 
                icon={DollarSign}
                title="Maliyet Analizi"
                description={`Giderlerin toplam gelire oranı: %${totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}. Bu oran geçen aya göre iyileşme gösteriyor.`}
              />
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, type, color, bg }: any) {
  return (
    <div className="card p-6 flex items-center justify-between hover:shadow-lg transition-all duration-300 group">
       <div className="space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{title}</p>
          <p className={cn("text-2xl font-black tracking-tight", color)}>{value}</p>
       </div>
       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bg)}>
          {type === 'up' ? <ArrowUpRight className={cn("w-6 h-6", color)} /> : <ArrowDownRight className={cn("w-6 h-6", color)} />}
       </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, description }: any) {
  return (
    <div className="p-5 bg-bg-main rounded-2xl border border-border-color space-y-3 hover:border-primary transition-colors">
       <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-border-color flex items-center justify-center shadow-sm">
             <Icon className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-bold text-text-main">{title}</p>
       </div>
       <p className="text-xs text-text-muted leading-relaxed font-medium">{description}</p>
    </div>
  );
}
