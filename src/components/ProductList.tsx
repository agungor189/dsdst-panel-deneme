import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Package, 
  MoreVertical,
  ChevronDown,
} from 'lucide-react';
import { api, formatCurrency } from '../lib/api';
import { Product } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductListProps {
  onAddProduct: () => void;
  onProductClick: (id: string) => void;
}

export default function ProductList({ onAddProduct, onProductClick }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Hepsi');
  const [filterStatus, setFilterStatus] = useState('Hepsi');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      (p.name?.toLowerCase().includes(searchLower)) || 
      (p.title?.toLowerCase().includes(searchLower)) || 
      (p.sku?.toLowerCase().includes(searchLower)) ||
      (p.barcode?.toLowerCase().includes(searchLower));
    const matchesCategory = filterCategory === 'Hepsi' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'Hepsi' || p.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['Hepsi', ...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-text-main tracking-tight">Ürün Yönetimi</h2>
          <p className="text-xs lg:text-sm text-text-muted">{products.length} toplam ürün listeleniyor.</p>
        </div>
        <button 
          onClick={onAddProduct}
          className="btn-primary px-6 py-2 leading-none flex items-center justify-center h-11 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-3 lg:p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 bg-white shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5 lg:top-3" />
          <input 
            type="text" 
            placeholder="Ürün Ara..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 lg:py-2.5 bg-bg-main rounded-xl lg:rounded-lg text-sm border border-border-color focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="flex-1 lg:flex-none flex items-center px-3 py-3 lg:py-2 bg-bg-main rounded-xl lg:rounded-lg border border-border-color">
            <Filter className="w-3.5 h-3.5 text-text-muted mr-2" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs lg:text-sm font-semibold outline-none cursor-pointer text-text-main w-full"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex bg-bg-main rounded-xl lg:rounded-lg p-1 border border-border-color">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 lg:p-1.5 rounded-lg lg:rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-primary" : "text-text-muted")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn("p-2 lg:p-1.5 rounded-lg lg:rounded-md transition-all", viewMode === 'table' ? "bg-white shadow-sm text-primary" : "text-text-muted")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {filteredProducts.map((p) => (
            <div 
              key={p.id}
              onClick={() => onProductClick(p.id)}
              className="group card overflow-hidden hover:shadow-md transition-all cursor-pointer relative bg-white"
            >
              <div className="aspect-square bg-bg-main relative">
                 {p.cover_image ? (
                   <img src={p.cover_image} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-4" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="flex items-center justify-center w-full h-full">
                     <Package className="w-8 h-8 text-border-color" />
                   </div>
                 )}
                 <div className="absolute top-2 right-2 shadow-sm">
                   <StatusBadge status={p.status} />
                 </div>
              </div>
              <div className="p-4">
                <p className="text-[9px] lg:text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{p.category}</p>
                <h3 className="font-bold text-text-main text-sm group-hover:text-primary transition-colors line-clamp-1 h-5">{p.name || p.title}</h3>
                <p className="text-[10px] text-text-muted font-mono mt-1">{p.sku}</p>
                
                <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-border-color flex items-center justify-between">
                   <p className="font-bold text-base text-text-main">{formatCurrency(p.sale_price)}</p>
                   <div className="text-right">
                     <p className={cn(
                       "text-xs font-bold", 
                       (p.total_stock || 0) < 10 ? "text-danger" : "text-success"
                     )}>
                       {p.total_stock || 0} Adet
                     </p>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-main text-[10px] uppercase tracking-widest text-text-muted font-extrabold border-b border-border-color">
                  <th className="px-4 lg:px-6 py-5">Ürün</th>
                  <th className="px-4 lg:px-6 py-5 hidden md:table-cell">Kategori</th>
                  <th className="px-4 lg:px-6 py-5 text-center">Stok</th>
                  <th className="px-4 lg:px-6 py-5">Fiyat</th>
                  <th className="px-4 lg:px-6 py-5 hidden sm:table-cell">Durum</th>
                  <th className="px-4 lg:px-6 py-5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {filteredProducts.map((p) => (
                  <tr key={p.id} onClick={() => onProductClick(p.id)} className="hover:bg-bg-main cursor-pointer group transition-colors">
                    <td className="px-4 lg:px-6 py-4 lg:py-5">
                      <div className="flex items-center space-x-3 lg:space-x-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-bg-main border border-border-color overflow-hidden p-1 flex items-center justify-center shrink-0">
                          {p.cover_image ? (
                            <img src={p.cover_image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-5 h-5 text-text-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors truncate">{p.name || p.title}</p>
                          <p className="text-[9px] lg:text-[10px] text-text-muted font-mono mt-0.5 uppercase tracking-tighter truncate">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 hidden md:table-cell">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-main px-2 py-1 rounded border border-border-color">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-center">
                      <span className={cn(
                        "font-bold text-sm px-2 lg:px-3 py-1 rounded-lg",
                        (p.total_stock || 0) < 10 ? "text-danger bg-red-50" : "text-text-main bg-bg-main"
                      )}>
                        {p.total_stock}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-sm font-extrabold text-text-main">{formatCurrency(p.sale_price)}</td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 hidden sm:table-cell"><StatusBadge status={p.status} /></td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-right">
                      <button className="p-2 hover:bg-white border border-transparent hover:border-border-color rounded-lg text-text-muted hover:text-primary transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-border-color">
          <Package className="w-16 h-16 text-border-color mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-main">Ürün bulunamadı</h3>
          <p className="text-text-muted mt-1">Arama kriterlerinizi değiştirmeyi deneyin.</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    'Active': 'bg-green-50/50 text-success border-green-100',
    'Passive': 'bg-bg-main text-text-muted border-border-color',
    'Out of stock': 'bg-red-50/50 text-danger border-red-100'
  };
  const labels = {
    'Active': 'Aktif',
    'Passive': 'Pasif',
    'Out of stock': 'Tükendi'
  };
  return (
    <span className={cn(
      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border",
      styles[status as keyof typeof styles] || styles.Passive
    )}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
