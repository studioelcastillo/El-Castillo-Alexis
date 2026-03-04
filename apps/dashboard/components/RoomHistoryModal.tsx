
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertTriangle, FileText, Package } from 'lucide-react';
import { Room } from '../types';
import RoomControlService from '../RoomControlService';

interface RoomHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

const RoomHistoryModal: React.FC<RoomHistoryModalProps> = ({ isOpen, onClose, room }) => {
  if (!isOpen) return null;

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await RoomControlService.getRoomHistory(room.id);
      setHistory(data);
      setLoading(false);
    };
    load();
  }, [room.id]);

  const getIcon = (type: string) => {
    switch(type) {
        case 'ASSIGNMENT': return <User size={16} className="text-blue-500" />;
        case 'TICKET': return <FileText size={16} className="text-emerald-500" />;
        case 'INVENTORY': return <Package size={16} className="text-amber-500" />;
        case 'INCIDENT': return <AlertTriangle size={16} className="text-red-500" />;
        default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight">Historial: {room.code}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Timeline de eventos y operaciones</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>)}
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
                    {history.map((event) => (
                        <div key={event.id} className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm">{getIcon(event.type)}</div>
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{event.type}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">{event.date}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-700">{event.description}</p>
                                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">By: {event.user}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100">
                Exportar CSV
            </button>
        </div>

      </div>
    </div>
  );
};

export default RoomHistoryModal;
