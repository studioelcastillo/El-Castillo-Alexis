import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import DashboardService from '../DashboardService';
import { getCurrentStudioId } from '../tenant';
import { getTenantJsonSetting, upsertTenantSetting } from '../tenantSettings';

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type TaskReview = {
  status: ReviewStatus;
  note: string;
  updatedAt: string;
};

type TaskEntry = {
  id: string;
  keyId: string;
  type: string;
  category: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  description: string;
  source: string;
  review: TaskReview;
};

const REVIEWS_KEY = 'task_supervision_reviews';

const today = new Date();
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

const DEFAULT_REVIEW: TaskReview = {
  status: 'PENDING',
  note: '',
  updatedAt: '',
};

const TASK_TYPE_META: Record<string, { category: string; severity: TaskEntry['severity']; source: string }> = {
  MISSING_BANK_INFO: { category: 'Bancario', severity: 'warning', source: 'dashboard/tasks' },
  AVAILABLE_ROOM: { category: 'Operativo', severity: 'info', source: 'dashboard/tasks' },
  PETITIONS: { category: 'Solicitudes', severity: 'danger', source: 'dashboard/tasks' },
  DOCUMENTS_MISSING: { category: 'Documentos', severity: 'danger', source: 'dashboard/tasks' },
  CONTRACTS: { category: 'Contratos', severity: 'warning', source: 'dashboard/tasks' },
  BIRTHDAYS: { category: 'Eventos', severity: 'success', source: 'dashboard/tasks' },
  PENDING_PETITIONS: { category: 'Solicitudes', severity: 'danger', source: 'dashboard/tasks' },
};

const makeTaskId = (type: string, keyId: string | number, title: string) => `${type}:${keyId}:${title}`;

const normalizeTaskPayload = (payload: any, reviews: Record<string, TaskReview>): TaskEntry[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload.map((row: any) => {
      const keyId = String(row.task_key_id ?? row.task_id ?? row.task_title ?? Math.random());
      const id = makeTaskId(String(row.task_type || 'GENERAL'), keyId, String(row.task_title || 'Tarea'));
      const meta = TASK_TYPE_META[String(row.task_type || 'GENERAL')] || {
        category: 'General',
        severity: 'info' as const,
        source: 'dashboard/tasks',
      };

      return {
        id,
        keyId,
        type: String(row.task_type || 'GENERAL'),
        category: meta.category,
        severity: meta.severity,
        title: String(row.task_title || 'Tarea sin título'),
        description: String(row.task_description || ''),
        source: meta.source,
        review: reviews[id] || DEFAULT_REVIEW,
      };
    });
  }

  const legacyMaps = [
    { key: 'missing_bank_info', type: 'MISSING_BANK_INFO', title: (row: any) => row.mod_artistic_name || row.user_name || 'Modelo', desc: () => 'Falta información bancaria.' },
    { key: 'missing_documents', type: 'DOCUMENTS_MISSING', title: (row: any) => row.mod_artistic_name || row.user_name || 'Modelo', desc: (row: any) => `Documentos faltantes: ${(row.missing || []).join(', ')}` },
    { key: 'pending_petitions', type: 'PENDING_PETITIONS', title: (row: any) => row.mod_artistic_name || row.user_name || 'Solicitud', desc: (row: any) => `Pendiente: ${row.pet_type || row.type || 'revisión'}` },
    { key: 'birthdays_today', type: 'BIRTHDAYS', title: (row: any) => row.mod_artistic_name || row.user_name || 'Cumpleaños', desc: () => 'Evento de cumpleaños para seguimiento.' },
  ];

  return legacyMaps.flatMap(({ key, type, title, desc }) => {
    const rows = Array.isArray(payload[key]) ? payload[key] : [];
    return rows.map((row: any, index: number) => {
      const keyId = String(row.user_id ?? row.mod_id ?? row.id ?? index);
      const heading = title(row);
      const id = makeTaskId(type, keyId, heading);
      const meta = TASK_TYPE_META[type] || { category: 'General', severity: 'info' as const, source: 'dashboard/tasks' };

      return {
        id,
        keyId,
        type,
        category: meta.category,
        severity: meta.severity,
        title: heading,
        description: desc(row),
        source: meta.source,
        review: reviews[id] || DEFAULT_REVIEW,
      };
    });
  });
};

const badgeClasses: Record<TaskEntry['severity'], string> = {
  info: 'bg-blue-50 text-blue-600 border-blue-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  danger: 'bg-red-50 text-red-600 border-red-100',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const reviewClasses: Record<ReviewStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  APPROVED: 'bg-emerald-50 text-emerald-600',
  REJECTED: 'bg-red-50 text-red-600',
};

const TaskSupervisionPage: React.FC = () => {
  const studioId = getCurrentStudioId();
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(monthEnd);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('PENDING');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [reviews, setReviews] = useState<Record<string, TaskReview>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [selectedTaskId, tasks],
  );

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(tasks.map((task) => task.category)))],
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !term || `${task.title} ${task.description} ${task.type}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'ALL' || task.review.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || task.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tasks, search, statusFilter, categoryFilter]);

  const summary = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((task) => task.review.status === 'PENDING').length,
    approved: tasks.filter((task) => task.review.status === 'APPROVED').length,
    rejected: tasks.filter((task) => task.review.status === 'REJECTED').length,
  }), [tasks]);

  useEffect(() => {
    if (selectedTask) {
      setNoteDraft(selectedTask.review.note || '');
    }
  }, [selectedTask]);

  const loadData = async () => {
    setLoading(true);
    const storedReviews = await getTenantJsonSetting<Record<string, TaskReview>>(REVIEWS_KEY, {});
    const response = await DashboardService.getTasks({
      since: fromDate,
      until: toDate,
      stdId: studioId ? String(studioId) : undefined,
    });
    const payload = response.data?.data ?? response.data ?? [];
    const normalized = normalizeTaskPayload(payload, storedReviews);
    setReviews(storedReviews);
    setTasks(normalized);
    setSelectedTaskId((current) => current && normalized.some((task) => task.id === current) ? current : normalized[0]?.id || null);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [fromDate, toDate, studioId]);

  const saveReview = async (status: ReviewStatus) => {
    if (!selectedTask) return;
    setSaving(true);
    const nextReviews = {
      ...reviews,
      [selectedTask.id]: {
        status,
        note: noteDraft.trim(),
        updatedAt: new Date().toISOString(),
      },
    };
    await upsertTenantSetting(REVIEWS_KEY, nextReviews, 'Revision manual de tareas operativas');
    setReviews(nextReviews);
    setTasks((current) => current.map((task) => task.id === selectedTask.id ? { ...task, review: nextReviews[selectedTask.id] } : task));
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl shadow-xl shadow-slate-900/20">
              <ClipboardList size={28} />
            </div>
            Supervisión de Tareas
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Centro operativo para revisar alertas, solicitudes y pendientes críticos del estudio activo.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap justify-end">
          {[
            { label: 'Pendientes', value: summary.pending, tone: 'text-amber-600' },
            { label: 'Aprobadas', value: summary.approved, tone: 'text-emerald-600' },
            { label: 'Rechazadas', value: summary.rejected, tone: 'text-red-600' },
            { label: 'Total', value: summary.total, tone: 'text-slate-900' },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[96px]">
              <p className={`text-lg font-black ${item.tone}`}>{item.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Desde</label>
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hasta</label>
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" />
        </div>
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tarea, descripción o tipo..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estado</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ReviewStatus | 'ALL')} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm">
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobada</option>
            <option value="REJECTED">Rechazada</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoría</label>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm">
            {categories.map((category) => (
              <option key={category} value={category}>{category === 'ALL' ? 'Todas' : category}</option>
            ))}
          </select>
        </div>
        <button onClick={() => void loadData()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 transition-all">
          <Filter size={12} /> Refrescar
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/60 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-500" />
              Ejecuciones pendientes de revisión
            </h3>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{filteredTasks.length} visibles</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-slate-400" size={30} /></div>
          ) : filteredTasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400 italic">No hay tareas para el filtro actual.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full text-left px-6 py-4 transition-colors ${selectedTaskId === task.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${badgeClasses[task.severity]}`}>{task.category}</span>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${reviewClasses[task.review.status]}`}>{task.review.status}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500 max-w-3xl">{task.description}</p>
                    </div>
                    <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <p>{task.type}</p>
                      <p className="mt-1">{task.source}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/60">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={16} className="text-amber-500" />
              Revisión manual
            </h3>
          </div>

          {selectedTask ? (
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${badgeClasses[selectedTask.severity]}`}>{selectedTask.category}</span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${reviewClasses[selectedTask.review.status]}`}>{selectedTask.review.status}</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">{selectedTask.title}</h4>
                <p className="text-sm text-slate-500 mt-2">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</p>
                  <p className="mt-2 font-bold text-slate-700">{selectedTask.type}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencia</p>
                  <p className="mt-2 font-bold text-slate-700">{selectedTask.keyId}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Observación</label>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={6}
                  placeholder="Documenta la decisión operativa, hallazgos o pasos siguientes..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button disabled={saving} onClick={() => void saveReview('APPROVED')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-60">
                  <CheckCircle2 size={14} /> Aprobar
                </button>
                <button disabled={saving} onClick={() => void saveReview('REJECTED')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-60">
                  <XCircle size={14} /> Rechazar
                </button>
                <button disabled={saving} onClick={() => void saveReview('PENDING')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60">
                  <Clock3 size={14} /> Reabrir
                </button>
              </div>

              {selectedTask.review.updatedAt ? (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Última revisión: {new Date(selectedTask.review.updatedAt).toLocaleString('es-CO')}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-slate-400 italic">
              Selecciona una tarea del panel izquierdo para revisarla.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskSupervisionPage;
