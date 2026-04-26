import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ArrowLeft, User, Phone, MapPin, Truck, Hash, Search, Plus, Trash2, Package } from 'lucide-react';

export default function SalesForm({ onBack }: { onBack: () => void }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    shipping_company: '',
    tracking_number: '',
  });

  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // { product_id, product_name, quantity, weight_per_unit }
  
  const [saving, setSaving] = useState(false);

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

  const handleAddItem = (product: any) => {
    setSelectedItems(prev => {
      const exists = prev.find(p => p.product_id === product.id);
      if (exists) {
        return prev.map(p => p.product_id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name || product.title,
        quantity: 1,
        weight_per_unit: product.weight || 0
      }];
    });
    setSearchQuery('');
  };

  const updateItemQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setSelectedItems(prev => prev.map(p => p.product_id === id ? { ...p, quantity: qty } : p));
  };

  const updateItemWeight = (id: string, weight: number) => {
    setSelectedItems(prev => prev.map(p => p.product_id === id ? { ...p, weight_per_unit: weight } : p));
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(p => p.product_id !== id));
  };

  const filteredProducts = products.filter(p => 
    (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (p.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (p.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  ).slice(0, 5); // show top 5 results

  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = selectedItems.reduce((sum, item) => sum + (item.weight_per_unit * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert('Lütfen en az bir ürün ekleyin.');
    
    setSaving(true);
    try {
      await api.post('/sales', {
        ...formData,
        total_quantity: totalQuantity,
        total_weight: totalWeight,
        total_amount: 0,
        items: selectedItems.map(item => ({
          ...item,
          weight: item.weight_per_unit * item.quantity
        }))
      });
      onBack();
    } catch (err) {
      console.error(err);
      alert('Satış eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-border-color overflow-hidden">
      <div className="px-6 py-4 border-b border-border-color flex items-center justify-between bg-bg-main/50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-main" />
          </button>
          <h2 className="text-xl font-black text-text-main">Yeni Satış Ekle</h2>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* MÜŞTERİ BİLGİLERİ */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Müşteri Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  required
                  type="text" 
                  placeholder="Müşteri Adı / Ünvanı" 
                  value={formData.customer_name}
                  onChange={e => setFormData({...formData, customer_name: e.target.value})}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:border-primary"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Telefon" 
                  value={formData.customer_phone}
                  onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:border-primary"
                />
              </div>
              <div className="relative md:col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <textarea 
                  rows={2}
                  placeholder="Teslimat Adresi" 
                  value={formData.customer_address}
                  onChange={e => setFormData({...formData, customer_address: e.target.value})}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* KARGO BİLGİLERİ */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Kargo Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Truck className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Kargo Firması (Örn: Yurtiçi, Aras, MNG)" 
                  value={formData.shipping_company}
                  onChange={e => setFormData({...formData, shipping_company: e.target.value})}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:border-primary"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Takip Numarası" 
                  value={formData.tracking_number}
                  onChange={e => setFormData({...formData, tracking_number: e.target.value})}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* SİPARİŞ İÇERİĞİ (ÜRÜNLER) */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Sipariş Edilen Ürünler
            </h3>
            
            <div className="mb-4 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ürün adı veya Stok Kodu ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 shadow-sm rounded-xl text-sm font-medium outline-none focus:ring-2 focus:border-primary"
                />
              </div>

              {searchQuery && (
                <div className="absolute z-10 top-full mt-2 w-full bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden">
                  {filteredProducts.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {filteredProducts.map(p => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => handleAddItem(p)}
                            className="w-full text-left px-4 py-3 hover:bg-bg-main flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="font-bold text-sm text-text-main">{p.name || p.title}</div>
                              {p.sku && <div className="text-xs text-text-muted mt-0.5">SKU: {p.sku}</div>}
                            </div>
                            <Plus className="w-5 h-5 text-primary" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">Ürün bulunamadı.</div>
                  )}
                </div>
              )}
            </div>

            {selectedItems.length > 0 && (
              <div className="bg-bg-main border border-border-color rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100/50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Ürün</th>
                        <th className="px-4 py-3 w-32 text-center">Adet</th>
                        <th className="px-4 py-3 w-40 text-center">Birim Ağırlık (kg)</th>
                        <th className="px-4 py-3 w-32 text-center">Toplam (kg)</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedItems.map((item) => (
                        <tr key={item.product_id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-bold text-text-main">{item.product_name}</td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                              className="w-full text-center border-gray-300 rounded-lg py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number"
                              step="0.01" 
                              min="0"
                              value={item.weight_per_unit}
                              onChange={(e) => updateItemWeight(item.product_id, parseFloat(e.target.value) || 0)}
                              className="w-full text-center border-gray-300 rounded-lg py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-primary">
                            {(item.weight_per_unit * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button type="button" onClick={() => removeItem(item.product_id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              </div>
            )}
            
            {/* HESAPLANAN TOPLAMLAR */}
            {selectedItems.length > 0 && (
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col items-center sm:items-start">
                  <div className="text-sm font-bold text-primary uppercase tracking-wider">Toplam Sipariş Miktarı</div>
                  <div className="text-3xl font-black text-gray-800">{totalQuantity} <span className="text-lg text-gray-500 font-semibold">adet</span></div>
                </div>
                <div className="flex flex-col items-center sm:items-end">
                  <div className="text-sm font-bold text-primary uppercase tracking-wider">Toplam Kargo Ağırlığı</div>
                  <div className="text-3xl font-black text-primary">{totalWeight.toFixed(2)} <span className="text-lg text-primary/70 font-semibold">kg</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-border-color flex justify-end gap-4">
             <button type="button" onClick={onBack} className="px-6 py-3 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
               İptal
             </button>
             <button disabled={saving} type="submit" className="px-8 py-3 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-all disabled:opacity-50">
               {saving ? 'Kaydediliyor...' : 'Satışı Kaydet'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
