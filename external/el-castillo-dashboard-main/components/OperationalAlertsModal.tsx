
import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Clock, ChevronRight, User } from 'lucide-react';
import { SystemAlert } from '../types';
import RoomControlService from '../RoomControlService';

interface OperationalAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OperationalAlertsModal: React.FC<OperationalAlertsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filterStatus, setFilterStatus] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await RoomControlService.getSystemAlerts(filterStatus === 'ALL' ? undefined : filterStatus);
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, [filterStatus]);

  const handleResolve = async (id: string) => {
      await RoomControlService.resolveSystemAlert(id, 'Manual ACK');
      loadAlerts(); // Refresh
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/20"><ShieldAlert size={24} /></div>
                Alertas Operativas
             </h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Detección automática de rachas negativas y problemas.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
        </div>

        <div className="px-8 py-4 border-b border-slate-100 bg-white flex gap-4">
            <button 
                onClick={() => setFilterStatus('OPEN')} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'OPEN' ? 'bg-red-50 text-red-600 border border-red-100' : 'text-slate-400 hover:bg-slate-50'}`}
            >
                Activas
            </button>
            <button 
                onClick={() => setFilterStatus('RESOLVED')} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'text-slate-400 hover:bg-slate-50'}`}
            >
                Resueltas
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8FAFC]">
            {loading ? (
                <div className="text-center py-10 text-slate-400">Cargando alertas...</div>
            ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <CheckCircle2 size={48} className="mb-4 opacity-20 text-emerald-500" />
                    <p className="font-bold text-sm">Todo en orden. No hay alertas {filterStatus === 'OPEN' ? 'activas' : 'registradas'}.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`relative bg-white p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${alert.severity === 'CRITICAL' ? 'border-red-100 shadow-red-100' : 'border-slate-100'}`}>
                            {alert.status === 'RESOLVED' && (
                                <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-bl-2xl rounded-tr-2xl text-[9px] font-black uppercase tracking-widest">
                                    Resuelto
                                </div>
                            )}
                            
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900">{alert.message}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                <User size={12} /> {alert.subject_name} ({alert.subject_role})
                                                <span className="text-slate-300">•</span>
                                                <Clock size={12} /> {new Date(alert.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                        <div className="text-xs text-slate-600">
                                            <span className="font-bold">Racha Detectada:</span> {alert.streak_count} eventos consecutivos.
                                        </div>
                                        {alert.status === 'OPEN' && (
                                            <button 
                                                onClick={() => handleResolve(alert.id)}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={14} /> Marcar Atendido
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default OperationalAlertsModal;
