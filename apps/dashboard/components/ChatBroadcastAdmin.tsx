
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Info,
  Filter, Users, Send,
  ChevronRight, AlertTriangle, ShieldAlert, X,
  FileText, Activity, BarChart3, Pause
} from 'lucide-react';
import { BroadcastList, BroadcastJob } from '../types';
import ChatService from '../ChatService';

const SEGMENT_TAGS = ['Administradores', 'Monitores', 'Modelos', 'Soporte', 'Sede Cali', 'Sede Bogotá'];

const ChatBroadcastAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('historial');
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [jobs, setJobs] = useState<BroadcastJob[]>([]);
  const [lists, setLists] = useState<BroadcastList[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingLists, setLoadingLists] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [reason, setReason] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'running': return 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100';
      case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await ChatService.getBroadcastJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error loading broadcast jobs', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadLists = async () => {
    setLoadingLists(true);
    try {
      const data = await ChatService.getBroadcastLists();
      setLists(data);
    } catch (error) {
      console.error('Error loading broadcast lists', error);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadLists();
  }, []);

  const handleSendBroadcast = async () => {
    if (!messageText.trim()) return alert('Escribe un mensaje antes de enviar.');
    setSending(true);
    try {
      const job = await ChatService.sendBroadcast({
        mode: 'DM_MASS',
        audience_rules_json: { tags: selectedSegments },
        message_payload: { text: messageText.trim() },
        reason: reason.trim() || 'Broadcast manual',
      });

      if (job) {
        setJobs((prev) => [job, ...prev]);
      }
      setIsNewBroadcastOpen(false);
      setMessageText('');
      setReason('');
      setSelectedSegments([]);
    } catch (error) {
      console.error('Error sending broadcast', error);
      alert('No se pudo crear el broadcast.');
    } finally {
      setSending(false);
    }
  };

  const jobsToday = jobs.filter((job) => {
    const created = new Date(job.created_at).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return created === today;
  }).length;
  const totalTargets = jobs.reduce((sum, job) => sum + (job.total_targets || 0), 0);
  const sentTotal = jobs.reduce((sum, job) => sum + (job.sent_count || 0), 0);
  const readTotal = jobs.reduce((sum, job) => sum + (job.read_count || 0), 0);
  const readRate = sentTotal > 0 ? Math.round((readTotal / sentTotal) * 100) : 0;
  const runningJobs = jobs.filter((job) => job.status === 'running').length;

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
            { label: 'Envíos hoy', value: jobsToday.toString(), icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Destinatarios', value: totalTargets.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Ratio de Lectura', value: `${readRate}%`, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Jobs en Curso', value: runningJobs.toString(), icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' }
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
                        {loadingJobs ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-xs font-bold text-slate-400">Cargando jobs...</td>
                          </tr>
                        ) : jobs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-xs font-bold text-slate-400">No hay envios registrados</td>
                          </tr>
                        ) : jobs.map(job => {
                            const progressPct = job.total_targets > 0 ? Math.round((job.sent_count / job.total_targets) * 100) : 0;
                            const readPct = job.sent_count > 0 ? Math.round((job.read_count / job.sent_count) * 100) : 0;
                            return (
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
                                          <span>{progressPct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                           <div className="h-full bg-amber-500" style={{ width: `${progressPct}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center font-mono text-xs font-bold text-slate-600">
                                   {readPct}%
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <div className="flex items-center justify-end gap-1">
                                       {job.status === 'running' && (
                                          <button
                                            onClick={async () => {
                                              await ChatService.cancelBroadcastJob(job.id);
                                              await loadJobs();
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Cancelar Job"
                                          >
                                             <Pause size={18} />
                                          </button>
                                       )}
                                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                         <ChevronRight size={18} />
                                      </button>
                                   </div>
                                </td>
                            </tr>
                          );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
         <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-8">
             {loadingLists ? (
               <div className="py-12 text-center text-xs font-bold text-slate-400">Cargando listas...</div>
             ) : lists.length === 0 ? (
               <div className="text-center py-12">
                 <Info size={48} className="mx-auto mb-4 text-slate-300" />
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">Sin listas guardadas</h3>
                 <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2 font-medium">Crea segmentos dinamicos para envios recurrentes.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {lists.map((list) => (
                   <div key={list.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50">
                     <h4 className="text-sm font-black text-slate-900">{list.name}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Segmento</p>
                     <pre className="text-[10px] text-slate-500 mt-2 whitespace-pre-wrap">{JSON.stringify(list.audience_rules_json, null, 2)}</pre>
                   </div>
                 ))}
               </div>
             )}
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
                        {SEGMENT_TAGS.map(tag => (
                           <label key={tag} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-amber-200 transition-all group">
                              <input
                                type="checkbox"
                                checked={selectedSegments.includes(tag)}
                                onChange={(e) => {
                                  setSelectedSegments((prev) =>
                                    e.target.checked ? [...prev, tag] : prev.filter((s) => s !== tag)
                                  );
                                }}
                                className="w-5 h-5 rounded-lg border-slate-200 text-amber-500 focus:ring-amber-500/10"
                              />
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
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 transition-all resize-none outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Motivo del envio"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 transition-all outline-none"
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
                   <button
                     onClick={handleSendBroadcast}
                     disabled={sending}
                     className="flex-[2] px-6 py-4 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-60"
                   >
                     {sending ? 'Enviando...' : 'Confirmar Envio'} <Send size={16} />
                   </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default ChatBroadcastAdmin;
