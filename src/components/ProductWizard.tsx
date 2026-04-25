import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Trash2,
  Package,
  CircleDollarSign,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api, PLATFORMS, MATERIALS } from '../lib/api';
import { Product, Settings } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductWizardProps {
  productId?: string | null;
  settings?: Settings | null;
  onClose: () => void;
}

const DEFAULT_MODELS = ["Baggy", "Slim", "Regular", "Oversize", "Crop", "Basic", "Premium"];

export default function ProductWizard({ productId, settings, onClose }: ProductWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;

  const [formData, setFormData] = useState<any>({
    name: '',
    title: '',
    warehouse_location: '',
    sku: '',
    barcode: '',
    category: '',
    model: 'Regular',
    description: '',
    purchase_cost: 0,
    sale_price: 0,
    status: 'Active',
    notes: '',
    platforms: PLATFORMS.map(name => ({ name, stock: 0, price: 0, is_listed: true }))
  });

  useEffect(() => {
    if (settings && !formData.category && !productId) {
      setFormData((prev: any) => ({ ...prev, category: settings.product_categories[0] }));
    }
  }, [settings, productId]);

  const [images, setImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await api.get(`/products/${productId}`);
      setFormData({
        ...data,
        platforms: PLATFORMS.map(name => {
          const p = data.platforms.find((dp: any) => dp.platform_name === name);
          return p ? { name, stock: p.stock, price: p.price, is_listed: !!p.is_listed } : { name, stock: 0, price: data.sale_price, is_listed: false };
        })
      });
      setImages(data.images || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (index: number, field: string, value: any) => {
    const newPlatforms = [...formData.platforms];
    newPlatforms[index] = { ...newPlatforms[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, platforms: newPlatforms }));
  };

  const handleFileChange = (e: any) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      setNewImages(prev => [...prev, ...files]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (id: string) => {
    try {
      await api.delete(`/images/${id}`);
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (err) {
       alert("Görsel silinemedi");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let savedId = productId;
      if (productId) {
        await api.put(`/products/${productId}`, formData);
      } else {
        const res = await api.post('/products', formData);
        savedId = res.id;
      }

      if (newImages.length > 0 && savedId) {
        const fd = new FormData();
        newImages.forEach(img => fd.append('images', img));
        await api.upload(`/products/${savedId}/images`, fd);
      }

      onClose();
    } catch (err) {
      alert("Hata oluştu, lütfen alanları kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="px-5 lg:px-8 py-4 lg:py-6 border-b border-border-color flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-text-main tracking-tight">{productId ? 'Ürünü Düzenle' : 'Yeni Ürün Kaydı'}</h2>
            <p className="text-[9px] lg:text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Adım {step} / {totalSteps}: {getStepLabel(step)}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg-main rounded-xl text-text-muted hover:text-text-main transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-border-color">
           <div 
             className="h-full bg-primary transition-all duration-500 ease-out" 
             style={{ width: `${(step / totalSteps) * 100}%` }}
           ></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 bg-white">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Ürün Adı" required>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Örn: Siyah T-Shirt"
                    className="form-input" 
                  />
                </Field>
                <Field label="Ürün Başlığı (Platformlarda Görünecek)" required>
                  <input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    placeholder="Örn: Pamuklu Siyah T-Shirt - %100 Pamuk"
                    className="form-input" 
                  />
                </Field>
                <Field label="Depo Lokasyonu">
                  <input 
                    name="warehouse_location" 
                    value={formData.warehouse_location} 
                    onChange={handleInputChange} 
                    placeholder="Örn: Raf A-12"
                    className="form-input" 
                  />
                </Field>
                <Field label="SKU / Stok Kodu">
                  <input 
                    name="sku" 
                    value={formData.sku} 
                    onChange={handleInputChange} 
                    placeholder="Otomatik oluşturulur..."
                    className="form-input font-mono" 
                  />
                </Field>
                <Field label="Barkod No (EAN/UPC)">
                  <input 
                    name="barcode" 
                    value={formData.barcode} 
                    onChange={handleInputChange} 
                    placeholder="Barkod giriniz"
                    className="form-input font-mono" 
                  />
                </Field>
                <Field label="Ürün Durumu">
                   <select name="status" value={formData.status} onChange={handleInputChange} className="form-input font-bold">
                     <option value="Active">Aktif</option>
                     <option value="Passive">Pasif</option>
                     <option value="Out of stock">Tükendi</option>
                   </select>
                </Field>
              </div>
              <Field label="Dahili Notlar">
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  placeholder="Dahili notlar..."
                  className="form-input min-h-[100px] py-3 resize-none"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Field label="Ürün Kategorisi">
                    <div className="grid grid-cols-2 gap-3">
                      {settings?.product_categories.map(c => (
                        <button 
                          key={c} 
                          type="button"
                          onClick={() => setFormData((prev: any) => ({ ...prev, category: c }))}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-left",
                            formData.category === c ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-border-color text-text-muted hover:bg-bg-main"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                 </Field>
                 <Field label="Model / Sınıflandırma">
                    <div className="grid grid-cols-2 gap-3">
                       {DEFAULT_MODELS.map(c => (
                         <button 
                           key={c}
                           type="button"
                           onClick={() => setFormData((prev: any) => ({ ...prev, model: c }))}
                           className={cn(
                             "px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-left",
                             formData.model === c ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-border-color text-text-muted hover:bg-bg-main"
                           )}
                         >
                           {c}
                         </button>
                       ))}
                    </div>
                 </Field>
               </div>
             </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-bg-main rounded-2xl border border-border-color">
                <Field label="Alış Maliyeti (₺)">
                   <div className="relative">
                      <div className="absolute left-4 top-3 text-text-muted font-bold text-sm">₺</div>
                      <input 
                        type="number" 
                        name="purchase_cost" 
                        value={formData.purchase_cost} 
                        onChange={handleInputChange} 
                        className="form-input pl-10 font-bold" 
                      />
                   </div>
                </Field>
                <Field label="Satış Fiyatı (₺)">
                   <div className="relative">
                      <div className="absolute left-4 top-3 text-text-muted font-bold text-sm">₺</div>
                      <input 
                        type="number" 
                        name="sale_price" 
                        value={formData.sale_price} 
                        onChange={handleInputChange} 
                        className="form-input pl-10 font-bold" 
                      />
                   </div>
                </Field>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Stok ve Platform Fiyatları
                </h3>
                <div className="card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-bg-main text-[10px] uppercase font-bold text-text-muted tracking-widest border-b border-border-color">
                        <th className="px-6 py-3">Platform</th>
                        <th className="px-6 py-3">Stok Adedi</th>
                        <th className="px-6 py-3">Özel Fiyat (₺)</th>
                        <th className="px-6 py-3">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {formData.platforms.map((p: any, idx: number) => (
                        <tr key={p.name} className="hover:bg-bg-main transition-colors">
                          <td className="px-6 py-4 font-bold text-text-main">{p.name}</td>
                          <td className="px-6 py-4">
                            <input 
                              type="number" 
                              value={p.stock}
                              onChange={(e) => handlePlatformChange(idx, 'stock', parseInt(e.target.value))}
                              className="w-24 px-3 py-1.5 bg-white border border-border-color rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" 
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="number" 
                              value={p.price || formData.sale_price}
                              onChange={(e) => handlePlatformChange(idx, 'price', parseFloat(e.target.value))}
                              className="w-28 px-3 py-1.5 bg-white border border-border-color rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" 
                            />
                          </td>
                          <td className="px-6 py-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={p.is_listed}
                                hidden
                                onChange={(e) => handlePlatformChange(idx, 'is_listed', e.target.checked)}
                              />
                              <div className={cn(
                                "w-10 h-5 rounded-full transition-all relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all shadow-inner",
                                p.is_listed ? "bg-success after:translate-x-5" : "bg-text-muted/30"
                              )}></div>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <Field label="Ürün İçeriği / Açıklama">
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="form-input min-h-[160px] py-4 resize-none"
                  placeholder="Satış platformlarında yayınlanacak detaylı içerik metni..."
                />
              </Field>

              <div className="space-y-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Ürün Görselleri</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                   {images.map((img) => (
                     <div key={img.id} className="aspect-square bg-bg-main rounded-xl relative border border-border-color overflow-hidden group p-2">
                       <img src={img.path} className="w-full h-full object-contain" />
                       <button 
                         onClick={() => deleteExistingImage(img.id)}
                         className="absolute top-1.5 right-1.5 p-1.5 bg-white shadow-md rounded-lg text-danger hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity border border-border-color"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   ))}
                   {newImages.map((file, idx) => (
                      <div key={idx} className="aspect-square bg-bg-main rounded-xl relative border border-border-color overflow-hidden group p-2">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-contain opacity-60" />
                        <button 
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-white shadow-md rounded-lg text-danger hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity border border-border-color"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center p-1.5">
                           <p className="text-[9px] font-bold text-primary bg-white/90 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-tighter">Yeni</p>
                        </div>
                      </div>
                   ))}
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-border-color rounded-xl flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary hover:bg-bg-main transition-all group"
                   >
                     <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-border-color flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                     </div>
                     <span className="text-[9px] font-bold uppercase tracking-widest px-2 text-center">Görsel Ekle</span>
                   </button>
                </div>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*" />
              </div>
            </div>
          )}

          {step === 5 && (
             <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-success border border-green-100 shadow-xl shadow-green-100/20">
                  <CheckCircle2 className="w-10 h-10" />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold text-text-main tracking-tight">Kayıt Hazır</h3>
                 <p className="text-text-muted text-sm max-w-sm mx-auto">Tüm bilgileri doldurduysanız ürününüzü kaydedebilirsiniz. Stoklar otomatik olarak platformlara dağıtılacaktır.</p>
               </div>
               
               <div className="w-full max-w-md bg-bg-main rounded-2xl border border-border-color p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted font-medium">Ürün Adı:</span>
                    <span className="font-bold text-text-main">{formData.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted font-medium">Platform Başlığı:</span>
                    <span className="font-bold text-text-main truncate max-w-[200px]">{formData.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted font-medium">Depo Lokasyonu:</span>
                    <span className="font-bold text-text-main">{formData.warehouse_location || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted font-medium">SKU:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-border-color text-xs font-bold">{formData.sku || 'Otomatik'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted font-medium">Platform Sayısı:</span>
                    <span className="font-bold text-primary">{formData.platforms.filter((p: any) => p.is_listed).length} Aktif Platform</span>
                  </div>
               </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 lg:px-8 py-4 lg:py-6 border-t border-border-color flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-bg-main gap-4 sm:gap-0">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto sm:space-x-4">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center px-5 py-2.5 bg-white border border-border-color text-text-main rounded-xl font-bold text-sm hover:shadow-sm active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Geri
              </button>
            ) : <div className="sm:hidden"></div>}

            <button 
               onClick={onClose}
               className="sm:hidden px-5 py-2.5 text-text-muted font-bold text-sm hover:text-text-main transition-colors"
             >
               Vazgeç
             </button>
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto">
             <button 
               onClick={onClose}
               className="hidden sm:block px-5 py-2.5 text-text-muted font-bold text-sm hover:text-text-main transition-colors"
             >
               Vazgeç
             </button>
             {step < totalSteps ? (
               <button 
                 onClick={() => setStep(step + 1)}
                 disabled={step === 1 && (!formData.name || !formData.title)}
                 className="flex-1 sm:flex-none btn-primary px-8 flex items-center justify-center h-11"
               >
                 <span>Devam Et</span>
                 <ChevronRight className="w-4 h-4 ml-2" />
               </button>
             ) : (
               <button 
                 onClick={handleSubmit}
                 disabled={loading}
                 className="flex-1 sm:flex-none flex items-center justify-center px-10 py-2.5 bg-success text-white rounded-xl font-bold text-sm shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all h-11"
               >
                 {loading ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
                 <CheckCircle2 className="w-4 h-4 ml-2" />
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string, required?: boolean, children: any }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-[#475569] flex items-center">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function getStepLabel(step: number) {
  switch (step) {
    case 1: return "Temel Bilgiler";
    case 2: return "Kategorizasyon";
    case 3: return "Fiyatlandırma & Stok";
    case 4: return "Görsel & İçerik";
    case 5: return "Özet & Onay";
    default: return "";
  }
}
