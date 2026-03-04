
import React, { useState } from 'react';
import { X, Calendar, Clock, User, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { Room, RoomAssignment, ShiftType } from '../types';
import { MOCK_USERS } from '../constants';

interface RoomAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  selectedDate: string;
  selectedShift: string;
  onSubmit: (assignment: Partial<RoomAssignment> & { isRange?: boolean, endDate?: string }) => void;
}

const RoomAssignmentModal: React.FC<RoomAssignmentModalProps> = ({ 
  isOpen, onClose, room, selectedDate, selectedShift, onSubmit 
}) => {
  if (!isOpen) return null;

  const [modelSearch, setModelSearch] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  
  // Range Logic
  const [isRange, setIsRange] = useState(false);
  const [endDate, setEndDate] = useState(selectedDate);

  // Filter only models from mock users
  const models = MOCK_USERS.filter(u => 
    u.profile?.prof_name === 'MODELO' && 
    (u.user_name.toLowerCase().includes(modelSearch.toLowerCase()) || u.user_surname.toLowerCase().includes(modelSearch.toLowerCase()))
  );

  const handleSubmit = () => {
    if (!selectedModelId) return;
    
    const model = MOCK_USERS.find(u => u.user_id === selectedModelId);
    
    const newAssignment: Partial<RoomAssignment> & { isRange?: boolean, endDate?: string } = {
      room_id: room.id,
      model_id: model?.user_id,
      model_name: `${model?.user_name} ${model?.user_surname}`,
      model_avatar: model?.image, 
      monitor_id: 2, // Mock Monitor ID (current user)
      monitor_name: 'Monitor Actual',
      date: selectedDate,
      shift: selectedShift as ShiftType,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      isRange,
      endDate: isRange ? endDate : undefined
    };

    onSubmit(newAssignment);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight">Asignar Cuarto</h3>
             <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest">{room.code}</span>
                <span className="text-xs text-slate-400 font-medium uppercase">{selectedShift === 'MORNING' ? 'Mañana' : selectedShift === 'AFTERNOON' ? 'Tarde' : 'Noche'}</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
           
           {/* Date Range Selection */}
           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rango de Fechas</label>
                 <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="rangeCheck" 
                      className="rounded text-amber-500 focus:ring-amber-500"
                      checked={isRange}
                      onChange={e => setIsRange(e.target.checked)}
                    />
                    <label htmlFor="rangeCheck" className="text-xs font-bold text-slate-600 cursor-pointer">Asignar varios días</label>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Desde</span>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 flex items-center gap-2">
                       <Calendar size={14} className="text-slate-400" />
                       {selectedDate}
                    </div>
                 </div>
                 {isRange && (
                    <>
                       <ArrowRight size={16} className="text-slate-300 mt-4" />
                       <div className="flex-1 animate-in slide-in-from-left-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Hasta</span>
                          <input 
                             type="date"
                             min={selectedDate}
                             value={endDate}
                             onChange={e => setEndDate(e.target.value)}
                             className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                          />
                       </div>
                    </>
                 )}
              </div>
           </div>

           {/* Model Selector */}
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Seleccionar Modelo</label>
              <div className="relative mb-2">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Buscar modelo..." 
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                 />
              </div>
              
              <div className="h-40 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl">
                 {models.map(user => (
                    <button 
                       key={user.user_id}
                       onClick={() => setSelectedModelId(user.user_id)}
                       className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selectedModelId === user.user_id ? 'bg-amber-50' : ''}`}
                    >
                       <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-500">
                          {user.user_name[0]}{user.user_surname[0]}
                       </div>
                       <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-slate-800">{user.user_name} {user.user_surname}</p>
                          <p className="text-[10px] text-slate-400">{user.user_identification}</p>
                       </div>
                       {selectedModelId === user.user_id && <CheckCircle2 size={16} className="text-amber-500" />}
                    </button>
                 ))}
              </div>
           </div>

           {/* Notes */}
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Observaciones</label>
              <textarea 
                 rows={2}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none resize-none"
                 placeholder="Instrucciones especiales..."
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
              />
           </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all">
              Cancelar
           </button>
           <button 
              disabled={!selectedModelId}
              onClick={handleSubmit}
              className="flex-[2] py-3.5 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {isRange ? 'Confirmar Asignación Múltiple' : 'Confirmar Asignación'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default RoomAssignmentModal;
