import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, Play, RefreshCw, Download, ChevronRight, AlertCircle,
  CheckCircle2, Clock, XCircle, AlertTriangle, Eye, User, Filter,
  Calendar, ArrowLeft, Activity, DollarSign
} from 'lucide-react';
import ScrapingService, { ScrapingJob, ScrapingStreamateRow } from '../ScrapingService';

// ─── STATUS CONFIG ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  PENDING:           { label: 'Pendiente',     color: 'bg-slate-100 text-slate-600',   icon: Clock },
  RUNNING:           { label: 'En proceso',    color: 'bg-blue-50 text-blue-600',      icon: RefreshCw },
  DONE:              { label: 'Completado',    color: 'bg-emerald-50 text-emerald-600',icon: CheckCircle2 },
  FAILED_TEMPORARY:  { label: 'Error Temp.', color: 'bg-amber-50 text-amber-600',    icon: AlertTriangle },
  FAILED_PERMANENT:  { label: 'Error Fatal',   color: 'bg-red-50 text-red-600',       icon: XCircle },
  MANUAL_REQUIRED:   { label: 'Manual Req.',  color: 'bg-purple-50 text-purple-600',  icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
      <Icon size={10} className={status === 'RUNNING' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  );
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatUSD(val: number | null) {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
}

// ─── RUN PANEL ───────────────────────────────────────────────────────────────
function RunPanel({ onJobStarted }: { onJobStarted: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [site, setSite] = useState('streamate');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [showPass, setShowPass] = useState(false);

  const handleRun = async () => {
    if (!date || !username || !password) {
      setFeedback({ type: 'err', msg: 'Completa todos los campos.' });
      return;
    }
    setRunning(true);
    setFeedback(null);
    const result = await ScrapingService.triggerRun({ date, username, password });
    setRunning(false);
    if (result.jobId) {
      setFeedback({ type: 'ok', msg: result.message });
      setUsername('');
      setPassword('');
      onJobStarted();
    } else {
      setFeedback({ type: 'err', msg: result.message });
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
        <Play size={16} className="text-emerald-500" /> Nueva Extracción
      </h3>

      {/* Site tabs */}
      <div className="flex bg-slate-50 p-1 rounded-2xl gap-1 w-fit">
        {['streamate'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSite(s)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${site === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {s}
          </button>
        ))}
        <span className="px-4 py-2 text-[10px] font-bold text-slate-300 cursor-not-allowed">+ más sitios</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            <Calendar size={10} className="inline mr-1" />Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            <User size={10} className="inline mr-1" />Usuario
          </label>
          <input
            type="email"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="gerencia@ejemplo.com"
            className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            Contraseña <span className="text-[9px] text-slate-300">(no se almacena)</span>
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-bold ${feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {feedback.msg}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {running ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Ejecutando...' : 'Iniciar Extracción'}
        </button>
        <p className="text-[10px] text-slate-400 font-medium">
          🔒 Credenciales en memoria solamente — no se guardan en ninguna base de datos.
        </p>
      </div>
    </div>
  );
}

// ─── JOBS TABLE ───────────────────────────────────────────────────────────────
function JobsTable({
  jobs,
  onViewJob,
  onViewHistory,
  onRefresh,
}: {
  jobs: ScrapingJob[];
  onViewJob: (job: ScrapingJob) => void;
  onViewHistory: (job: ScrapingJob) => void;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState('');

  const filtered = jobs.filter(j =>
    !filter ||
    j.target_date.includes(filter) ||
    j.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-blue-500" /> Historial de Extracciones
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-7 pr-3 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none"
            />
          </div>
          <button onClick={onRefresh} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              {['Sitio', 'Fecha', 'Estado', 'Intentos', 'Inicio', 'Fin', 'Último Error', 'Acciones'].map(h => (
                <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400 italic">
                  No hay extracciones registradas. Inicia una extracción arriba.
                </td>
              </tr>
            )}
            {filtered.map(job => (
              <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-black text-slate-700 capitalize">{job.site}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">{job.target_date}</td>
                <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600 text-center">{job.attempts_count}</td>
                <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {job.started_at ? new Date(job.started_at).toLocaleString('es-CO') : '—'}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {job.finished_at ? new Date(job.finished_at).toLocaleString('es-CO') : '—'}
                </td>
                <td className="px-6 py-4 text-xs text-red-500 max-w-[200px] truncate" title={job.last_error || ''}>
                  {job.last_error || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewHistory(job)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all shadow-sm"
                      title="Ver historial de intentos"
                    >
                      <Activity size={11} /> Historial
                    </button>
                    {job.status === 'DONE' && (
                      <button
                        onClick={() => onViewJob(job)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-all shadow-md shadow-slate-900/10"
                      >
                        <Eye size={11} /> Ver datos
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ATTEMPTS TABLE ─────────────────────────────────────────────────────────
function AttemptsTable({ job, onBack }: { job: ScrapingJob; onBack: () => void }) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShot, setSelectedShot] = useState<any | null>(null);

  useEffect(() => {
    ScrapingService.getJobAttempts(job.id).then(a => {
      setAttempts(a);
      setSelectedShot(a.find((item) => item.screenshot_url) || null);
      setLoading(false);
    });
  }, [job.id]);

  const screenshotAttempts = attempts.filter((attempt) => attempt.screenshot_url);

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2 text-blue-500">
              <Activity size={14} /> Historial de Intentos
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">{job.site} — {job.target_date}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-slate-400" size={28} /></div>
      ) : (
        <div className="space-y-6 p-6">
          {screenshotAttempts.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Pantallazos de depuración</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{screenshotAttempts.length} capturas</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {screenshotAttempts.map((att) => (
                    <button
                      key={`${att.id}-shot`}
                      onClick={() => setSelectedShot(att)}
                      className={`text-left rounded-[24px] border overflow-hidden transition-all ${selectedShot?.id === att.id ? 'border-blue-300 shadow-lg shadow-blue-100' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}
                    >
                      <img src={att.screenshot_url} alt={`Captura ${att.stage}`} className="w-full h-48 object-cover bg-slate-100" />
                      <div className="p-4 space-y-2 bg-white">
                        <div className="flex items-center justify-between gap-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest">{att.stage}</span>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${att.error_type ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{att.error_type || 'OK'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{att.current_url || 'Sin URL registrada.'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedShot ? (
                <div className="bg-slate-950 rounded-[28px] p-4 shadow-xl space-y-4">
                  <img src={selectedShot.screenshot_url} alt={`Preview ${selectedShot.stage}`} className="w-full rounded-[20px] border border-white/10 bg-slate-900" />
                  <div className="space-y-2 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.2em]">{selectedShot.stage}</span>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedShot.error_type ? 'bg-red-500/20 text-red-200' : 'bg-emerald-500/20 text-emerald-200'}`}>{selectedShot.error_type || 'OK'}</span>
                    </div>
                    <p className="text-xs text-slate-300 break-all">{selectedShot.current_url || 'Sin URL registrada.'}</p>
                    <p className="text-[11px] text-slate-400">{selectedShot.error_message || 'Sin mensaje de error para esta etapa.'}</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-[24px] border border-slate-100">
            <table className="w-full text-left bg-white">
              <thead className="bg-slate-50/50">
                <tr>
                  {['#', 'Etapa', 'Inicio', 'Fin', 'Duración', 'Error', 'Captura', 'Mensaje'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attempts.map(att => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-slate-400">{att.attempt_number}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                        {att.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">
                      {att.started_at ? new Date(att.started_at).toLocaleString('es-CO') : '—'}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500">
                      {att.ended_at ? new Date(att.ended_at).toLocaleString('es-CO') : '—'}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-900 font-black">
                      {att.duration_ms ? `${(att.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {att.error_type ? (
                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {att.error_type}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">OK</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {att.screenshot_url ? (
                        <button onClick={() => setSelectedShot(att)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
                          Ver captura
                        </button>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[320px] truncate" title={att.error_message || att.current_url || ''}>
                      {att.error_message || att.current_url || '—'}
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400 italic">No hay registros detallados para este job.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODEL LIST ────────────────────────────────────────────────────────────────
function ModelList({ jobId, onSelectModel }: { jobId: string; onSelectModel: (model: string) => void }) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ScrapingService.getModelsForJob(jobId).then(m => { setModels(m); setLoading(false); });
  }, [jobId]);

  if (loading) return <div className="flex justify-center py-8"><RefreshCw className="animate-spin text-slate-400" size={24} /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {models.map(model => (
        <button
          key={model}
          onClick={() => onSelectModel(model)}
          className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-lg mb-3">
                {model.charAt(0).toUpperCase()}
              </div>
              <p className="font-black text-slate-900 text-sm">{model}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Ver transacciones</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── TRANSACTION TABLE ────────────────────────────────────────────────────────
function TransactionTable({ jobId, modelName, onBack }: { jobId: string; modelName: string; onBack: () => void }) {
  const [rows, setRows] = useState<ScrapingStreamateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ScrapingService.getStreamateData(jobId, modelName).then(r => { setRows(r); setLoading(false); });
  }, [jobId, modelName]);

  const totalEarnings = rows.reduce((acc, r) => acc + (r.earnings_usd || 0), 0);

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3 className="font-black text-slate-900 text-sm">{modelName}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{rows.length} transacciones</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Total Ganancias</p>
            <p className="text-lg font-black text-emerald-600">{formatUSD(totalEarnings)}</p>
          </div>
          <button
            onClick={() => ScrapingService.exportCsv(jobId, modelName)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all"
          >
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-slate-400" size={28} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                {['Fecha / Hora', 'Cliente', 'ID Cliente', 'Tipo', 'Sitio', 'Duración', 'Precio', 'Ganancias'].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {row.transaction_date ? new Date(row.transaction_date).toLocaleString('es-CO') : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-900">{row.customer_username || '—'}</td>
                  <td className="px-5 py-4 text-xs font-mono text-slate-500">{row.customer_id || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase whitespace-nowrap">
                      {row.tip_type || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 capitalize">{row.site || '—'}</td>
                  <td className="px-5 py-4 text-xs font-mono text-slate-600">{formatDuration(row.duration_seconds)}</td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-700">{formatUSD(row.price_usd)}</td>
                  <td className="px-5 py-4 text-sm font-black text-emerald-600">{formatUSD(row.earnings_usd)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400 italic">Sin transacciones.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const ScrapingPaginasPage: React.FC = () => {
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Navigation state
  const [selectedJob, setSelectedJob] = useState<ScrapingJob | null>(null);
  const [viewingJobLogs, setViewingJobLogs] = useState<ScrapingJob | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Filters
  const [filterSite, setFilterSite] = useState('streamate');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    const data = await ScrapingService.getJobs(filterSite || undefined, filterFrom || undefined, filterTo || undefined);
    setJobs(data);
    setLoadingJobs(false);
  }, [filterSite, filterFrom, filterTo]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Auto-refresh every 10s if any job is RUNNING
  useEffect(() => {
    const hasRunning = jobs.some(j => j.status === 'RUNNING');
    if (!hasRunning) return;
    const interval = setInterval(loadJobs, 10000);
    return () => clearInterval(interval);
  }, [jobs, loadJobs]);

  const doneJobs = jobs.filter(j => j.status === 'DONE').length;
  const runningJobs = jobs.filter(j => j.status === 'RUNNING').length;
  const errorJobs = jobs.filter(j => j.status.startsWith('FAILED') || j.status === 'MANUAL_REQUIRED').length;
  const completionPct = jobs.length ? Math.round((doneJobs / jobs.length) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-blue-400 rounded-2xl shadow-xl shadow-slate-900/20">
              <Globe size={28} />
            </div>
            Scraping Páginas
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Extracción de datos de plataformas externas (modo Master).
          </p>
        </div>

        {/* Summary cards */}
        {!selectedJob && (
          <div className="flex gap-3 flex-wrap justify-end">
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-lg font-black text-slate-900">{jobs.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Total</p>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-lg font-black text-blue-600">{runningJobs}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Activos</p>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-lg font-black text-emerald-600">{doneJobs}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Completos</p>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-lg font-black text-red-500">{errorJobs}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Con Error</p>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[80px]">
              <div className="relative h-8 flex items-center justify-center">
                <p className="text-lg font-black text-slate-900">{completionPct}%</p>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Progreso</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!selectedJob && jobs.length > 0 && (
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      )}

      {/* DRILL-DOWN: Attempts history */}
      {viewingJobLogs && (
        <AttemptsTable
          job={viewingJobLogs}
          onBack={() => setViewingJobLogs(null)}
        />
      )}

      {/* DRILL-DOWN: Transaction table */}
      {selectedJob && selectedModel && (
        <TransactionTable
          jobId={selectedJob.id}
          modelName={selectedModel}
          onBack={() => setSelectedModel(null)}
        />
      )}

      {/* DRILL-DOWN: Model list */}
      {selectedJob && !selectedModel && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedJob(null)}
              className="p-2 bg-white border border-slate-100 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Extracción: {selectedJob.target_date} — <span className="capitalize">{selectedJob.site}</span>
              </h2>
              <p className="text-xs text-slate-500">Selecciona un modelo para ver sus transacciones</p>
            </div>
          </div>
          <ModelList jobId={selectedJob.id} onSelectModel={setSelectedModel} />
        </div>
      )}

      {/* HOME LEVEL: Run panel + filters + jobs table */}
      {!selectedJob && (
        <>
          {/* Run Panel */}
          <RunPanel onJobStarted={loadJobs} />

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sitio</label>
              <select
                value={filterSite}
                onChange={e => setFilterSite(e.target.value)}
                className="p-2.5 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm"
              >
                <option value="">Todos</option>
                <option value="streamate">Streamate</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Desde</label>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="p-2.5 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hasta</label>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="p-2.5 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none shadow-sm" />
            </div>
            <button
              onClick={loadJobs}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              <Filter size={12} /> Filtrar
            </button>
          </div>

          {loadingJobs
            ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-slate-400" size={32} /></div>
            : (
              <JobsTable
                jobs={jobs}
                onViewJob={setSelectedJob}
                onViewHistory={setViewingJobLogs}
                onRefresh={loadJobs}
              />
            )
          }
        </>
      )}
    </div>
  );
};

export default ScrapingPaginasPage;
