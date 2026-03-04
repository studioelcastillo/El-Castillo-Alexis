
import React, { useState, useMemo } from 'react';
import { 
  CreditCard, ShieldCheck, Users, Calendar, AlertTriangle, 
  CheckCircle2, Download, History, Zap, ChevronRight,
  TrendingUp, Award, Wallet, Info, Tag, ArrowRight, Check
} from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../constants';
import { SubscriptionData, BillingCycle, InvoiceRecord, PricingTier, WalletBalance } from '../types';

// --- MOCK DATA ---
const MOCK_SUBSCRIPTION: SubscriptionData = {
  status: 'ACTIVE',
  active_users_count: 24,
  current_tier_index: 1, 
  next_billing_date: '2025-06-15',
  days_until_due: 14,
  plan_name: 'Plan Ciudadela',
  autopay_enabled: true,
  last_payment_method: 'CARD'
};

const MOCK_WALLET: WalletBalance = {
    available: 45.00,
    pending: 10.00,
    currency: 'USD'
};

const MOCK_INVOICES: InvoiceRecord[] = [
  { id: 'INV-2025-001', date: '2025-05-15', amount: 80, cycle: 'Mensual', status: 'PAID', method: 'Tarjeta •••• 4242' },
  { id: 'INV-2025-002', date: '2025-04-15', amount: 80, cycle: 'Mensual', status: 'PAID', method: 'Wallet + Tarjeta' },
];

const MembershipPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PLAN' | 'HISTORY'>('PLAN');
  
  // Calculator State
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [activeUsers, setActiveUsers] = useState(24);
  const [couponCode, setCouponCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  
  // Derived Data
  const currentTier = useMemo(() => 
    SUBSCRIPTION_TIERS.find(t => activeUsers >= t.min && activeUsers <= t.max) || SUBSCRIPTION_TIERS[SUBSCRIPTION_TIERS.length - 1], 
  [activeUsers]);
  
  const nextTier = useMemo(() => 
    SUBSCRIPTION_TIERS.find(t => t.min === currentTier.max + 1), 
  [currentTier]);

  // Pricing Logic
  const calculateCosts = () => {
      const baseMonthly = currentTier.monthly_price;
      const annualPrice = currentTier.annual_price;
      
      let cyclePrice = 0;
      let months = 1;
      let discountLabel = '';

      switch (billingCycle) {
          case 'MONTHLY': 
            cyclePrice = baseMonthly; 
            months = 1; 
            break;
          case 'QUARTERLY': 
            cyclePrice = Math.ceil((baseMonthly * 3) * 0.97); // 3% off
            months = 3; 
            discountLabel = '3% OFF';
            break;
          case 'SEMIANNUAL': 
            cyclePrice = Math.ceil((baseMonthly * 6) * 0.93); // 7% off
            months = 6;
            discountLabel = '7% OFF';
            break;
          case 'ANNUAL': 
            cyclePrice = annualPrice; 
            months = 12;
            discountLabel = '16% OFF'; // Aprox 2 months free
            break;
      }

      const rawMonthlyEquivalent = cyclePrice / months;
      const totalSavings = (baseMonthly * months) - cyclePrice;
      
      // Coupons Logic (Simple Mock)
      let couponDiscount = 0;
      if (couponCode === 'PROMO20') couponDiscount = 20; // Fixed $20 off

      // Wallet Logic
      const subtotal = Math.max(0, cyclePrice - couponDiscount);
      const walletApplied = useWallet ? Math.min(MOCK_WALLET.available, subtotal) : 0;
      const finalDue = subtotal - walletApplied;

      return {
          cyclePrice,
          months,
          discountLabel,
          rawMonthlyEquivalent,
          totalSavings,
          couponDiscount,
          walletApplied,
          finalDue
      };
  };

  const costs = calculateCosts();

  const handleApplyCoupon = () => {
      if (couponCode !== 'PROMO20') alert("Cupón inválido (Prueba con PROMO20)");
  };

  const handleApplyReferral = () => {
      if (referralCode) alert("Código de referido validado. Se aplicará la recompensa tras 15 días.");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-800"><CreditCard size={28} /></div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Membresía</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium pl-14">Administra tu plan, simula costos y gestiona pagos.</p>
        </div>
        
        <div className={`flex items-center gap-3 px-5 py-3 border rounded-2xl ${MOCK_SUBSCRIPTION.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            {MOCK_SUBSCRIPTION.status === 'ACTIVE' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <div>
                <p className="text-xs font-black uppercase tracking-widest">{MOCK_SUBSCRIPTION.status === 'ACTIVE' ? 'Suscripción Activa' : 'Vencida'}</p>
                <p className="text-[10px] font-bold opacity-80">Próximo cobro: {MOCK_SUBSCRIPTION.next_billing_date}</p>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
         <button onClick={() => setActiveTab('PLAN')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PLAN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mi Plan</button>
         <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Historial</button>
      </div>

      {activeTab === 'PLAN' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column: Calculator & Plan Selection */}
              <div className="xl:col-span-2 space-y-8">
                  
                  {/* 1. Calculator Widget */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      
                      <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                          <TrendingUp size={20} className="text-amber-500" /> Calculadora de Plan
                      </h3>

                      <div className="mb-8">
                          <div className="flex justify-between items-end mb-4">
                              <div>
                                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{activeUsers}</span>
                                  <span className="text-sm font-bold text-slate-400 ml-2">Modelos Activos</span>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rango Actual</p>
                                  <p className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{currentTier.min} - {currentTier.max} Modelos</p>
                              </div>
                          </div>
                          
                          <input 
                            type="range" 
                            min="1" 
                            max="300" 
                            value={activeUsers} 
                            onChange={(e) => setActiveUsers(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                              <span>1 Modelo</span>
                              <span>300 Modelos</span>
                          </div>
                      </div>

                      {nextTier && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                              <Info size={18} className="text-indigo-500 mt-0.5" />
                              <p className="text-xs text-slate-600 font-medium">
                                  Estás a <strong>{nextTier.min - activeUsers} modelos</strong> del siguiente nivel. 
                                  Al subir, el costo unitario baja un ~10%.
                              </p>
                          </div>
                      )}
                  </div>

                  {/* 2. Billing Cycle Selector */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                          <Calendar size={20} className="text-slate-400" /> Elige tu ciclo de facturación
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {[
                              { id: 'MONTHLY', label: 'Mensual', discount: null, icon: Calendar },
                              { id: 'QUARTERLY', label: 'Trimestral', discount: 'Ahorra 3%', icon: Calendar },
                              { id: 'SEMIANNUAL', label: 'Semestral', discount: 'Ahorra 7%', icon: Calendar },
                              { id: 'ANNUAL', label: 'Anual', discount: '2 Meses Gratis', icon: CheckCircle2 }
                          ].map((cycle) => {
                              const isSelected = billingCycle === cycle.id;
                              // Calculate temp price for display
                              const tempRes = (function(){
                                  const base = currentTier.monthly_price;
                                  if (cycle.id === 'MONTHLY') return base;
                                  if (cycle.id === 'QUARTERLY') return Math.ceil((base*3)*0.97);
                                  if (cycle.id === 'SEMIANNUAL') return Math.ceil((base*6)*0.93);
                                  return currentTier.annual_price;
                              })();

                              return (
                                <button
                                    key={cycle.id}
                                    onClick={() => setBillingCycle(cycle.id as BillingCycle)}
                                    className={`relative p-5 rounded-[24px] border-2 transition-all text-left group overflow-hidden ${
                                        isSelected 
                                        ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-500/10 shadow-lg' 
                                        : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-amber-900' : 'text-slate-500'}`}>{cycle.label}</span>
                                        {isSelected && <div className="bg-amber-500 text-white rounded-full p-0.5"><Check size={12} /></div>}
                                    </div>
                                    <p className={`text-xl font-black ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                        ${tempRes.toLocaleString()}
                                    </p>
                                    
                                    {cycle.discount && (
                                        <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-md">
                                            {cycle.discount}
                                        </span>
                                    )}
                                </button>
                              );
                          })}
                      </div>
                      
                      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                          <Info size={14} />
                          <span>Entre más tiempo pagas, mayor es el descuento sobre la tarifa base mensual.</span>
                      </div>
                  </div>

              </div>

              {/* Right Column: Checkout Sticky */}
              <div className="space-y-6">
                  <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl sticky top-8 flex flex-col h-fit">
                      <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                          Resumen de Pago <ChevronRight className="text-amber-500" />
                      </h3>
                      
                      {/* Breakdown */}
                      <div className="space-y-4 mb-8">
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Plan Base ({billingCycle})</span>
                              <span className="font-bold">${costs.cyclePrice.toLocaleString()}</span>
                          </div>
                          
                          {costs.totalSavings > 0 && (
                              <div className="flex justify-between items-center text-sm text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                  <span className="font-bold text-xs uppercase tracking-wide">Ahorro por ciclo</span>
                                  <span className="font-bold">-${costs.totalSavings.toLocaleString()}</span>
                              </div>
                          )}

                          {costs.couponDiscount > 0 && (
                              <div className="flex justify-between items-center text-sm text-amber-400">
                                  <span>Cupón Aplicado</span>
                                  <span className="font-bold">-${costs.couponDiscount.toLocaleString()}</span>
                              </div>
                          )}

                          {costs.walletApplied > 0 && (
                              <div className="flex justify-between items-center text-sm text-emerald-400">
                                  <span>Wallet Usado</span>
                                  <span className="font-bold">-${costs.walletApplied.toLocaleString()}</span>
                              </div>
                          )}

                          <div className="border-t border-slate-700 my-4"></div>

                          <div className="flex justify-between items-center mb-6">
                              <span className="text-sm font-bold text-slate-400">Total a Pagar</span>
                              <span className="text-3xl font-black text-white">${costs.finalDue.toLocaleString()}</span>
                          </div>

                          <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2">
                              Proceder al Pago <ArrowRight size={16} />
                          </button>
                      </div>

                      {/* Coupon & Wallet */}
                      <div className="space-y-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Código Promocional</label>
                              <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Ej: PROMO2025" 
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-bold outline-none focus:border-amber-500 transition-colors uppercase"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  />
                                  <button onClick={handleApplyCoupon} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:border-slate-500 transition-all"><Tag size={16} /></button>
                              </div>
                          </div>

                          {MOCK_WALLET.available > 0 && (
                              <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between group cursor-pointer" onClick={() => setUseWallet(!useWallet)}>
                                  <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${useWallet ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                                          {useWallet && <Check size={14} className="text-white" />}
                                      </div>
                                      <div>
                                          <p className="text-xs font-bold text-white">Usar Saldo Wallet</p>
                                          <p className="text-[10px] text-slate-400">Disponible: ${MOCK_WALLET.available.toFixed(2)}</p>
                                      </div>
                                  </div>
                                  <Wallet size={18} className="text-amber-500" />
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <History size={20} className="text-slate-400" /> Historial de Facturación
                  </h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600">
                      <Download size={14} /> Exportar Todo
                  </button>
              </div>
              <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                      <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Factura</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciclo</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">PDF</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {MOCK_INVOICES.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-5 font-mono text-xs font-bold text-slate-500">{inv.id}</td>
                              <td className="px-8 py-5 text-sm font-bold text-slate-700">{inv.date}</td>
                              <td className="px-8 py-5 text-xs font-medium text-slate-600">{inv.cycle}</td>
                              <td className="px-8 py-5 text-xs font-medium text-slate-500 flex items-center gap-2">
                                  <CreditCard size={14} /> {inv.method}
                              </td>
                              <td className="px-8 py-5 text-center">
                                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                      {inv.status}
                                  </span>
                              </td>
                              <td className="px-8 py-5 text-right font-black text-slate-900">${inv.amount.toFixed(2)}</td>
                              <td className="px-8 py-5 text-right">
                                  <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Download size={16} /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

    </div>
  );
};

export default MembershipPage;
