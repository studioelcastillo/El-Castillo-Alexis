import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Image,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getCurrentStudioId } from '../tenant';
import { getTenantJsonSetting, upsertTenantSetting } from '../tenantSettings';

type BonusGoalRow = {
  modgoal_id?: number;
  stdmod_id: number | '';
  modgoal_type: string;
  modgoal_amount: number | '';
  modgoal_percent: number | '';
  modgoal_auto: boolean;
  modgoal_date: string;
  modgoal_reach_goal: boolean;
};

type BonusBlueprint = {
  referenceAssets: string[];
  promptTemplate: string;
  channels: string;
  notes: string;
};

const BLUEPRINT_KEY = 'bonus_goal_blueprint';

const emptyGoal: BonusGoalRow = {
  stdmod_id: '',
  modgoal_type: 'BONO',
  modgoal_amount: '',
  modgoal_percent: '',
  modgoal_auto: false,
  modgoal_date: new Date().toISOString().slice(0, 10),
  modgoal_reach_goal: false,
};

const defaultBlueprint: BonusBlueprint = {
  referenceAssets: ['Selfie / Lifestyle / Bikini'],
  promptTemplate: 'Crear propuesta visual premium para campaña de metas del estudio, con CTA claro y enfoque en conversión.',
  channels: 'Canal / Referido / Bonus interno',
  notes: 'Usar este bloque para documentar metas, bonos y referencias creativas por estudio.',
};

const BonusGoalsPage: React.FC = () => {
  const studioId = getCurrentStudioId();
  const [rows, setRows] = useState<BonusGoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BonusGoalRow>(emptyGoal);
  const [blueprint, setBlueprint] = useState<BonusBlueprint>(defaultBlueprint);
  const [savingBlueprint, setSavingBlueprint] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => !term || `${row.modgoal_type} ${row.stdmod_id}`.toLowerCase().includes(term));
  }, [rows, search]);

  const summary = useMemo(() => ({
    total: rows.length,
    reached: rows.filter((row) => row.modgoal_reach_goal).length,
    automatic: rows.filter((row) => row.modgoal_auto).length,
    avgPercent: rows.length ? Math.round(rows.reduce((acc, row) => acc + Number(row.modgoal_percent || 0), 0) / rows.length) : 0,
  }), [rows]);

  const loadRows = async () => {
    setLoading(true);
    let query = supabase
      .from('models_goals')
      .select('modgoal_id,stdmod_id,modgoal_type,modgoal_amount,modgoal_percent,modgoal_auto,modgoal_date,modgoal_reach_goal,deleted_at,studios_models!inner(std_id)')
      .is('deleted_at', null)
      .order('modgoal_date', { ascending: false });

    if (studioId) {
      query = query.eq('studios_models.std_id', studioId);
    }

    const [{ data, error }, blueprintValue] = await Promise.all([
      query,
      getTenantJsonSetting<BonusBlueprint>(BLUEPRINT_KEY, defaultBlueprint),
    ]);

    if (error) {
      console.error('BonusGoalsPage.loadRows', error);
      setRows([]);
    } else {
      setRows((data || []).map((row: any) => ({
        modgoal_id: row.modgoal_id,
        stdmod_id: row.stdmod_id,
        modgoal_type: row.modgoal_type || 'BONO',
        modgoal_amount: Number(row.modgoal_amount || 0),
        modgoal_percent: Number(row.modgoal_percent || 0),
        modgoal_auto: row.modgoal_auto === true,
        modgoal_date: row.modgoal_date || new Date().toISOString().slice(0, 10),
        modgoal_reach_goal: row.modgoal_reach_goal === true,
      })));
    }

    setBlueprint(blueprintValue);
    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
  }, [studioId]);

  const saveGoal = async () => {
    if (!form.stdmod_id || form.modgoal_amount === '') {
      alert('Completa contrato y monto de meta.');
      return;
    }

    setSaving(true);
    const payload = {
      stdmod_id: Number(form.stdmod_id),
      modgoal_type: form.modgoal_type.trim() || 'BONO',
      modgoal_amount: Number(form.modgoal_amount),
      modgoal_percent: form.modgoal_percent === '' ? null : Number(form.modgoal_percent),
      modgoal_auto: form.modgoal_auto,
      modgoal_date: form.modgoal_date || null,
      modgoal_reach_goal: form.modgoal_reach_goal,
    };

    const query = form.modgoal_id
      ? supabase.from('models_goals').update(payload).eq('modgoal_id', form.modgoal_id)
      : supabase.from('models_goals').insert([payload]);

    const { error } = await query;
    setSaving(false);
    if (error) {
      console.error('BonusGoalsPage.saveGoal', error);
      alert('No fue posible guardar la meta.');
      return;
    }

    setShowForm(false);
    setForm(emptyGoal);
    await loadRows();
  };

  const removeGoal = async (row: BonusGoalRow) => {
    if (!row.modgoal_id || !confirm(`¿Eliminar la meta ${row.modgoal_type}?`)) return;
    const { error } = await supabase
      .from('models_goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('modgoal_id', row.modgoal_id);

    if (error) {
      console.error('BonusGoalsPage.removeGoal', error);
      alert('No fue posible eliminar la meta.');
      return;
    }

    await loadRows();
  };

  const saveBlueprint = async () => {
    setSavingBlueprint(true);
    await upsertTenantSetting(BLUEPRINT_KEY, blueprint, 'Configuracion creativa y metas de bonos');
    setSavingBlueprint(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl shadow-xl shadow-slate-900/20">
              <Award size={28} />
            </div>
            Metas Bonos
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Controla metas por contrato y documenta la guía creativa/operativa del estudio para campañas e incentivos.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap justify-end">
          {[
            { label: 'Metas', value: summary.total, tone: 'text-slate-900' },
            { label: 'Cumplidas', value: summary.reached, tone: 'text-emerald-600' },
            { label: 'Automáticas', value: summary.automatic, tone: 'text-indigo-600' },
            { label: '% promedio', value: `${summary.avgPercent}%`, tone: 'text-amber-600' },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[96px]">
              <p className={`text-lg font-black ${item.tone}`}>{item.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 flex flex-wrap gap-4 items-end">
            <div className="relative min-w-[260px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tipo o contrato..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" />
            </div>
            <button onClick={() => void loadRows()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
              <RefreshCw size={12} /> Refrescar
            </button>
            <button onClick={() => { setForm(emptyGoal); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
              <Plus size={12} /> Nueva meta
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/70">
                  <tr>
                    {['Contrato', 'Tipo', 'Monto', '%', 'Fecha', 'Auto', 'Cumplida', 'Acciones'].map((label) => (
                      <th key={label} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={28} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">No hay metas configuradas para este filtro.</td></tr>
                  ) : filtered.map((row) => (
                    <tr key={row.modgoal_id || `${row.stdmod_id}-${row.modgoal_type}-${row.modgoal_date}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-800">{row.stdmod_id}</td>
                      <td className="px-5 py-4 text-slate-700">{row.modgoal_type}</td>
                      <td className="px-5 py-4 font-black text-slate-900">${Number(row.modgoal_amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-600">{row.modgoal_percent === '' ? '—' : `${row.modgoal_percent}%`}</td>
                      <td className="px-5 py-4 text-slate-500">{row.modgoal_date || '—'}</td>
                      <td className="px-5 py-4 text-slate-500">{row.modgoal_auto ? 'Sí' : 'No'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${row.modgoal_reach_goal ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {row.modgoal_reach_goal ? 'Cumplida' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setForm(row); setShowForm(true); }} className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => void removeGoal(row)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-5 h-fit">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-violet-500" /> Configuración creativa / bonus
            </h3>
            <p className="text-sm text-slate-500 mt-2">Referencia reusable del estudio para campañas, prompts y lineamientos de metas con bonificación.</p>
          </div>

          <label className="space-y-2 block text-xs font-black text-slate-400 uppercase tracking-widest">
            Activos / referencias
            <textarea
              rows={4}
              value={blueprint.referenceAssets.join('\n')}
              onChange={(event) => setBlueprint((current) => ({ ...current, referenceAssets: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) }))}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none resize-none"
            />
          </label>

          <label className="space-y-2 block text-xs font-black text-slate-400 uppercase tracking-widest">
            Prompt guía
            <textarea
              rows={5}
              value={blueprint.promptTemplate}
              onChange={(event) => setBlueprint((current) => ({ ...current, promptTemplate: event.target.value }))}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none resize-none"
            />
          </label>

          <label className="space-y-2 block text-xs font-black text-slate-400 uppercase tracking-widest">
            Canales / destino
            <input
              value={blueprint.channels}
              onChange={(event) => setBlueprint((current) => ({ ...current, channels: event.target.value }))}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none"
            />
          </label>

          <label className="space-y-2 block text-xs font-black text-slate-400 uppercase tracking-widest">
            Notas operativas
            <textarea
              rows={4}
              value={blueprint.notes}
              onChange={(event) => setBlueprint((current) => ({ ...current, notes: event.target.value }))}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none resize-none"
            />
          </label>

          <div className="p-5 bg-violet-50 rounded-3xl border border-violet-100 space-y-3">
            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2"><Image size={12} /> Preview lógico</p>
            <p className="text-sm font-bold text-slate-800">{blueprint.promptTemplate || 'Sin prompt definido'}</p>
            <p className="text-xs text-slate-500">Canales: {blueprint.channels || 'No definidos'}</p>
            <div className="flex flex-wrap gap-2">
              {blueprint.referenceAssets.map((asset) => (
                <span key={asset} className="px-2.5 py-1 rounded-xl bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 border border-violet-100">{asset}</span>
              ))}
            </div>
          </div>

          <button disabled={savingBlueprint} onClick={() => void saveBlueprint()} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60">
            {savingBlueprint ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Guardar configuración
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div>
              <h3 className="text-xl font-black text-slate-900">{form.modgoal_id ? 'Editar meta' : 'Nueva meta / bono'}</h3>
              <p className="text-sm text-slate-500 mt-1">Registra metas, fechas y porcentaje de incentivo por contrato.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Contrato ID
                <input type="number" value={form.stdmod_id} onChange={(event) => setForm((current) => ({ ...current, stdmod_id: event.target.value === '' ? '' : Number(event.target.value) }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Tipo
                <input value={form.modgoal_type} onChange={(event) => setForm((current) => ({ ...current, modgoal_type: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Monto meta
                <input type="number" value={form.modgoal_amount} onChange={(event) => setForm((current) => ({ ...current, modgoal_amount: event.target.value === '' ? '' : Number(event.target.value) }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Porcentaje bono
                <input type="number" value={form.modgoal_percent} onChange={(event) => setForm((current) => ({ ...current, modgoal_percent: event.target.value === '' ? '' : Number(event.target.value) }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <label className="space-y-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Fecha objetivo
                <input type="date" value={form.modgoal_date} onChange={(event) => setForm((current) => ({ ...current, modgoal_date: event.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none" />
              </label>
              <div className="grid grid-cols-2 gap-3 items-end">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={form.modgoal_auto} onChange={(event) => setForm((current) => ({ ...current, modgoal_auto: event.target.checked }))} />
                  Auto
                </label>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={form.modgoal_reach_goal} onChange={(event) => setForm((current) => ({ ...current, modgoal_reach_goal: event.target.checked }))} />
                  Cumplida
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button disabled={saving} onClick={() => void saveGoal()} className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BonusGoalsPage;
