
import React, { useState } from 'react';
import { 
  Megaphone, Plus, Search, Info, Check, 
  Trash2, Filter, Users, Send, Clock, 
  ChevronRight, AlertTriangle, ShieldAlert, X,
  FileText, Activity, BarChart3, Pause, Play
} from 'lucide-react';
import { BroadcastList, BroadcastJob } from '../types';

const MOCK_JOBS: BroadcastJob[] = [
  {
    id: 'j1',
    created_by: 1,
    mode: 'DM_MASS',
    audience_snapshot_json: {},
    message_payload_json: { text: 'Recordatorio de reunión general.' },
    reason: 'Operativo semanal',
    status: 'completed',
    total_targets: 150,
    sent_count: 150,
    delivered_count: 148,
    read_count: 120,
    failed_count: 0,
    skipped_count: 2,
    created_at: '2025-05-20T09:00:00Z',
    finished_at: '2025-05-20T09:05:00Z'
  },
  {
    id: 'j2',
    created_by: 1,
    mode: 'GROUP_ANNOUNCEMENT',
    audience_snapshot_json: {},
    message_payload_json: { text: 'Nuevos horarios publicados.' },
    reason: 'Actualización horarios',
    status: 'running',
    total_targets: 300,
    sent_count: 120,
    delivered_count: 115,
    read_count: 40,
    failed_count: 0,
    skipped_count: 0,
    created_at: '2025-05-22T10:00:00Z'
  }
];

const ChatBroadcastAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('historial');
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [jobs, setJobs] = useState<BroadcastJob[]>(MOCK_JOBS);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'running': return 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100';
      case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Megaphone className="text-amber-500" size={32} />
             Mensajes Masivos (Broadcast)
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Envía mensajes a múltiples usuarios o grupos con segmentación dinámica.</p>
        </div>
        <button 
          onClick={() => setIsNewBroadcastOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
        >
          <Send size={16} /> NUEVO ENVÍO MASIVO
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Envíos hoy', value: '4', icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Destinatarios', value: '1.2k', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Ratio de Lectura', value: '82%', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Jobs en Curso', value: '1', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon size={20} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
         <button 
          onClick={() => setActiveTab('historial')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'historial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
         >
           Historial de Jobs
         </button>
         <button 
          onClick={() => setActiveTab('listas')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'listas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
         >
           Listas de Difusión
         </button>
      </div>

      {activeTab === 'historial' ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job / Motivo</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Progreso</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lectura</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {jobs.map(job => (
                            <tr key={job.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-lg">
                                          {job.mode === 'DM_MASS' ? <Users size={18} /> : <Megaphone size={18} />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-slate-900">{job.reason}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                                             {new Date(job.created_at).toLocaleString()} • {job.mode}
                                          </p>
                                       </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getStatusColor(job.status)}`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="max-w-[120px] mx-auto space-y-2">
                                       <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                          <span>{job.sent_count} / {job.total_targets}</span>
                                          <span>{Math.round((job.sent_count / job.total_targets) * 100)}%</span>
                                       </div>
                                       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-amber-500" style={{ width: `${(job.sent_count / job.total_targets) * 100}%` }}></div>
                                       </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center font-mono text-xs font-bold text-slate-600">
                                   {Math.round((job.read_count / job.sent_count) * 100)}%
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <div className="flex items-center justify-end gap-1">
                                      {job.status === 'running' && (
                                         <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Cancelar Job">
                                            <Pause size={18} />
                                         </button>
                                      )}
                                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                         <ChevronRight size={18} />
                                      </button>
                                   </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-20 text-center">
            <Info size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Módulo de Listas de Difusión</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2 font-medium">Próximamente: Crea segmentos dinámicos guardados para envíos recurrentes.</p>
        </div>
      )}

      {/* New Broadcast Modal (Overlay) */}
      {isNewBroadcastOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsNewBroadcastOpen(false)}></div>
            <div className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Crear Nuevo Broadcast</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configura audiencia, contenido y reglas anti-spam.</p>
                  </div>
                  <button onClick={() => setIsNewBroadcastOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                     <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Segment Selection */}
                  <div className="space-y-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Filter size={14} /> 1. Audiencia (Segmentación)
                     </h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Administradores', 'Monitores', 'Modelos', 'Soporte', 'Sede Cali', 'Sede Bogotá'].map(tag => (
                           <label key={tag} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-amber-200 transition-all group">
                              <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-200 text-amber-500 focus:ring-amber-500/10" />
                              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{tag}</span>
                           </label>
                        ))}
                     </div>
                  </div>

                  {/* Anti-spam & Delivery Config */}
                  <div className="space-y-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShieldAlert size={14} /> 2. Reglas de Envío & Anti-Spam
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Evitar Quiet Hours (22:00 - 08:00)</span>
                              <div className="w-10 h-5 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Modo de entrega</span>
                              <select className="bg-white border-none rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-sm text-slate-600">
                                 <option>Inmediato</option>
                                 <option>Escalonado (Safe)</option>
                                 <option>Programado</option>
                              </select>
                           </div>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                           <AlertTriangle className="text-amber-600 shrink-0" size={16} />
                           <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                              Se estima un alcance de <span className="font-black">1,450 destinatarios</span>. Los mensajes se enviarán en bloques de 50 cada 2 minutos para asegurar la entregabilidad.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Content Selection */}
                  <div className="space-y-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileText size={14} /> 3. Contenido del Mensaje
                     </h4>
                     <div className="space-y-4">
                        <textarea 
                          rows={4}
                          placeholder="Escribe el mensaje masivo..."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 transition-all resize-none outline-none"
                        />
                        <div className="flex gap-2">
                           <button className="px-4 py-2 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all">Usar Plantilla</button>
                           <button className="px-4 py-2 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all">Adjuntar Media</button>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button onClick={() => setIsNewBroadcastOpen(false)} className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all">
                    Descartar
                  </button>
                  <button className="flex-[2] px-6 py-4 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3">
                    Confirmar Envío <Send size={16} />
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default ChatBroadcastAdmin;
