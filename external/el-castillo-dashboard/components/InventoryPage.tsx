
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, DollarSign, Archive, Settings, 
  ArrowRightLeft, RefreshCw, Briefcase, CheckCircle2, XCircle,
  Plus, Search, Filter, Edit2, Copy, Trash2, Save, X, ShoppingCart, 
  Image as ImageIcon, MoreVertical, Tag, Truck, UploadCloud, ChevronDown, 
  Layers, Palette, Ruler, AlertTriangle, Eye, CreditCard, Wallet, Users,
  Percent, CalendarClock, ShieldCheck, BarChart3, TrendingUp, TrendingDown,
  Download, Calendar, AlertOctagon, ArrowUp, ArrowDown, Clock, ChevronLeft, ChevronRight,
  Target, Shield
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, Pie, Legend, PieChart
} from 'recharts';
import StoreService from '../StoreService';
import { InventoryLot, StockMovement, InstallmentPlan, FinancialRule, FinanceTermType, LoanRequest, StoreOrder, StoreProduct, StoreCategory, ProductVariant, VariantAttributes, AnalyticsSummary, SalesSeriesData, ProductPerformance, InventoryAging, PurchaseOrder, ProductVariant as PVType, CategoryPerformance, CostCenter } from '../types';

const ROLES_MOCK = [
    { id: 1, name: 'ADMINISTRADOR' },
    { id: 2, name: 'MONITOR' },
    { id: 3, name: 'MODELO' },
    { id: 4, name: 'CONTABILIDAD' },
    { id: 5, name: 'SOPORTE' }
];

const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'PRODUCTS' | 'PURCHASES' | 'KARDEX' | 'FINANCE' | 'CONFIG'>('ANALYTICS');
  
  // Data States
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loans, setLoans] = useState<InstallmentPlan[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanRequest[]>([]);
  const [pendingOrders, setPendingOrders] = useState<StoreOrder[]>([]);
  const [financialRules, setFinancialRules] = useState<FinancialRule[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Tab Scrolling Logic
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = tabsRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      checkScroll();
    }
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const amount = 200;
      tabsRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [inv, loanData, reqData, orderData, prods, cats, ccRes] = await Promise.all([
            StoreService.getInventory(),
            StoreService.getLoans(),
            StoreService.getLoanRequests(),
            StoreService.getOrders(),
            StoreService.getProducts(),
            StoreService.getCategories(),
            StoreService.getCostCenters()
        ]);
        
        setLots(inv.lots);
        setMovements(inv.movements);
        setLoans(loanData);
        setPendingLoans(reqData.filter(r => r.status === 'PENDING_APPROVAL'));
        setPendingOrders(orderData.filter(o => o.status === 'PENDING_APPROVAL'));
        setProducts(prods);
        setCategories(cats);
        setCostCenters(ccRes);

        // Fetch rules for all roles
        const rulesPromises = ROLES_MOCK.map(role => StoreService.getFinancialRules(role.id));
        const allRules = await Promise.all(rulesPromises);
        setFinancialRules(allRules.flat());

    } catch (error) {
        console.error("Failed to load inventory data", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveProduct = async (product: Partial<StoreProduct>) => {
      try {
          if (product.id) {
              await StoreService.updateProduct(product.id, product);
          } else {
              await StoreService.createProduct(product);
          }
          setIsProductFormOpen(false);
          setEditingProduct(null);
          loadData();
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleRegisterPurchase = async (purchaseData: any) => {
      try {
          await StoreService.registerPurchase(purchaseData);
          setIsPurchaseModalOpen(false);
          alert('Compra registrada y stock actualizado.');
          loadData();
      } catch (e: any) {
          alert(e.message);
      }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search));

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-800"><Archive size={28} /></div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inventario y Compras</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium pl-14">Centralización total de suministros, activos y flujo de caja interno.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
                onClick={loadData} 
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-500 shadow-sm active:scale-95"
                title="Recargar Sincronización"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin text-amber-500' : ''} />
            </button>
            {activeTab === 'PRODUCTS' && (
                <button 
                    onClick={() => { setEditingProduct(null); setIsProductFormOpen(true); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-amber-400 font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95 text-[10px] uppercase tracking-[0.2em]"
                >
                    <Plus size={18} /> NUEVO PRODUCTO
                </button>
            )}
            {activeTab === 'PURCHASES' && (
                <button 
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 text-[10px] uppercase tracking-[0.2em]"
                >
                    <Truck size={18} /> REGISTRAR COMPRA
                </button>
            )}
        </div>
      </div>

      {/* RE-DESIGNED TABS NAVIGATION WITH SCROLL ASSISTANCE */}
      <div className="relative group max-w-full">
        {/* Shadow Indicators for Overflow */}
        <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Scroll Buttons */}
        {showLeftArrow && (
            <button 
                onClick={() => scrollTabs('left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:text-amber-500 hover:scale-110 transition-all animate-in fade-in zoom-in"
            >
                <ChevronLeft size={20} strokeWidth={3} />
            </button>
        )}
        {showRightArrow && (
            <button 
                onClick={() => scrollTabs('right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:text-amber-500 hover:scale-110 transition-all animate-in fade-in zoom-in"
            >
                <ChevronRight size={20} strokeWidth={3} />
            </button>
        )}

        <div 
            ref={tabsRef}
            className="flex bg-white/50 backdrop-blur-sm p-2 rounded-[28px] border border-slate-200/60 w-full shadow-sm overflow-x-auto no-scrollbar gap-1"
        >
            {[
                { id: 'ANALYTICS', label: 'Dashboard Analítico', icon: BarChart3 },
                { id: 'PRODUCTS', label: 'Productos (Maestro)', icon: Package },
                { id: 'PURCHASES', label: 'Compras / Entradas', icon: Truck },
                { id: 'KARDEX', label: 'Movimientos / Kardex', icon: ArrowRightLeft },
                { id: 'FINANCE', label: 'Aprobaciones & Cartera', icon: DollarSign },
                { id: 'CONFIG', label: 'Configuración', icon: Settings }
            ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center gap-2.5 px-6 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap relative
                            ${isActive 
                                ? 'bg-slate-900 text-amber-400 shadow-xl shadow-slate-900/30 ring-1 ring-slate-800 scale-[1.02]' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white transition-all hover:shadow-sm'
                            }
                        `}
                    >
                        <tab.icon size={16} className={`${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                        {tab.label}
                        {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full"></div>}
                    </button>
                );
            })}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden min-h-[600px] flex flex-col transition-all duration-500">
          {activeTab === 'ANALYTICS' && ( <AnalyticsDashboard /> )}
          {activeTab === 'PRODUCTS' && (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center gap-4">
                      <div className="relative flex-1 max-w-md group">
                          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                          <input 
                            type="text" 
                            placeholder="Buscar en el catálogo maestro..." 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 transition-all shadow-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50/50">
                              <tr>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Venta</th>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Total</th>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {filteredProducts.map(p => (
                                  <tr key={p.id} className="hover:bg-amber-50/10 group transition-colors">
                                      <td className="px-8 py-5">
                                          <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                                                  <img src={p.images[0]?.url_thumb} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                              </div>
                                              <div>
                                                  <p className="text-sm font-black text-slate-900 tracking-tight">{p.name}</p>
                                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">SKU: {p.variants[0]?.sku}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-8 py-5">
                                          <span className="inline-flex items-center px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                              {categories.find(c => c.id === p.category_id)?.name}
                                          </span>
                                      </td>
                                      <td className="px-8 py-5 text-right font-mono text-sm font-black text-slate-800">
                                          ${p.price_base.toLocaleString()}
                                      </td>
                                      <td className="px-8 py-5 text-center">
                                          <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight ${p.total_stock > p.min_stock ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : p.total_stock > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                              {p.total_stock} {p.unit || 'Und'}
                                          </span>
                                      </td>
                                      <td className="px-8 py-5 text-center">
                                          <div className={`w-2.5 h-2.5 rounded-full mx-auto shadow-sm ${p.is_active ? 'bg-emerald-500 ring-4 ring-emerald-500/10' : 'bg-slate-300'}`}></div>
                                      </td>
                                      <td className="px-8 py-5 text-right">
                                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                              <button onClick={() => { setEditingProduct(p); setIsProductFormOpen(true); }} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all active:scale-90 shadow-sm"><Edit2 size={16} /></button>
                                              <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:shadow-lg transition-all active:scale-90 shadow-sm"><Copy size={16} /></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
          
          {activeTab === 'PURCHASES' && ( <div className="p-20 text-center text-slate-300 flex flex-col items-center"><Truck size={64} className="opacity-10 mb-4" /><p className="font-black uppercase tracking-[0.2em] text-xs">Módulo Compras en Desarrollo</p></div> )}
          {activeTab === 'KARDEX' && ( <div className="p-20 text-center text-slate-300 flex flex-col items-center"><ArrowRightLeft size={64} className="opacity-10 mb-4" /><p className="font-black uppercase tracking-[0.2em] text-xs">Historial de Movimientos</p></div> )}
          {activeTab === 'FINANCE' && ( <div className="p-20 text-center text-slate-300 flex flex-col items-center"><DollarSign size={64} className="opacity-10 mb-4" /><p className="font-black uppercase tracking-[0.2em] text-xs">Cartera y Créditos</p></div> )}
          {activeTab === 'CONFIG' && ( 
              <InventoryConfig 
                categories={categories} 
                financialRules={financialRules} 
                costCenters={costCenters} 
                roles={ROLES_MOCK}
              /> 
          )}
      </div>

      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={() => setIsProductFormOpen(false)} 
        product={editingProduct} 
        onSave={handleSaveProduct}
        categories={categories}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        products={products}
        onRegister={handleRegisterPurchase}
      />
    </div>
  );
};

// --- CONFIGURATION MODULE COMPONENT ---
const InventoryConfig: React.FC<{ categories: StoreCategory[], financialRules: FinancialRule[], costCenters: CostCenter[], roles: any[] }> = ({ categories, financialRules, costCenters, roles }) => {
    const [configTab, setConfigTab] = useState<'CATEGORIES' | 'FINANCE' | 'COST_CENTERS'>('CATEGORIES');

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Sub Tabs */}
            <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex gap-4 overflow-x-auto no-scrollbar">
                {[
                    { id: 'CATEGORIES', label: 'Gestión Categorías', icon: Layers },
                    { id: 'FINANCE', label: 'Reglas Financieras', icon: ShieldCheck },
                    { id: 'COST_CENTERS', label: 'Centros de Costos', icon: Target }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setConfigTab(tab.id as any)}
                        className={`
                            px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2
                            ${configTab === tab.id ? 'bg-slate-900 text-amber-400 shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-8 flex-1">
                {configTab === 'CATEGORIES' && (
                    <div className="space-y-6 max-w-4xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Categorías del Sistema</h3>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-amber-400 font-black rounded-xl text-[9px] uppercase tracking-widest">
                                <Plus size={14} /> AÑADIR CATEGORÍA
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                            <Tag size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">SLUG: {cat.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900"><Edit2 size={14} /></button>
                                        <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {configTab === 'FINANCE' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Política de Créditos Internos</h3>
                                <p className="text-xs text-slate-500 font-medium">Define límites y tasas de interés por perfil operativo.</p>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-amber-400 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-95">
                                <Save size={16} /> GUARDAR POLÍTICA GLOBAL
                            </button>
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol / Perfil</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permite Crédito</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto Máx.</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plazo Máx.</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Interés %</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aprobación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {roles.map(role => {
                                        const rule = financialRules.find(r => r.role_id === role.id && r.term_type === 'LOAN');
                                        return (
                                            <tr key={role.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <span className="font-bold text-slate-900 text-sm">{role.name}</span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <button className={`w-10 h-6 rounded-full relative transition-colors ${rule?.allowed ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${rule?.allowed ? 'left-5' : 'left-1'}`}></div>
                                                    </button>
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono text-sm font-bold text-slate-700">
                                                    ${rule?.max_amount?.toLocaleString() || '0'}
                                                </td>
                                                <td className="px-8 py-5 text-center text-xs font-black text-slate-500">
                                                    {rule?.max_periods || 0} Meses
                                                </td>
                                                <td className="px-8 py-5 text-center text-xs font-black text-indigo-600 bg-indigo-50/30">
                                                    {rule?.interest_rate || 0}%
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <div className={`w-2.5 h-2.5 rounded-full mx-auto ${rule?.requires_approval ? 'bg-amber-400 ring-4 ring-amber-400/10' : 'bg-slate-300'}`}></div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {configTab === 'COST_CENTERS' && (
                    <div className="space-y-6 max-w-4xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Centros de Costos Operativos</h3>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-amber-400 font-black rounded-xl text-[9px] uppercase tracking-widest">
                                <Plus size={14} /> NUEVO CENTRO
                            </button>
                        </div>
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Centro</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {costCenters.map(cc => (
                                        <tr key={cc.id} className="hover:bg-slate-50/50">
                                            <td className="px-8 py-4 font-mono text-sm font-bold text-slate-500">{cc.code}</td>
                                            <td className="px-8 py-4 font-bold text-slate-900 text-sm">{cc.name}</td>
                                            <td className="px-8 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ANALYTICS DASHBOARD COMPONENT ---
const AnalyticsDashboard: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const past = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(past);
    const [endDate, setEndDate] = useState(today);
    
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [salesSeries, setSalesSeries] = useState<SalesSeriesData[]>([]);
    const [topSelling, setTopSelling] = useState<ProductPerformance[]>([]);
    const [topProfitable, setTopProfitable] = useState<ProductPerformance[]>([]);
    const [categorySplit, setCategorySplit] = useState<CategoryPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<string | null>(null);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [sum, ser, sell, prof, cat] = await Promise.all([
                StoreService.getAnalyticsSummary(startDate, endDate),
                StoreService.getSalesSeries(startDate, endDate),
                StoreService.getTopSellingProducts(startDate, endDate, 10),
                StoreService.getTopProfitableProducts(startDate, endDate, 10),
                StoreService.getCategorySplit(startDate, endDate)
            ]);
            setSummary(sum);
            setSalesSeries(ser);
            setTopSelling(sell);
            setTopProfitable(prof);
            setCategorySplit(cat);
            setLastUpdate(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        } catch (e) {
            console.error("Error loading analytics", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const CAT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 flex flex-col xl:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-[20px] shadow-inner">
                        <div className="flex items-center gap-3 px-4 border-r border-slate-200">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Desde</span>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="bg-transparent text-xs font-black text-slate-800 outline-none w-32"
                            />
                        </div>
                        <div className="flex items-center gap-3 px-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Hasta</span>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="bg-transparent text-xs font-black text-slate-800 outline-none w-32"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={loadAnalytics}
                        className="px-6 py-3 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:shadow-xl transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                    >
                        Filtrar Periodo
                    </button>
                </div>

                <div className="text-right flex items-center gap-6">
                    <div className="hidden md:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Última Sincronización</p>
                        <p className="text-xs font-bold text-slate-900">{lastUpdate || '---'}</p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm">
                        <Download size={14} /> Reporte PDF
                    </button>
                </div>
            </div>

            {loading || !summary ? (
                <div className="p-32 text-center text-slate-300 flex flex-col items-center">
                    <RefreshCw size={48} className="animate-spin mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">Procesando métricas...</p>
                </div>
            ) : (
                <div className="p-8 space-y-10 animate-in fade-in duration-700">
                    
                    {/* KPI CARDS - FINANCIALS */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        <KPICard title="Ventas Netas" value={`$${summary.net_sales.toLocaleString()}`} sub="Base Imponible" color="indigo" />
                        <KPICard title="IVA (Tax)" value={`$${summary.tax_collected.toLocaleString()}`} sub="IVA 19% Recaudado" color="slate" />
                        <KPICard title="Margen Real" value={`$${summary.gross_profit.toLocaleString()}`} sub={`${summary.margin_percent.toFixed(1)}% de Retorno`} color="emerald" />
                        <KPICard title="Costo Ventas" value={`$${summary.cogs.toLocaleString()}`} sub="Valoración FIFO" color="amber" />
                        <KPICard title="Facturación" value={`$${summary.gross_sales.toLocaleString()}`} sub="Total Ingresos" color="blue" />
                    </div>

                    {/* MAIN CHARTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-[450px] relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-amber-400"></div>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Curva de Rendimiento</h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase"><div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div> Ventas</div>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Utilidad</div>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height="80%">
                                <AreaChart data={salesSeries}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0F172A" stopOpacity={0.08}/>
                                            <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={v => v.slice(8)} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={v => `$${v/1000}k`} />
                                    <Tooltip contentStyle={{borderRadius: '24px', border:'none', boxShadow:'0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px'}} formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                                    <Area type="monotone" dataKey="net_sales" stroke="#0F172A" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                    <Line type="monotone" dataKey="gross_profit" stroke="#10B981" strokeWidth={3} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-[450px]">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Composición Catálogo</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categorySplit}
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="net_sales"
                                        stroke="none"
                                    >
                                        {categorySplit.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '20px', border:'none', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}} formatter={(value: number) => `$${value.toLocaleString()}`} />
                                    <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '9px', fontWeight: '900', paddingTop: '20px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TABLES ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                        <ProductRankingTable 
                            title="Líderes de Rotación" 
                            data={topSelling} 
                            type="sales" 
                            onSelectProduct={(id) => setSelectedProductForAnalysis(id)}
                        />
                        <ProductRankingTable 
                            title="Líderes de Rentabilidad" 
                            data={topProfitable} 
                            type="profit" 
                            onSelectProduct={(id) => setSelectedProductForAnalysis(id)}
                        />
                    </div>

                </div>
            )}

            {selectedProductForAnalysis && (
                <ProductAnalyticsModal 
                    productId={selectedProductForAnalysis} 
                    onClose={() => setSelectedProductForAnalysis(null)} 
                />
            )}
        </div>
    );
};

const KPICard: React.FC<{ title: string, value: string, sub: string, color?: 'slate' | 'emerald' | 'amber' | 'red' | 'blue' | 'indigo' }> = ({ title, value, sub, color = 'slate' }) => {
    const colorStyles = {
        slate: 'bg-white border-slate-100 text-slate-900',
        emerald: 'bg-emerald-50/40 border-emerald-100 text-emerald-900',
        amber: 'bg-amber-50/40 border-amber-100 text-amber-900',
        red: 'bg-red-50/40 border-red-100 text-red-900',
        blue: 'bg-blue-50/40 border-blue-100 text-blue-900',
        indigo: 'bg-indigo-50/40 border-indigo-100 text-indigo-900'
    };

    return (
        <div className={`p-6 rounded-[32px] border shadow-sm transition-all hover:shadow-md h-36 flex flex-col justify-between ${colorStyles[color]}`}>
            <div>
                <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em]">{title}</p>
                <h3 className="text-2xl font-black mt-2 tracking-tighter leading-none">{value}</h3>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-40`}></div> {sub}
            </p>
        </div>
    );
};

const ProductRankingTable: React.FC<{ title: string, data: ProductPerformance[], type: 'sales' | 'profit', onSelectProduct?: (id: string) => void }> = ({ title, data, type, onSelectProduct }) => (
    <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-full">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">{title}</h3>
            <ChevronRight size={16} className="text-slate-300" />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pos. / Ítem</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Unidades</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Facturado</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{type === 'sales' ? 'Despacho' : 'Margen'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sin registros</td></tr>
                    ) : (
                        data.map((p, idx) => (
                            <tr 
                                key={p.id} 
                                className="hover:bg-slate-50 cursor-pointer transition-all active:bg-slate-100"
                                onClick={() => onSelectProduct && onSelectProduct(p.id)}
                            >
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-slate-300 w-4">{idx + 1}</span>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{p.name}</p>
                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">{p.sku}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-[10px]">{p.units_sold}</span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <span className="text-[10px] font-black text-slate-900">${p.net_sales.toLocaleString()}</span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    {type === 'sales' ? (
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-[10px]">{p.avg_days_to_sell}d</span>
                                    ) : (
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-[10px] ${p.margin_percent > 30 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {p.margin_percent.toFixed(1)}%
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const ProductAnalyticsModal: React.FC<{ productId: string, onClose: () => void }> = ({ productId, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await StoreService.getProductAnalytics(productId);
                setData(res);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [productId]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
            <div className="relative bg-white w-full max-w-5xl rounded-[50px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-10 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-indigo-900 text-white rounded-[24px] shadow-lg"><BarChart3 size={28} /></div>
                            Visión del Producto
                        </h3>
                        <p className="text-sm text-slate-500 font-black uppercase tracking-[0.2em] mt-3">{loading ? 'Procesando historial...' : data?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-400 shadow-sm active:scale-90"><X size={24} /></button>
                </div>

                {!loading && data ? (
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Facturación Acumulada</p>
                                <p className="text-4xl font-black text-slate-900 mt-3 tracking-tighter">${data.total_revenue.toLocaleString()}</p>
                                <p className="text-xs font-black text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp size={14} /> {data.total_sold_units} Unidades Despachadas</p>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rendimiento Neto</p>
                                <p className="text-4xl font-black text-slate-900 mt-3 tracking-tighter">{data.avg_margin}%</p>
                                <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden shadow-inner">
                                    <div className="h-full bg-indigo-600 shadow-lg" style={{ width: `${Math.min(data.avg_margin, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Días en Bodega (DSI)</p>
                                <p className="text-4xl font-black text-slate-900 mt-3 tracking-tighter">{data.turnover_days} Días</p>
                                <p className="text-xs font-black text-slate-500 mt-2 flex items-center gap-1"><CalendarClock size={14} /> Promedio de Liquidación</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-32 text-slate-200">
                        <RefreshCw size={64} className="animate-spin opacity-20 mb-4" />
                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Cargando analítica avanzada...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ... ProductForm and PurchaseModal (Minimal implementation for compile)
const ProductForm: React.FC<{ isOpen: boolean, onClose: () => void, product: StoreProduct | null, onSave: (p: any) => void, categories: StoreCategory[] }> = ({ isOpen, onClose, product, onSave, categories }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
            <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ficha Técnica de Producto</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
                </div>
                <div className="flex justify-end gap-3 mt-10">
                    <button onClick={onClose} className="px-8 py-3.5 rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
                    <button onClick={() => onSave({ name: 'Nuevo Producto', price_base: 0 })} className="px-8 py-3.5 rounded-2xl bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all">Guardar Catálogo</button>
                </div>
            </div>
        </div>
    );
};

const PurchaseModal: React.FC<{ isOpen: boolean, onClose: () => void, products: StoreProduct[], onRegister: (data: any) => void }> = ({ isOpen, onClose, products, onRegister }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
            <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Truck className="text-emerald-500" /> Registrar Nueva Compra</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
                </div>
                <div className="flex justify-end gap-3 mt-10">
                    <button onClick={onClose} className="px-8 py-3.5 rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Descartar</button>
                    <button onClick={() => onRegister({})} className="px-8 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all">Procesar Entrada</button>
                </div>
            </div>
        </div>
    );
};

export default InventoryPage;
