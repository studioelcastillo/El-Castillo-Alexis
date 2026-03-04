
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Building2, Save } from 'lucide-react';
import { Room, RoomStatus } from '../types';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRoom?: Room; // Added for Edit mode
  onSave: (room: Partial<Room>) => void;
}

const AddRoomModal: React.FC<AddRoomModalProps> = ({ isOpen, onClose, existingRoom, onSave }) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('');
  const [type, setType] = useState('Standard');
  const [floor, setFloor] = useState('1');
  const [status, setStatus] = useState<RoomStatus>('ACTIVE');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingRoom) {
      setCode(existingRoom.code);
      setType(existingRoom.type);
      setFloor(existingRoom.floor || '1');
      setStatus(existingRoom.status);
      setNotes(existingRoom.notes || '');
    }
  }, [existingRoom]);

  const handleSubmit = () => {
    if (!code) return;
    onSave({
      id: existingRoom?.id,
      code,
      type,
      floor,
      status,
      notes,
      // Keep existing properties if editing
      inventory: existingRoom?.inventory || [],
      incidents_count: existingRoom?.incidents_count || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight">{existingRoom ? 'Editar Cuarto' : 'Agregar Cuarto'}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de espacios</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Código / Número</label>
              <div className="relative">
                 <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Ej: H-201"
                   className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500 transition-all"
                   value={code}
                   onChange={e => setCode(e.target.value)}
                   autoFocus
                 />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo</label>
                 <select 
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                   value={type}
                   onChange={e => setType(e.target.value)}
                 >
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Suite</option>
                    <option>Streaming</option>
                 </select>
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Piso</label>
                 <input 
                   type="text" 
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                   value={floor}
                   onChange={e => setFloor(e.target.value)}
                 />
              </div>
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Estado</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 {(['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as RoomStatus[]).map(s => (
                    <button 
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                       {s === 'ACTIVE' ? 'Activo' : s === 'MAINTENANCE' ? 'Manten.' : 'Inactivo'}
                    </button>
                 ))}
              </div>
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Notas Internas</label>
              <textarea
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none"
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100">Cancelar</button>
           <button onClick={handleSubmit} className="flex-[2] py-3 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black flex items-center justify-center gap-2">
              {existingRoom ? <Save size={16} /> : <CheckCircle2 size={16} />} 
              {existingRoom ? 'Guardar Cambios' : 'Crear Cuarto'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;
