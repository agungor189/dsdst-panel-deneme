import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  TrendingUp, 
  TrendingDown,
  Settings as SettingsIcon,
  BarChart3,
  Repeat,
  Search,
  Bell,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import ProductWizard from './components/ProductWizard';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import RecurringPayments from './components/RecurringPayments';
import SettingsView from './components/SettingsView';
import { api } from './lib/api';
import { Settings } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'dashboard' | 'products' | 'product-detail' | 'product-wizard' | 'stock' | 'income' | 'expense' | 'recurring' | 'analytics' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error("Settings load error:", err);
    }
  };

  const navigateToProduct = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('product-detail');
  };

  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'products', label: 'Ürünler', icon: Package },
    { id: 'income', label: 'Gelirler', icon: TrendingUp },
    { id: 'expense', label: 'Giderler', icon: TrendingDown },
    { id: 'recurring', label: 'Periyodikler', icon: Repeat },
    { id: 'analytics', label: 'Analizler', icon: BarChart3 },
    { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-primary/10">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full border-r border-border-color bg-sidebar-bg text-white transition-all duration-300 z-50",
        isSidebarOpen ? "w-60" : "w-20"
      )}>
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          {isSidebarOpen ? (
            <h1 className="text-xl font-extrabold tracking-wider text-[#38bdf8] truncate">
              {settings?.company_name || 'DSDST Panel'}
            </h1>
          ) : (
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">DP</div>
          )}
        </div>

        <nav className="mt-4 px-0 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center px-6 py-3.5 transition-all text-sm font-medium group relative",
                currentView === item.id || (item.id === 'products' && (currentView === 'product-detail' || currentView === 'product-wizard'))
                  ? "bg-primary/10 text-white border-l-4 border-primary" 
                  : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isSidebarOpen ? "mr-3" : "mx-auto")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute bottom-4 right-[-12px] w-6 h-6 bg-white border border-border-color text-sidebar-bg rounded-full flex items-center justify-center hover:bg-bg-main shadow-md cursor-pointer transition-transform"
        >
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isSidebarOpen && "rotate-180")} />
        </button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen flex flex-col",
        isSidebarOpen ? "pl-60" : "pl-20"
      )}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-border-color flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center space-x-6">
             <h2 className="text-lg font-semibold text-text-main">
                {navItems.find(i => i.id === currentView)?.label || 'Ürün Detayı'}
             </h2>

          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ürün Ara..." 
                className="pl-9 pr-4 py-1.5 bg-bg-main border border-border-color rounded-lg text-sm w-60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2" />
            </div>
            <button className="text-text-muted hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 border-l border-border-color pl-6">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">AL</div>
              <span className="text-sm font-semibold text-text-main">Yönetici</span>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="p-6 flex-1 max-w-[1600px] w-full mx-auto">
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} onProductClick={navigateToProduct} />}
          {currentView === 'products' && (
            <ProductList 
              onAddProduct={() => setCurrentView('product-wizard')} 
              onProductClick={navigateToProduct}
            />
          )}
          {currentView === 'product-detail' && selectedProductId && (
             <ProductDetail 
                productId={selectedProductId} 
                onBack={() => setCurrentView('products')} 
                onEdit={() => setCurrentView('product-wizard')}
             />
          )}
          {currentView === 'product-wizard' && (
            <ProductWizard 
              productId={selectedProductId}
              settings={settings}
              onClose={() => {
                setCurrentView('products');
                setSelectedProductId(null);
              }} 
            />
          )}
          {currentView === 'income' && <Transactions initialType="Income" settings={settings} />}
          {currentView === 'expense' && <Transactions initialType="Expense" settings={settings} />}
          {currentView === 'recurring' && <RecurringPayments settings={settings} />}
          {currentView === 'analytics' && <Analytics settings={settings} />}
          {currentView === 'settings' && <SettingsView onUpdate={loadSettings} />}
        </div>
      </main>
    </div>
  );
}
