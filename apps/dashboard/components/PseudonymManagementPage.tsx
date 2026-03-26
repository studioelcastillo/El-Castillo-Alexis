import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Filter,
  Globe,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getCurrentStudioId } from '../tenant';

type PseudonymRow = {
  modacc_id?: number;
  stdmod_id: number | '';
  modacc_app: string;
  modacc_username: string;
  modacc_password: string;
  modacc_state: string;
  modacc_active: boolean;
  modacc_mail: string;
  modacc_linkacc: string;
  modacc_payment_username: string;
  modacc_screen_name: string;
  modacc_fail_count?: number | null;
  modacc_fail_message?: string | null;
  modacc_last_result_at?: string | null;
};

const emptyForm: PseudonymRow = {
  stdmod_id: '',
  modacc_app: 'STREAMATE',
  modacc_username: '',
  modacc_password: '',
  modacc_state: 'ACTIVE',
  modacc_active: true,
  modacc_mail: '',
  modacc_linkacc: '',
  modacc_payment_username: '',
  modacc_screen_name: '',
};

const platforms = ['STREAMATE', 'MFC', 'BONGACAMS', 'LIVEJASMIN', 'XLOVECAM', 'CAMSODA', 'CHATURBATE'];

const PseudonymManagementPage: React.FC = () => {
  const studioId = getCurrentStudioId();
  const [rows, setRows] = useState<PseudonymRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [form, setForm] = useState<PseudonymRow>(emptyForm);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !term || `${row.modacc_app} ${row.modacc_username} ${row.modacc_payment_username} ${row.modacc_mail}`.toLowerCase().includes(term);
      const matchesPlatform = platformFilter === 'ALL' || row.modacc_app === platformFilter;
      const matchesState = stateFilter === 'ALL' || row.modacc_state === stateFilter;
      return matchesSearch && matchesPlatform && matchesState;
    });
  }, [platformFilter, rows, search, stateFilter]);

  const summary = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.modacc_active).length,
    missingPseudonym: rows.filter((row) => !row.modacc_payment_username).length,
    withIssues: rows.filter((row) => Number(row.modacc_fail_count || 0) > 0 || !!row.modacc_fail_message).length,
  }), [rows]);

  const loadRows = async () => {
    setLoading(true);
    let query = supabase
      .from('models_accounts')
      .select('modacc_id,stdmod_id,modacc_app,modacc_username,modacc_password,modacc_state,modacc_active,modacc_mail,modacc_linkacc,modacc_payment_username,modacc_screen_name,modacc_fail_count,modacc_fail_message,modacc_last_result_at,deleted_at,studios_models!inner(std_id)')
      .is('deleted_at', null)
      .order('modacc_id', { ascending: false });

    if (studioId) {
      query = query.eq('studios_models.std_id', studioId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('PseudonymManagementPage.loadRows', error);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data || []).map((row: any) => ({
      modacc_id: row.modacc_id,
      stdmod_id: row.stdmod_id,
      modacc_app: row.modacc_app || '',
      modacc_username: row.modacc_username || '',
      modacc_password: row.modacc_password || '',
      modacc_state: row.modacc_state || 'ACTIVE',
      modacc_active: row.modacc_active !== false,
      modacc_mail: row.modacc_mail || '',
      modacc_linkacc: row.modacc_linkacc || '',
      modacc_payment_username: row.modacc_payment_username || '',
      modacc_screen_name: row.modacc_screen_name || '',
      modacc_fail_count: row.modacc_fail_count,
      modacc_fail_message: row.modacc_fail_message,
      modacc_last_result_at: row.modacc_last_result_at,
    })));
    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
  }, [studioId]);

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: PseudonymRow) => {
    setForm(row);
    setShowForm(true);
  };

  const saveRow = async () => {
    if (!form.stdmod_id || !form.modacc_app || !form.modacc_username || !form.modacc_password) {
      alert('Completa contrato, plataforma, usuario y password.');
      return;
    }

    setSaving(true);
    const payload = {
      stdmod_id: Number(form.stdmod_id),
      modacc_app: form.modacc_app.trim(),
      modacc_username: form.modacc_username.trim(),
      modacc_password: form.modacc_password,
      modacc_state: form.modacc_state.trim() || 'ACTIVE',
      modacc_active: form.modacc_active,
      modacc_mail: form.modacc_mail.trim() || null,
      modacc_linkacc: form.modacc_linkacc.trim() || null,
      modacc_payment_username: form.modacc_payment_username.trim() || null,
      modacc_screen_name: form.modacc_screen_name.trim() || null,
    };

    const query = form.modacc_id
      ? supabase.from('models_accounts').update(payload).eq('modacc_id', form.modacc_id)
      : supabase.from('models_accounts').insert([payload]);

    const { error } = await query;
    setSaving(false);
    if (error) {
      console.error('PseudonymManagementPage.saveRow', error);
      alert('No fue posible guardar el pseudónimo.');
      return;
    }

    setShowForm(false);
    await loadRows();
  };

  const removeRow = async (row: PseudonymRow) => {
    if (!row.modacc_id || !confirm(`¿Eliminar ${row.modacc_payment_username || row.modacc_username}?`)) return;
    const { error } = await supabase
      .from('models_accounts')
      .update({ deleted_at: new Date().toISOString(), modacc_active: false })
      .eq('modacc_id', row.modacc_id);

    if (error) {
      console.error('PseudonymManagementPage.removeRow', error);
      alert('No fue posible eliminar el pseudónimo.');
      return;
    }

    await loadRows();
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-violet-400 rounded-2xl shadow-xl shadow-slate-900/20">
              <KeyRound size={28} />
            </div>
            Gestión de Pseudónimos
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Control operativo de accesos, pseudónimos de pago y enlaces por plataforma para el estudio activo.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap justify-end">
          {[
            { label: 'Total', value: summary.total, tone: 'text-slate-900' },
            { label: 'Activos', value: summary.active, tone: 'text-emerald-600' },
            { label: 'Sin pseudónimo', value: summary.missingPseudonym, tone: 'text-amber-600' },
            { label: 'Con incidentes', value: summary.withIssues, tone: 'text-red-600' },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[96px]">
              <p className={`text-lg font-black ${item.tone}`}>{item.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por plataforma, usuario, pseudónimo o correo..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Plataforma</label>
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm">
            <option value="ALL">Todas</option>
            {platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estado</label>
          <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm">
            <option value="ALL">Todos</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
        <button onClick={() => setShowPasswords((current) => !current)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
          {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />} {showPasswords ? 'Ocultar' : 'Mostrar'} claves
        </button>
        <button onClick={() => void loadRows()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
          <RefreshCw size={12} /> Refrescar
        </button>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
          <Plus size={12} /> Nuevo pseudónimo
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70">
              <tr>
                {['Página', 'Usuario', 'Pseudónimo pago', 'Correo login', 'Password', 'Link', 'Estado', 'Incidentes', 'Acciones'].map((label) => (
                  <th key={label} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={28} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">No hay pseudónimos registrados para este filtro.</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.modacc_id || `${row.stdmod_id}-${row.modacc_app}-${row.modacc_username}`} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-widest">
                      <Globe size={12} /> {row.modacc_app}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800">{row.modacc_username}</td>
                  <td className="px-5 py-4 text-slate-700">{row.modacc_payment_username || '—'}</td>
                  <td className="px-5 py-4 text-slate-500">{row.modacc_mail || '—'}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{showPasswords ? (row.modacc_password || '—') : '••••••••'}</td>
                  <td className="px-5 py-4 text-slate-500 max-w-[180px] truncate" title={row.modacc_linkacc || ''}>{row.modacc_linkacc || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${row.modacc_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {row.modacc_state || (row.modacc_active ? 'ACTIVE' : 'INACTIVE')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {Number(row.modacc_fail_count || 0) > 0 ? `${row.modacc_fail_count} fallo(s)` : (row.modacc_fail_message ? 'Observación registrada' : '—')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(row)} className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => void removeRow(row)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><UserCircle2 size={20} className="text-violet-500" /> {form.modacc_id ? 'Editar pseudónimo' : 'Nuevo pseudónimo'}</h3>
                <p className="text-sm text-slate-500 mt-1">Administra acceso, pseudónimo de pago y enlace operativo por plataforma.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <EyeOff size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Contrato ID
                <input type="number" value={form.stdmod_id} onChange={(event) => setForm((current) => ({ ...current, stdmod_id: event.target.value === '' ? '' : Number(event.target.value) }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Plataforma
                <select value={form.modacc_app} onChange={(event) => setForm((current) => ({ ...current, modacc_app: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none">
                  {platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Usuario plataforma
                <input value={form.modacc_username} onChange={(event) => setForm((current) => ({ ...current, modacc_username: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Password
                <input value={form.modacc_password} onChange={(event) => setForm((current) => ({ ...current, modacc_password: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Pseudónimo de pago
                <input value={form.modacc_payment_username} onChange={(event) => setForm((current) => ({ ...current, modacc_payment_username: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Screen Name
                <input value={form.modacc_screen_name} onChange={(event) => setForm((current) => ({ ...current, modacc_screen_name: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Correo login
                <input value={form.modacc_mail} onChange={(event) => setForm((current) => ({ ...current, modacc_mail: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Link / código
                <input value={form.modacc_linkacc} onChange={(event) => setForm((current) => ({ ...current, modacc_linkacc: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Estado
                <input value={form.modacc_state} onChange={(event) => setForm((current) => ({ ...current, modacc_state: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 self-end">
                <input type="checkbox" checked={form.modacc_active} onChange={(event) => setForm((current) => ({ ...current, modacc_active: event.target.checked }))} />
                Cuenta activa
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button disabled={saving} onClick={() => void saveRow()} className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PseudonymManagementPage;
