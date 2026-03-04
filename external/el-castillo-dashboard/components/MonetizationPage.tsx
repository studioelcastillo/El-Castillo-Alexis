
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Banknote, Plus, Search, Filter, Printer, Save, 
  Trash2, DollarSign, Calculator, ChevronRight, CheckCircle2, 
  FileText, Download, TrendingUp, Settings, Lock, Eye, EyeOff,
  User, Briefcase, Globe, Calendar, RefreshCw
} from 'lucide-react';
import MonetizationService from '../MonetizationService';
import { Liquidation, MonetizationBeneficiary, MonetizationPlatform, LiquidationItem, LiquidationDiscount, LiquidationRetention } from '../types';
import { MOCK_USERS } from '../constants'; // For permission check mock

const MonetizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY' | 'BENEFICIARIES' | 'PLATFORMS' | 'DASHBOARD' | 'PRIVATE'>('NEW');
  const [beneficiaries, setBeneficiaries] = useState<MonetizationBeneficiary[]>([]);
  const [platforms, setPlatforms] = useState<MonetizationPlatform[]>([]);
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [loading, setLoading] = useState(false);

  // User Role Mock (Superadmin check)
  const isSuperAdmin = MOCK_USERS.find(u => u.user_id === 1)?.profile?.prof_name === 'ADMINISTRADOR'; // Simulating current user

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [b, p, l] = await Promise.all([
        MonetizationService.getBeneficiaries(),
        MonetizationService.getPlatforms(),
        MonetizationService.getLiquidations()
    ]);
    setBeneficiaries(b);
    setPlatforms(p);
    setLiquidations(l);
    setLoading(false);
  };

  const handleSaveLiquidation = async (liq: Partial<Liquidation>) => {
      await MonetizationService.saveLiquidation(liq);
      loadData();
      setActiveTab('HISTORY');
      alert("Liquidación guardada correctamente.");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-2xl shadow-xl shadow-slate-900/20"><Banknote size={28} /></div>
                    Monetización
                </h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Gestión de pagos a terceros, conversión de divisas y utilidades.</p>
            </div>
            
            {/* Nav Tabs */}
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar gap-1">
                {[
                    { id: 'NEW', label: 'Nueva Liquidación', icon: Plus },
                    { id: 'HISTORY', label: 'Historial', icon: FileText },
                    { id: 'BENEFICIARIES', label: 'Terceros', icon: User },
                    { id: 'PLATFORMS', label: 'Plataformas', icon: Globe },
                    { id: 'DASHBOARD', label: 'Reportes', icon: TrendingUp },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
                {isSuperAdmin && (
                    <button 
                        onClick={() => setActiveTab('PRIVATE')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'PRIVATE' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}
                    >
                        <Lock size={14} /> TRM Privada
                    </button>
                )}
            </div>
        </div>

        {/* Content */}
        <div className="min-h-[600px]">
            {activeTab === 'NEW' && <NewLiquidationView beneficiaries={beneficiaries} platforms={platforms} onSave={handleSaveLiquidation} />}
            {activeTab === 'HISTORY' && <LiquidationHistory liquidations={liquidations} />}
            {activeTab === 'BENEFICIARIES' && <BeneficiariesList data={beneficiaries} />}
            {activeTab === 'PLATFORMS' && <PlatformsList data={platforms} />}
            {activeTab === 'PRIVATE' && isSuperAdmin && <PrivateSpreadDashboard liquidations={liquidations} />}
            {activeTab === 'DASHBOARD' && (
                <div className="p-20 text-center text-slate-300 flex flex-col items-center border-2 border-dashed border-slate-200 rounded-[40px]">
                    <TrendingUp size={64} className="opacity-10 mb-4" />
                    <p className="font-black uppercase tracking-[0.2em] text-xs">Módulo de Reportes en Desarrollo</p>
                </div>
            )}
        </div>
    </div>
  );
};

// --- 1. NEW LIQUIDATION VIEW ---

const NewLiquidationView: React.FC<{ beneficiaries: MonetizationBeneficiary[], platforms: MonetizationPlatform[], onSave: (data: any) => void }> = ({ beneficiaries, platforms, onSave }) => {
    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [beneficiaryId, setBeneficiaryId] = useState('');
    const [items, setItems] = useState<Partial<LiquidationItem>[]>([]);
    const [trmPago, setTrmPago] = useState<number>(3800);
    const [commissionPct, setCommissionPct] = useState<number>(10);
    const [discounts, setDiscounts] = useState<LiquidationDiscount[]>([]);
    const [retentionEnabled, setRetentionEnabled] = useState(false);
    const [retentionPct, setRetentionPct] = useState(0);
    
    // Private (Optional input here or only in private view, prompt implies it might be separate but calculation needs it for internal record)
    // I'll add TRM Real here but hidden unless superadmin or just default to 0 for now. 
    // Actually prompt says "vista privada para TRM real que a mi me pagaron". So maybe we input it here too if I am admin?
    // Let's keep it simple: Standard liquidation doesn't show TRM Real input to avoid confusion for "Contabilidad".
    const [trmReal, setTrmReal] = useState<number>(0); 

    // Derived
    const selectedBeneficiary = beneficiaries.find(b => b.id === beneficiaryId);

    // Auto-fill defaults when beneficiary changes
    useEffect(() => {
        if (selectedBeneficiary) {
            if (selectedBeneficiary.default_commission_pct) setCommissionPct(selectedBeneficiary.default_commission_pct);
            setRetentionEnabled(selectedBeneficiary.retentions_enabled);
            if (selectedBeneficiary.default_retention_pct) setRetentionPct(selectedBeneficiary.default_retention_pct);
        }
    }, [selectedBeneficiary]);

    // Calculations
    const liquidationData = useMemo(() => {
        // Construct retentions array based on toggle
        const rets: LiquidationRetention[] = [];
        // Base calculation logic handled by service, we just prepare the payload
        // But for UI preview we need reactive calculation.
        
        // Let's use the service function logic here reactively
        // Reconstruct basic payload
        let rawItems = items.map(i => ({...i, id: i.id || `temp_${Date.now()}_${Math.random()}`, token_value_snapshot: 0.05})) as LiquidationItem[];
        
        // Mock calculating retentions if enabled
        // This is circular because base depends on retentions? No, retentions depend on base.
        // We pass empty retentions first to get base
        
        const partialCalc = MonetizationService.calculateLiquidation({
            trm_pago: trmPago,
            commission_percentage: commissionPct,
            items: rawItems,
            discounts: discounts
        });

        // Now calculate retention if enabled
        if (retentionEnabled && partialCalc.base_payable_cop) {
            rets.push({
                id: 'ret_1',
                type: 'Retención (Config)',
                percentage: retentionPct,
                base_amount_cop: partialCalc.base_payable_cop,
                calculated_amount_cop: partialCalc.base_payable_cop * (retentionPct / 100)
            });
        }

        // Final recalc with retentions
        return MonetizationService.calculateLiquidation({
            ...partialCalc,
            retentions: rets,
            trm_real: trmReal || trmPago // Default to same if not set
        }) as Liquidation;

    }, [items, trmPago, commissionPct, discounts, retentionEnabled, retentionPct, trmReal]);

    const addItem = () => {
        setItems([...items, { id: `new_${Date.now()}`, type: 'USD', amount_usd: 0, tokens: 0 }]);
    };

    const updateItem = (index: number, field: string, val: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = val;
        // Platform name lookup
        if (field === 'platform_id') {
            const p = platforms.find(pl => pl.id === val);
            newItems[index].platform_name = p?.name || '';
            newItems[index].type = p?.type === 'TOKENS' ? 'TOKENS' : 'USD';
        }
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                
                {/* SECTION A: General */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <User size={16} /> Datos Generales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha Liquidación</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Beneficiario</label>
                            <select value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)} className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none">
                                <option value="">Seleccionar...</option>
                                {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
                            </select>
                        </div>
                        {selectedBeneficiary && (
                            <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs text-slate-600">
                                <span><strong>ID:</strong> {selectedBeneficiary.identification}</span>
                                <span><strong>Nota:</strong> {selectedBeneficiary.legal_note}</span>
                                <span><strong>Banco:</strong> {selectedBeneficiary.bank_info?.bank}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION B: Items */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign size={16} /> Ingresos / Plataformas
                        </h3>
                        <button onClick={addItem} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200">
                            + Agregar Línea
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Plataforma</label>
                                    <select value={item.platform_id} onChange={e => updateItem(idx, 'platform_id', e.target.value)} className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none">
                                        <option value="">Elegir...</option>
                                        {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tipo</label>
                                    <input type="text" readOnly value={item.type} className="w-full p-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-500" />
                                </div>
                                {item.type === 'TOKENS' ? (
                                    <div className="w-32">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tokens</label>
                                        <input type="number" value={item.tokens} onChange={e => updateItem(idx, 'tokens', Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none" />
                                    </div>
                                ) : (
                                    <div className="w-32">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Monto USD</label>
                                        <input type="number" value={item.amount_usd} onChange={e => updateItem(idx, 'amount_usd', Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none" />
                                    </div>
                                )}
                                <button onClick={() => removeItem(idx)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {items.length === 0 && <p className="text-center text-xs text-slate-400 py-4 italic">No hay ingresos registrados</p>}
                    </div>
                </div>

                {/* SECTION C & D & F: Rules */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">TRM Pago (COP)</label>
                        <input type="number" value={trmPago} onChange={e => setTrmPago(Number(e.target.value))} className="w-full p-3 bg-slate-50 border-none rounded-xl text-lg font-black text-slate-900 outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Comisión Estudio %</label>
                        <input type="number" value={commissionPct} onChange={e => setCommissionPct(Number(e.target.value))} className="w-full p-3 bg-slate-50 border-none rounded-xl text-lg font-black text-slate-900 outline-none" />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retención</label>
                            <input type="checkbox" checked={retentionEnabled} onChange={e => setRetentionEnabled(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                        </div>
                        <input 
                            type="number" 
                            disabled={!retentionEnabled}
                            value={retentionPct} 
                            onChange={e => setRetentionPct(Number(e.target.value))} 
                            className="w-full p-3 bg-slate-50 border-none rounded-xl text-lg font-black text-slate-900 outline-none disabled:opacity-50" 
                            placeholder="% Ret"
                        />
                    </div>
                </div>

                {/* SECTION E: Discounts */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="rotate-180 text-red-500" size={16} /> Descuentos / Préstamos
                        </h3>
                        <button 
                            onClick={() => setDiscounts([...discounts, { id: `d_${Date.now()}`, description: '', amount_cop: 0 }])}
                            className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded hover:bg-slate-100"
                        >
                            + Agregar
                        </button>
                    </div>
                    <div className="space-y-2">
                        {discounts.map((d, idx) => (
                            <div key={idx} className="flex gap-3">
                                <input type="text" placeholder="Concepto" value={d.description} onChange={e => {
                                    const nd = [...discounts]; nd[idx].description = e.target.value; setDiscounts(nd);
                                }} className="flex-1 p-2 bg-slate-50 rounded-lg text-xs" />
                                <input type="number" placeholder="Monto COP" value={d.amount_cop} onChange={e => {
                                    const nd = [...discounts]; nd[idx].amount_cop = Number(e.target.value); setDiscounts(nd);
                                }} className="w-32 p-2 bg-slate-50 rounded-lg text-xs font-bold text-right" />
                                <button onClick={() => setDiscounts(discounts.filter((_, i) => i !== idx))} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        ))}
                        {discounts.length === 0 && <p className="text-xs text-slate-400 italic">Sin descuentos adicionales</p>}
                    </div>
                </div>

            </div>

            {/* SECTION G: Summary Sticky */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl sticky top-6">
                    <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ingresos USD</p>
                            <p className="text-3xl font-black text-emerald-400 tracking-tighter">${liquidationData.total_usd.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">COP Bruto</p>
                            <p className="text-xl font-bold opacity-80">${liquidationData.total_cop_bruto.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8 text-sm">
                        <div className="flex justify-between text-slate-400">
                            <span>Comisión ({commissionPct}%)</span>
                            <span className="text-white font-bold">-${liquidationData.commission_cop.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Retenciones</span>
                            <span className="text-white font-bold">-${liquidationData.total_retentions_cop.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Descuentos</span>
                            <span className="text-white font-bold">-${liquidationData.total_discounts_cop.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                            <span className="font-black text-lg">A PAGAR</span>
                            <span className="font-black text-2xl tracking-tighter text-amber-400">${liquidationData.total_payable_cop.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => onSave({...liquidationData, beneficiary_id: beneficiaryId, beneficiary_name: selectedBeneficiary?.name, beneficiary_doc: selectedBeneficiary?.identification})}
                            disabled={!selectedBeneficiary || liquidationData.total_usd === 0}
                            className="w-full py-4 bg-emerald-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Guardar Liquidación
                        </button>
                        <button className="w-full py-4 bg-white/10 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all text-[10px] flex items-center justify-center gap-2">
                            <Printer size={16} /> Vista Previa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. HISTORY VIEW ---
const LiquidationHistory: React.FC<{ liquidations: Liquidation[] }> = ({ liquidations }) => {
    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Fecha</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiario</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total USD</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pagado COP</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {liquidations.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5">
                                    <p className="text-xs font-bold text-slate-900">{l.id}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{l.date}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-sm font-bold text-slate-700">{l.beneficiary_name}</p>
                                    <p className="text-[10px] text-slate-400">{l.beneficiary_doc}</p>
                                </td>
                                <td className="px-8 py-5 text-right font-mono text-sm font-black text-slate-600">
                                    ${l.total_usd.toLocaleString()}
                                </td>
                                <td className="px-8 py-5 text-right font-mono text-sm font-black text-emerald-600">
                                    ${l.total_payable_cop.toLocaleString()}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${l.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {l.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-2 text-slate-400 hover:text-slate-900"><Printer size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 3. PRIVATE SPREAD DASHBOARD ---
const PrivateSpreadDashboard: React.FC<{ liquidations: Liquidation[] }> = ({ liquidations }) => {
    // Only superadmin sees this
    // Calculate totals
    const totalSpread = liquidations.reduce((acc, l) => acc + (l.spread_profit_cop || 0), 0);
    const totalCommission = liquidations.reduce((acc, l) => acc + l.commission_cop, 0);
    const totalRealProfit = totalSpread + totalCommission;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-amber-500 text-slate-900 rounded-2xl shadow-lg shadow-amber-500/20"><Lock size={24} /></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Utilidad Real & Spread FX</h2>
                        <p className="text-sm text-slate-400 font-medium">Vista restringida: Ganancias ocultas por diferencial cambiario.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Spread Profit (FX)</p>
                        <p className="text-4xl font-black tracking-tighter">${totalSpread.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-2">Ganancia por TRM Real vs Pago</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Comisiones Estudio</p>
                        <p className="text-4xl font-black tracking-tighter">${totalCommission.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-2">Ingresos por % operativo</p>
                    </div>
                    <div className="p-6 bg-amber-500/20 border border-amber-500/30 rounded-3xl backdrop-blur-sm">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Utilidad Total Real</p>
                        <p className="text-4xl font-black tracking-tighter text-amber-300">${totalRealProfit.toLocaleString()}</p>
                        <p className="text-xs text-amber-200/70 mt-2">Spread + Comisiones</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Detalle por Liquidación</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiario</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total USD</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">TRM Pago</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">TRM Real</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-emerald-600">Spread Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {liquidations.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5 text-xs font-bold text-slate-500">{l.id}</td>
                                <td className="px-8 py-5 text-sm font-bold text-slate-700">{l.beneficiary_name}</td>
                                <td className="px-8 py-5 text-right font-mono text-xs font-bold text-slate-600">${l.total_usd.toLocaleString()}</td>
                                <td className="px-8 py-5 text-right font-mono text-xs text-slate-500">${l.trm_pago}</td>
                                <td className="px-8 py-5 text-right font-mono text-xs font-black text-slate-800">${l.trm_real || l.trm_pago}</td>
                                <td className="px-8 py-5 text-right font-mono text-sm font-black text-emerald-600 bg-emerald-50/30">
                                    ${(l.spread_profit_cop || 0).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- HELPERS (Beneficiaries/Platforms Simple Lists) ---
const BeneficiariesList: React.FC<{data: MonetizationBeneficiary[]}> = ({data}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(b => (
            <div key={b.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">{b.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{b.type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${b.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{b.active ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                    <p><strong>ID:</strong> {b.identification}</p>
                    {b.bank_info && <p><strong>Banco:</strong> {b.bank_info.bank} ({b.bank_info.type})</p>}
                    <p><strong>Retención:</strong> {b.retentions_enabled ? `${b.default_retention_pct}%` : 'No'}</p>
                </div>
            </div>
        ))}
        <button className="flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-all bg-slate-50/50">
            <Plus size={32} className="mb-2" />
            <span className="text-xs font-black uppercase tracking-widest">Nuevo Tercero</span>
        </button>
    </div>
);

const PlatformsList: React.FC<{data: MonetizationPlatform[]}> = ({data}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                    <h4 className="font-black text-slate-900 text-sm">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{p.type}</p>
                    <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Comisión Default</p>
                        <p className="text-xl font-black text-slate-900">{p.default_commission_pct}%</p>
                    </div>
                </div>
            </div>
        ))}
        <button className="flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all bg-slate-50/50">
            <Plus size={32} className="mb-2" />
            <span className="text-xs font-black uppercase tracking-widest">Nueva Plataforma</span>
        </button>
    </div>
);

export default MonetizationPage;
