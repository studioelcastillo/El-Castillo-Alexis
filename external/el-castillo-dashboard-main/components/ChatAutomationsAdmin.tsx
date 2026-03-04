
import React, { useState } from 'react';
import { 
  Zap, Plus, Search, Info, Check, 
  Trash2, Filter, Clock, Calendar, 
  Play, Pause, Settings2, ShieldCheck, 
  ChevronRight, Activity, X, Bell,
  Target, Bot
} from 'lucide-react';
import { AutomationRule, AutomationJob } from '../types';

const MOCK_RULES: AutomationRule[] = [
  {
    id: 'r1',
    trigger_type: 'event',
    trigger_event: 'USER_CREATED',
    conditions_json: { role: 'MODELO' },
    target_json: { to: 'new_user' },
    template_id: 't1',
    is_enabled: true,
    created_by: 1,
    created_at: '2025-05-01T08:00:00Z',
    updated_at: '2025-05-01T08:00:00Z'
  },
  {
    id: 'r2',
    trigger_type: 'schedule',
    schedule_cron: '0 9 * * 1', // Cada lunes a las 9am
    conditions_json: {},
    target_json: { to: 'all_monitors' },
    template_id: 't2',
    is_enabled: false,
    created_by: 1,
    created_at: '2025-05-05T10:00:00Z',
    updated_at: '2025-05-10T12:00:00Z'
  }
];

const ChatAutomationsAdmin: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>(MOCK_RULES);
  const [activeTab, setActiveTab] = useState('reglas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, is_enabled: !r.is_enabled } : r));
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Zap className="text-amber-500" size={32} />
             Automatizaciones
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Automatiza el envío de mensajes por eventos del sistema o programación cron.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
        >
          <Plus size={16} /> CREAR AUTOMATIZACIÓN
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
         <button 
          onClick={() => setActiveTab('reglas')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reglas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
         >
           Reglas Activas
         </button>
         <button 
          onClick={() => setActiveTab('ejecuciones')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ejecuciones' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
         >
           Log de Ejecuciones
         </button>
      </div>

      {activeTab === 'reglas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {rules.map(rule => (
             <div key={rule.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all p-8 flex flex-col relative group overflow-hidden">
                {!rule.is_enabled && <div className="absolute inset-0 bg-slate-50/50 z-0 pointer-events-none"></div>}
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div className={`p-3 rounded-2xl ${rule.trigger_type === 'event' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {rule.trigger_type === 'event' ? <Zap size={24} /> : <Clock size={24} />}
                   </div>
                   <button 
                    onClick={() => toggleRule(rule.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${rule.is_enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                   >
                      <div className={`w-1.5 h-1.5 rounded-full ${rule.is_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{rule.is_enabled ? 'Activa' : 'Pausada'}</span>
                      {rule.is_enabled ? <Pause size={10} /> : <Play size={10} />}
                   </button>
                </div>

                <div className="flex-1 space-y-4 relative z-10">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trigger</p>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                         {rule.trigger_type === 'event' ? `Evento: ${rule.trigger_event}` : `Programado: ${rule.schedule_cron}`}
                      </h3>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                         <p className="text-xs font-bold text-slate-700">{JSON.stringify(rule.target_json)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plantilla</p>
                         <p className="text-xs font-bold text-slate-700">#{rule.template_id}</p>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Activity size={14} className="text-slate-300" />
                      Ult. Ejecución: Ayer 14:00
                   </div>
                   <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"><Settings2 size={18} /></button>
                      <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-20 text-center">
            <Bot size={64} strokeWidth={1} className="mx-auto mb-6 text-slate-200" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Historial de Ejecuciones Automáticas</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 font-medium">Monitorea cada mensaje enviado por el motor de automatización en tiempo real.</p>
        </div>
      )}

      {/* New Automation Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Configurar Automatización</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define el disparador y la acción automática resultante.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                     <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <div className="space-y-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap size={14} /> 1. Trigger (Disparador)
                     </h4>
                     <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center gap-3 p-6 bg-amber-50 border-2 border-amber-500 rounded-[32px] shadow-lg shadow-amber-500/10">
                           <Zap className="text-amber-600" size={32} />
                           <span className="text-sm font-black text-slate-900 tracking-tight uppercase">Por Evento</span>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ej: Registro de usuario</span>
                        </button>
                        <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 border border-slate-100 rounded-[32px] hover:border-slate-200 transition-all opacity-60">
                           <Clock className="text-slate-400" size={32} />
                           <span className="text-sm font-black text-slate-900 tracking-tight uppercase">Programado</span>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ej: Cada Lunes 9am</span>
                        </button>
                     </div>
                     <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/5 transition-all">
                        <option>USER_CREATED (Nuevo Usuario)</option>
                        <option>ROLE_CHANGED (Cambio de Rol)</option>
                        <option>SHIFT_STARTED (Inicio de Turno)</option>
                        <option>DOCUMENT_PENDING (Documentación Faltante)</option>
                     </select>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Target size={14} /> 2. Destinatario & Plantilla
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">¿A quién enviar?</label>
                           <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none">
                              <option>Al usuario del evento</option>
                              <option>A todos los Monitores</option>
                              <option>Al Admin de Sede</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Plantilla a usar</label>
                           <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none">
                              <option>Bienvenida Nuevo Usuario</option>
                              <option>Alerta Documentos</option>
                              <option>Reporte de Pago</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[40px] text-white flex gap-6 items-center border border-slate-800">
                     <div className="w-16 h-16 bg-amber-500 text-slate-900 rounded-[24px] flex items-center justify-center shrink-0 shadow-xl">
                        <ShieldCheck size={32} />
                     </div>
                     <div className="space-y-2">
                        <h5 className="text-xs font-black uppercase tracking-widest text-amber-500">Reglas Anti-Spam Activas</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                           Esta automatización respetará el Policy Engine global. No se enviarán mensajes entre las 22:00 y las 08:00 hrs. Los duplicados se ignorarán por 24 horas.
                        </p>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all">
                    Cancelar
                  </button>
                  <button className="flex-[2] px-6 py-4 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3">
                    Activar Automatización <Check size={16} />
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default ChatAutomationsAdmin;
