
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Plus, Pencil, Trash2, X,
  Loader2, AlertCircle, ChevronDown, Download, Search
} from 'lucide-react';
import TransactionService from '../TransactionService';

// ==================== HELPERS ====================

const fmtDate = (d: string | null) => {
  if (!d) return '---';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
};

const fmtMoney = (v: number | string | null | undefined): string => {
  if (v == null || v === '') return '---';
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(num)) return '---';
  return num.toLocaleString('es-CO', { maximumFractionDigits: 0 });
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ==================== MINI FORM COMPONENTS ====================

const ModalSelect: React.FC<{
  label: string; value: string | number; onChange: (v: string) => void;
  options: { label: string; value: string | number }[]; disabled?: boolean; required?: boolean;
}> = ({ label, value, onChange, options, disabled, required }) => (
  <div className="relative">
    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute top-2 left-4 z-10">{label}{required && ' *'}</label>
    <select
      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-4 pt-7 pb-2.5 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
    >
      <option value="">--- Seleccionar ---</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-4 top-1/2 text-slate-400 pointer-events-none" />
  </div>
);

const ModalInput: React.FC<{
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; disabled?: boolean; required?: boolean; placeholder?: string;
}> = ({ label, value, onChange, type = 'text', disabled, required, placeholder }) => (
  <div className="relative">
    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute top-2 left-4 z-10">{label}{required && ' *'}</label>
    <input
      type={type}
      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-4 pt-7 pb-2.5 text-sm text-slate-700 font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
    />
  </div>
);

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-3">
    <button type="button" onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
    <span className="text-sm text-slate-600">{label} ({value ? 'SI' : 'NO'})</span>
  </div>
);

// ==================== TYPES ====================

interface TransactionsSectionProps {
  userId: number;
  isModel: boolean;
}

interface TransTypeOption {
  label: string;
  value: number;
  behavior: string | null;
  amount_transtype: number | null;
}

interface ProductOption {
  label: string;
  value: number;
  amount: number;
  label_trans_type: string;
  value_trans_type: number;
  behavior_trans_type: string | null;
}

interface ContractOption {
  label: string;
  value: number | string;
}

// ==================== TRANSACTION MODAL ====================

const TransactionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  isModel: boolean;
  group: 'INGRESOS' | 'EGRESOS';
  editTrans?: any | null;
  contracts: ContractOption[];
  onSaved: () => void;
}> = ({ isOpen, onClose, userId, isModel, group, editTrans, contracts, onSaved }) => {
  const isEdit = !!editTrans;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    stdmod_id: '', transtype_id: '', prod_id: '', description: '',
    amount: '', quantity: '1', date: todayStr(), rtefte: false,
  });

  // Autocomplete state
  const [transTypes, setTransTypes] = useState<TransTypeOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [typeSearch, setTypeSearch] = useState('');
  const [prodSearch, setProdSearch] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedTypeBehavior, setSelectedTypeBehavior] = useState<string | null>(null);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  // Populate form on open
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setTransTypes([]);
    setProducts([]);
    setTypeSearch('');
    setProdSearch('');
    setSelectedTypeBehavior(null);

    if (editTrans) {
      setForm({
        stdmod_id: editTrans.stdmod_id ? String(editTrans.stdmod_id) : '',
        transtype_id: String(editTrans.transtype_id || editTrans.transaction_type?.transtype_id || ''),
        prod_id: editTrans.prod_id ? String(editTrans.prod_id) : '',
        description: editTrans.trans_description || '',
        amount: editTrans.trans_amount != null ? String(editTrans.trans_amount) : '',
        quantity: editTrans.trans_quantity != null ? String(editTrans.trans_quantity) : '1',
        date: editTrans.trans_date || todayStr(),
        rtefte: !!editTrans.trans_rtefte,
      });
      setSelectedTypeBehavior(editTrans.transaction_type?.transtype_behavior || null);
      if (editTrans.transaction_type) {
        setTypeSearch(editTrans.transaction_type.transtype_name);
      }
      if (editTrans.product) {
        setProdSearch(editTrans.product.prod_name);
      }
    } else {
      setForm({
        stdmod_id: contracts[0]?.value?.toString() || '',
        transtype_id: '', prod_id: '', description: '',
        amount: '', quantity: '1', date: todayStr(), rtefte: false,
      });
    }
  }, [isOpen, editTrans, contracts]);

  // Search transaction types
  const searchTransTypes = async (search: string) => {
    if (search.length < 3) { setTransTypes([]); return; }
    setLoadingTypes(true);
    try {
      const res = await TransactionService.getTransactionTypes(group, search);
      setTransTypes((res.data?.data || []).map((t: any) => ({
        label: t.transtype_name, value: t.transtype_id,
        behavior: t.transtype_behavior, amount_transtype: t.transtype_value,
      })));
    } catch {} finally { setLoadingTypes(false); }
  };

  // Search products
  const searchProducts = async (search: string) => {
    if (search.length < 2) { setProducts([]); return; }
    setLoadingProducts(true);
    try {
      let query = `prod_name=${search}&transtype_group=${group}`;
      if (form.transtype_id) query += `&transtype_id=${form.transtype_id}`;
      const res = await TransactionService.getProducts(query);
      setProducts((res.data?.data || []).map((p: any) => ({
        label: p.prod_name, value: p.prod_id, amount: p.prod_sale_price,
        label_trans_type: p.transaction_type?.transtype_name || '',
        value_trans_type: p.transaction_type?.transtype_id || '',
        behavior_trans_type: p.transaction_type?.transtype_behavior || null,
      })));
    } catch {} finally { setLoadingProducts(false); }
  };

  const handleSelectType = (tt: TransTypeOption) => {
    set('transtype_id', String(tt.value));
    setTypeSearch(tt.label);
    setSelectedTypeBehavior(tt.behavior);
    setTransTypes([]);
    if (tt.amount_transtype != null) set('amount', String(tt.amount_transtype));
    set('prod_id', ''); setProdSearch('');
  };

  const handleSelectProduct = (p: ProductOption) => {
    set('prod_id', String(p.value));
    setProdSearch(p.label);
    set('amount', String(p.amount));
    setProducts([]);
    set('transtype_id', String(p.value_trans_type));
    setTypeSearch(p.label_trans_type);
    setSelectedTypeBehavior(p.behavior_trans_type);
  };

  const handleSubmit = async () => {
    if (isModel && !form.stdmod_id) { setError('Seleccione un contrato'); return; }
    if (!form.transtype_id) { setError('Seleccione un tipo de transferencia'); return; }
    if (!form.amount) { setError('Ingrese un monto'); return; }
    if (!form.date) { setError('Ingrese una fecha'); return; }

    setSaving(true); setError(null);
    try {
      const payload = {
        user_id: userId,
        stdmod_id: form.stdmod_id,
        transtype_id: form.transtype_id,
        prod_id: form.prod_id || null,
        trans_date: form.date,
        trans_description: form.description,
        trans_amount: parseFloat(form.amount) || 0,
        trans_quantity: parseFloat(form.quantity) || 1,
        trans_rtefte: form.rtefte,
      };

      if (isEdit) await TransactionService.editTransaction(editTrans.trans_id, payload);
      else await TransactionService.addTransaction(payload);

      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Error al guardar la transaccion');
    } finally { setSaving(false); }
  };

  const showProductField = group === 'EGRESOS' && (!form.transtype_id || selectedTypeBehavior === 'TIENDA');

  if (!isOpen) return null;

  const headerColor = group === 'INGRESOS' ? 'bg-emerald-600' : 'bg-amber-600';
  const headerIcon = group === 'INGRESOS' ? TrendingUp : TrendingDown;
  const HeaderIcon = headerIcon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`${headerColor} p-5 flex justify-between items-center text-white`}>
          <div className="flex items-center gap-3">
            <HeaderIcon size={20} />
            <div>
              <h2 className="text-lg font-bold">{isEdit ? 'Editar' : 'Crear'} transaccion</h2>
              <p className="text-xs opacity-80">{group}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
              {error} <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contract dropdown */}
            {isModel && (
              <div className="md:col-span-2">
                <ModalSelect label="Contrato" value={form.stdmod_id} onChange={v => set('stdmod_id', v)}
                  options={contracts} required disabled={isEdit} />
              </div>
            )}

            {/* Transaction Type (autocomplete) */}
            <div className="relative md:col-span-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute top-2 left-4 z-10">Tipo de transferencia *</label>
              <input
                type="text" value={typeSearch}
                onChange={e => { setTypeSearch(e.target.value); set('transtype_id', ''); searchTransTypes(e.target.value); }}
                placeholder="Escriba 3+ caracteres para buscar..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 pt-7 pb-2.5 text-sm text-slate-700 font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all"
              />
              {loadingTypes && <Loader2 size={14} className="absolute right-4 top-1/2 animate-spin text-amber-500" />}
              {transTypes.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                  {transTypes.map(tt => (
                    <button key={tt.value} onClick={() => handleSelectType(tt)}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-amber-50 text-slate-700 border-b border-slate-50 last:border-0 transition-colors">
                      {tt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product (for EGRESOS with TIENDA behavior) */}
            {showProductField && (
              <div className="relative md:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute top-2 left-4 z-10">Producto *</label>
                <input
                  type="text" value={prodSearch}
                  onChange={e => { setProdSearch(e.target.value); searchProducts(e.target.value); }}
                  placeholder="Escriba 2+ caracteres para buscar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 pt-7 pb-2.5 text-sm text-slate-700 font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all"
                />
                {loadingProducts && <Loader2 size={14} className="absolute right-4 top-1/2 animate-spin text-amber-500" />}
                {products.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                    {products.map(p => (
                      <button key={p.value} onClick={() => handleSelectProduct(p)}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-amber-50 text-slate-700 border-b border-slate-50 last:border-0 transition-colors">
                        {p.label} <span className="text-slate-400 ml-1">(${fmtMoney(p.amount)})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <ModalInput label="Descripcion" value={form.description} onChange={v => set('description', v)} placeholder="Max 255 caracteres" />
            </div>
            <ModalInput label="Monto" value={form.amount} onChange={v => set('amount', v)} type="number" required placeholder="0" />
            <ModalInput label="Cantidad" value={form.quantity} onChange={v => set('quantity', v)} type="number" required placeholder="1" />
            <ModalInput label="Fecha" value={form.date} onChange={v => set('date', v)} type="date" required />
          </div>

          <div className="pt-2">
            <Toggle label="Aplica Rte.Fte" value={form.rtefte} onChange={v => set('rtefte', v)} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <button onClick={handleSubmit} disabled={saving}
            className={`px-8 py-3 text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all ${group === 'INGRESOS' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'}`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'GUARDANDO...' : isEdit ? 'ACTUALIZAR' : 'CREAR TRANSACCION'}
          </button>
          <button onClick={onClose} disabled={saving}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const TransactionsSection: React.FC<TransactionsSectionProps> = ({ userId, isModel }) => {
  // Data
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [egresos, setEgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGroup, setModalGroup] = useState<'INGRESOS' | 'EGRESOS'>('INGRESOS');
  const [editingTrans, setEditingTrans] = useState<any | null>(null);

  // Contracts dropdown (loaded once, passed to modal)
  const [contracts, setContracts] = useState<ContractOption[]>([]);

  // Filters
  const [filterIngresos, setFilterIngresos] = useState('');
  const [filterEgresos, setFilterEgresos] = useState('');

  // ============ LOAD DATA ============
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const [ingRes, egRes] = await Promise.all([
        TransactionService.getTransactions(`parentfield=user_id&parentid=${userId}&transtype_group=INGRESOS`),
        TransactionService.getTransactions(`parentfield=user_id&parentid=${userId}&transtype_group=EGRESOS`),
      ]);
      setIngresos(ingRes.data?.data || []);
      setEgresos(egRes.data?.data || []);
    } catch (err) {
      console.error('Error cargando transacciones:', err);
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // Load contracts once (from legacy endpoint /petitions/studios_models)
  useEffect(() => {
    if (!isModel) return;
    (async () => {
      try {
        const res = await TransactionService.getStudiosModelsByUser(userId);
        const data = res.data?.data || [];
        // Backend returns { value: stdmod_id, label: "stdmod_id std_name" }
        setContracts(data.map((c: any) => ({
          label: c.label || `${c.value}`,
          value: c.value || c.stdmod_id,
        })));
      } catch (err) {
        console.error('Error cargando contratos:', err);
      }
    })();
  }, [userId, isModel]);

  // ============ OPEN MODAL ============
  const openModal = (group: 'INGRESOS' | 'EGRESOS', trans?: any) => {
    setModalGroup(group);
    setEditingTrans(trans || null);
    setModalOpen(true);
  };

  // ============ DELETE ============
  const handleDelete = async (trans: any) => {
    if (!window.confirm(`¿Estás seguro de eliminar la transaccion #${trans.trans_id}?`)) return;
    try {
      await TransactionService.deleteTransaction(trans.trans_id);
      loadTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error eliminando transaccion');
    }
  };

  // ============ FILTER ============
  const filterRows = (rows: any[], q: string) => {
    if (!q) return rows;
    const lq = q.toLowerCase();
    return rows.filter(r =>
      (r.transaction_type?.transtype_name || '').toLowerCase().includes(lq) ||
      (r.trans_description || '').toLowerCase().includes(lq) ||
      (r.product?.prod_name || '').toLowerCase().includes(lq) ||
      String(r.trans_amount).includes(lq)
    );
  };

  // ============ TABLE COMPONENT ============
  const TransTable: React.FC<{
    rows: any[]; group: 'INGRESOS' | 'EGRESOS';
    icon: any; filter: string; setFilter: (v: string) => void;
  }> = ({ rows, group, icon: Icon, filter: flt, setFilter: setFlt }) => {
    const filtered = filterRows(rows, flt);
    const bgHeader = group === 'INGRESOS' ? 'bg-emerald-500' : 'bg-amber-600';
    const bgSubHeader = group === 'INGRESOS' ? 'bg-emerald-50' : 'bg-amber-50';

    return (
      <div className="rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className={`${bgHeader} p-3 px-5 flex justify-between items-center text-white`}>
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
            <Icon size={16} /> {group}
            <span className="text-xs font-normal opacity-80">({filtered.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openModal(group)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title={`Nuevo ${group.toLowerCase()}`}>
              <Plus size={14} />
            </button>
            <a href={TransactionService.getExportUrl(userId)} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Exportar Excel">
              <Download size={14} />
            </a>
          </div>
        </div>

        {/* Search */}
        <div className={`${bgSubHeader} px-4 py-2 flex items-center gap-2`}>
          <Search size={14} className="text-slate-400" />
          <input type="text" value={flt} onChange={e => setFlt(e.target.value)}
            placeholder="Buscar..." className="bg-transparent text-xs outline-none flex-1 text-slate-600 placeholder:text-slate-400" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2 bg-white">
            <Loader2 size={16} className="animate-spin" /> Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs bg-white">
            <AlertCircle size={20} className="mb-2 opacity-20" />
            Sin registros de {group.toLowerCase()}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                <tr>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Contrato</th>
                  <th className="p-3">Descripcion</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Creado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filtered.map((t: any) => (
                  <tr key={t.trans_id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3 text-slate-600">{t.transaction_type?.transtype_name || '---'}</td>
                    <td className="p-3 text-slate-500">{t.product?.prod_name || '---'}</td>
                    <td className="p-3 text-slate-500 font-mono text-[10px]">{t.stdmod_id ? `${t.stdmod_id} ${t.std_name || ''}` : '---'}</td>
                    <td className="p-3 text-slate-600 max-w-[200px] truncate">{t.trans_description || '---'}</td>
                    <td className="p-3 text-right font-bold text-slate-700">${fmtMoney(t.trans_amount)}</td>
                    <td className="p-3 text-right font-bold text-slate-800">${fmtMoney((t.trans_amount || 0) * (t.trans_quantity || 1))}</td>
                    <td className="p-3 text-slate-600">{t.trans_date || '---'}</td>
                    <td className="p-3 text-slate-500">{fmtDate(t.created_at)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {t.period_state === 'ABIERTO' && (
                          <>
                            <button onClick={() => openModal(group, t)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Editar"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Eliminar"><Trash2 size={13} /></button>
                          </>
                        )}
                        {t.period_state === 'CERRADO' && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-bold">CERRADO</span>
                        )}
                      </div>
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

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {error} <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {/* Tables */}
      <TransTable rows={ingresos} group="INGRESOS" icon={TrendingUp} filter={filterIngresos} setFilter={setFilterIngresos} />
      <TransTable rows={egresos} group="EGRESOS" icon={TrendingDown} filter={filterEgresos} setFilter={setFilterEgresos} />

      {/* Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTrans(null); }}
        userId={userId}
        isModel={isModel}
        group={modalGroup}
        editTrans={editingTrans}
        contracts={contracts}
        onSaved={() => {
          setModalOpen(false);
          setEditingTrans(null);
          loadTransactions();
        }}
      />
    </div>
  );
};

export default TransactionsSection;
