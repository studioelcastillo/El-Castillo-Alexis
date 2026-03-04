
import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio, Plus, Pencil, Trash2, X,
  Loader2, AlertCircle, ChevronDown, Download, Search
} from 'lucide-react';
import StreamService from '../StreamService';

// ==================== HELPERS ====================

const fmtDate = (d: string | null) => {
  if (!d) return '---';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
};

const fmtMoney = (v: number | string | null | undefined): string => {
  if (v == null || v === '' || v === 0) return '---';
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(num) || num === 0) return '---';
  return num.toLocaleString('es-CO', { maximumFractionDigits: 2 });
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ==================== MINI COMPONENTS ====================

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
      step="any"
    />
  </div>
);

// ==================== TYPES ====================

interface StreamsSectionProps {
  userId: number;
}

interface AccountOption {
  label: string;
  value: number | string;
}

// ==================== MAIN COMPONENT ====================

const StreamsSection: React.FC<StreamsSectionProps> = ({ userId }) => {
  // Data
  const [streams, setStreams] = useState<any[]>([]);
  const [totals, setTotals] = useState<{ tokens: number; usd: number; eur: number; cop: number }>({ tokens: 0, usd: 0, eur: 0, cop: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    modacc_id: '', date: todayStr(), earnings_tokens: '', earnings_usd: '', earnings_eur: '',
  });
  const [currencyType, setCurrencyType] = useState<'usd' | 'eur'>('usd');

  // Dropdowns
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  // Filter
  const [filter, setFilter] = useState('');

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  // ============ LOAD DATA ============
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await StreamService.getStreamsByModel(userId);
      setStreams(res.data?.data || []);
      setTotals(res.data?.totals || { tokens: 0, usd: 0, eur: 0, cop: 0 });
    } catch (err) {
      console.error('Error cargando streams:', err);
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { loadStreams(); }, [loadStreams]);

  // Load accounts
  useEffect(() => {
    (async () => {
      try {
        const res = await StreamService.getModelAccountsByUser(userId);
        setAccounts((res.data?.data || []).map((a: any) => ({
          label: `${a.modacc_username} (${a.modacc_app})`,
          value: a.modacc_id,
        })));
      } catch {}
    })();
  }, [userId]);

  // ============ OPEN FORM ============
  const openForm = (stream?: any) => {
    setError(null);
    if (stream) {
      setEditingId(stream.modstr_id);
      setForm({
        modacc_id: stream.modacc_id || '',
        date: stream.modstr_date || todayStr(),
        earnings_tokens: stream.modstr_earnings_tokens != null ? String(stream.modstr_earnings_tokens) : '',
        earnings_usd: stream.modstr_earnings_usd != null ? String(stream.modstr_earnings_usd) : '',
        earnings_eur: stream.modstr_earnings_eur != null ? String(stream.modstr_earnings_eur) : '',
      });
      setCurrencyType(stream.modstr_earnings_eur != null && stream.modstr_earnings_usd == null ? 'eur' : 'usd');
    } else {
      setEditingId(null);
      setForm({ modacc_id: '', date: todayStr(), earnings_tokens: '', earnings_usd: '', earnings_eur: '' });
      setCurrencyType('usd');
    }
    setShowForm(true);
  };

  // ============ SUBMIT ============
  const handleSubmit = async () => {
    if (!form.modacc_id) { setError('Seleccione una cuenta'); return; }
    if (!form.date) { setError('Ingrese una fecha'); return; }

    setSaving(true); setError(null);
    try {
      const payload = {
        modacc_id: form.modacc_id,
        modstr_date: form.date,
        modstr_period: '',
        modstr_earnings_tokens: form.earnings_tokens ? parseFloat(form.earnings_tokens) : null,
        modstr_earnings_usd: currencyType === 'usd' && form.earnings_usd ? parseFloat(form.earnings_usd) : null,
        modstr_earnings_eur: currencyType === 'eur' && form.earnings_eur ? parseFloat(form.earnings_eur) : null,
      };

      if (editingId) await StreamService.editStream(editingId, payload);
      else await StreamService.addStream(payload);

      setShowForm(false);
      loadStreams();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Error al guardar el stream');
    } finally { setSaving(false); }
  };

  // ============ DELETE ============
  const handleDelete = async (stream: any) => {
    if (!window.confirm(`¿Estás seguro de eliminar el stream #${stream.modstr_id}?`)) return;
    try {
      await StreamService.deleteStream(stream.modstr_id);
      loadStreams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error eliminando stream');
    }
  };

  // ============ FILTER ============
  const filtered = filter
    ? streams.filter(s => {
        const lq = filter.toLowerCase();
        return (s.model_account?.modacc_payment_username || '').toLowerCase().includes(lq) ||
          (s.model_account?.modacc_app || '').toLowerCase().includes(lq) ||
          (s.modstr_date || '').includes(lq) ||
          (s.modstr_source || '').toLowerCase().includes(lq);
      })
    : streams;

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && !showForm && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {error} <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="border border-violet-200 bg-violet-50/20 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-violet-800 uppercase">
              {editingId ? 'Editar' : 'Nuevo'} stream
            </h4>
            <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-700"><X size={16} /></button>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
              {error} <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModalSelect label="Cuenta" value={form.modacc_id} onChange={v => set('modacc_id', v)}
              options={accounts} required />
            <ModalInput label="Fecha" value={form.date} onChange={v => set('date', v)} type="date" required />
            <ModalInput label="Tokens" value={form.earnings_tokens} onChange={v => set('earnings_tokens', v)} type="number" placeholder="0" />

            {/* Currency type radio */}
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="currType" checked={currencyType === 'usd'} onChange={() => setCurrencyType('usd')}
                  className="w-4 h-4 accent-amber-500" />
                <span className="text-sm font-bold text-slate-600">USD</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="currType" checked={currencyType === 'eur'} onChange={() => setCurrencyType('eur')}
                  className="w-4 h-4 accent-amber-500" />
                <span className="text-sm font-bold text-slate-600">EUR</span>
              </label>
            </div>

            {currencyType === 'usd' && (
              <ModalInput label="Ganancia (USD)" value={form.earnings_usd} onChange={v => set('earnings_usd', v)} type="number" placeholder="0.00" />
            )}
            {currencyType === 'eur' && (
              <ModalInput label="Ganancia (EUR)" value={form.earnings_eur} onChange={v => set('earnings_eur', v)} type="number" placeholder="0.00" />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">CANCELAR</button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-violet-600 rounded-lg hover:bg-violet-700 flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={12} className="animate-spin" />} GUARDAR
            </button>
          </div>
        </div>
      )}

      {/* STREAMS TABLE */}
      <div className="rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-violet-600 p-3 px-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
            <Radio size={16} /> Streams
            <span className="text-xs font-normal opacity-80">({filtered.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openForm()}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Nuevo stream">
              <Plus size={14} />
            </button>
            <a href={StreamService.getExportUrl(userId)} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Exportar Excel">
              <Download size={14} />
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="bg-violet-50 px-4 py-2 flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Buscar..." className="bg-transparent text-xs outline-none flex-1 text-slate-600 placeholder:text-slate-400" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2 bg-white">
            <Loader2 size={16} className="animate-spin" /> Cargando streams...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs bg-white">
            <AlertCircle size={20} className="mb-2 opacity-20" />
            Sin streams registrados
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                <tr>
                  <th className="p-3">Pseudonimo</th>
                  <th className="p-3">Pagina</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-right">Tokens</th>
                  <th className="p-3 text-right">USD</th>
                  <th className="p-3 text-right">EUR</th>
                  <th className="p-3 text-right">COP</th>
                  <th className="p-3 text-right">Horas</th>
                  <th className="p-3">Fuente</th>
                  <th className="p-3">Creado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filtered.map((s: any) => (
                  <tr key={s.modstr_id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-700">{s.model_account?.modacc_payment_username || '---'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">
                        {s.model_account?.modacc_app || '---'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{s.modstr_date || '---'}</td>
                    <td className="p-3 text-right font-bold text-slate-700">{fmtMoney(s.modstr_earnings_tokens)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{fmtMoney(s.modstr_earnings_usd)}</td>
                    <td className="p-3 text-right font-bold text-blue-600">{fmtMoney(s.modstr_earnings_eur)}</td>
                    <td className="p-3 text-right font-bold text-amber-600">{fmtMoney(s.modstr_earnings_cop)}</td>
                    <td className="p-3 text-right text-slate-600">{s.modstr_time != null ? fmtMoney(s.modstr_time) : '---'}</td>
                    <td className="p-3">
                      {s.modstr_source ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{s.modstr_source}</span>
                      ) : '---'}
                    </td>
                    <td className="p-3 text-slate-500">{fmtDate(s.created_at)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openForm(s)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Editar"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Eliminar"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals footer */}
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr className="text-xs font-black">
                  <td className="p-3" colSpan={2}></td>
                  <td className="p-3 text-slate-500 uppercase">Total</td>
                  <td className="p-3 text-right text-slate-800">{fmtMoney(totals.tokens)}</td>
                  <td className="p-3 text-right text-emerald-700">{fmtMoney(totals.usd)}</td>
                  <td className="p-3 text-right text-blue-700">{fmtMoney(totals.eur)}</td>
                  <td className="p-3 text-right text-amber-700">{fmtMoney(totals.cop)}</td>
                  <td className="p-3" colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamsSection;
