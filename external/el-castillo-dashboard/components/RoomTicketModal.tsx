
import React, { useState, useEffect } from 'react';
import { 
  X, CheckSquare, ClipboardList, Camera, AlertTriangle, 
  ThumbsUp, ThumbsDown, MessageSquare, Save, CheckCircle2,
  FileText
} from 'lucide-react';
import { Room, RoomAssignment, RoomTicket, InventoryItem } from '../types';
import RoomControlService from '../RoomControlService';

interface RoomTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  assignment: RoomAssignment;
  type: 'DELIVERY' | 'RETURN'; 
  existingTicket?: RoomTicket | null;
  onSubmit: (ticket: RoomTicket) => void;
}

const RoomTicketModal: React.FC<RoomTicketModalProps> = ({ 
  isOpen, onClose, room, assignment, type, existingTicket, onSubmit 
}) => {
  if (!isOpen) return null;

  // --- State Management ---
  const [checklist, setChecklist] = useState<InventoryItem[]>([]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Data
  useEffect(() => {
    if (existingTicket) {
      setTicketId(existingTicket.id);
      setChecklist(existingTicket.checklist);
      setNotes(existingTicket.notes || '');
      setRating(type === 'RETURN' ? existingTicket.rating_monitor_to_model || 0 : existingTicket.rating_model_to_monitor || 0);
    } else {
      // New ticket: Clone room inventory as checklist
      setChecklist(room.inventory.map(i => ({ ...i, condition: 'OK' })));
    }
  }, [existingTicket, room.inventory, type]);

  const handleConditionChange = (id: string, condition: 'OK' | 'MISSING' | 'DAMAGED') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, condition } : item));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const ticketData: Partial<RoomTicket> = {
      id: ticketId || undefined,
      assignment_id: assignment.id,
      room_id: room.id,
      type,
      checklist,
      notes,
      rating_monitor_to_model: type === 'RETURN' ? rating : undefined,
      status: 'DRAFT',
      signed_by_monitor: true, // Simulating signature
      signed_by_model: false
    };

    try {
      const savedTicket = await RoomControlService.createTicket(ticketData);
      setTicketId(savedTicket.id);
      alert('Borrador guardado correctamente. Puedes continuar editando.');
    } catch (e) {
      console.error(e);
      alert('Error al guardar borrador.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    const ticketData: Partial<RoomTicket> = {
      id: ticketId || undefined,
      assignment_id: assignment.id,
      room_id: room.id,
      type,
      checklist,
      notes,
      rating_monitor_to_model: type === 'RETURN' ? rating : undefined,
      status: 'SUBMITTED',
      signed_by_monitor: true,
      signed_by_model: true
    };

    try {
      const savedTicket = await RoomControlService.createTicket(ticketData);
      onSubmit(savedTicket as RoomTicket);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al enviar ticket.');
    } finally {
      setIsSaving(false);
    }
  };

  const isCritical = checklist.some(i => i.condition !== 'OK');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={() => { if(confirm("¿Cerrar sin guardar?")) onClose(); }} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${type === 'DELIVERY' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white shadow-lg ${type === 'DELIVERY' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                 <ClipboardList size={20} />
              </div>
              <div>
                 <h3 className={`text-lg font-black tracking-tight ${type === 'DELIVERY' ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {type === 'DELIVERY' ? 'Entrega de Habitación' : 'Recibo de Habitación'}
                 </h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {room.code} • {assignment.model_name}
                 </p>
              </div>
           </div>
           <button onClick={() => onClose()} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           
           {activeStep === 1 && (
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">1. Verificación de Inventario</h4>
                   <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">{checklist.length} Ítems</span>
                </div>

                <div className="space-y-3">
                   {checklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${item.condition === 'OK' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            <span className="text-sm font-bold text-slate-700">{item.name} <span className="text-slate-400 text-xs">x{item.qty}</span></span>
                         </div>
                         <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                            <button 
                              onClick={() => handleConditionChange(item.id, 'OK')}
                              className={`px-3 py-1.5 rounded text-[10px] font-black transition-all ${item.condition === 'OK' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                            >OK</button>
                            <button 
                              onClick={() => handleConditionChange(item.id, 'MISSING')}
                              className={`px-3 py-1.5 rounded text-[10px] font-black transition-all ${item.condition === 'MISSING' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                            >FALTA</button>
                            <button 
                              onClick={() => handleConditionChange(item.id, 'DAMAGED')}
                              className={`px-3 py-1.5 rounded text-[10px] font-black transition-all ${item.condition === 'DAMAGED' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                            >DAÑO</button>
                         </div>
                      </div>
                   ))}
                </div>

                {isCritical && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start animate-in slide-in-from-bottom-2">
                      <AlertTriangle className="text-red-500 shrink-0" size={18} />
                      <div>
                         <p className="text-xs font-bold text-red-800">Incidencias Detectadas</p>
                         <p className="text-[10px] text-red-600 mt-1">Se requerirá evidencia fotográfica obligatoria para cerrar este ticket.</p>
                         <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">
                            <Camera size={14} /> Adjuntar Fotos
                         </button>
                      </div>
                   </div>
                )}

                <div>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Notas Adicionales</label>
                   <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-amber-500/10 outline-none resize-none transition-all"
                      rows={3}
                      placeholder="Observaciones sobre limpieza, orden, etc..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                   />
                </div>
             </div>
           )}

           {activeStep === 2 && (
             <div className="text-center py-8 space-y-8 animate-in slide-in-from-right-4">
                <div>
                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Firma y Cierre</h4>
                   <p className="text-xs text-slate-500">Confirma que la inspección ha sido realizada.</p>
                </div>
                
                {/* Rating only on Return */}
                {type === 'RETURN' && (
                    <div className="flex justify-center gap-4">
                    {[1,2,3,4,5].map(star => (
                        <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className={`w-12 h-12 rounded-2xl text-xl font-bold flex items-center justify-center transition-all ${
                            rating >= star ? 'bg-amber-400 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            ★
                        </button>
                    ))}
                    </div>
                )}

                <div className="bg-slate-50 p-6 rounded-3xl mx-auto max-w-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resumen</p>
                   <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                      <span>Estado Inventario</span>
                      <span className={isCritical ? 'text-red-500' : 'text-emerald-500'}>{isCritical ? 'CON NOVEDADES' : 'OK'}</span>
                   </div>
                   <div className="flex justify-between text-sm font-bold text-slate-700">
                      <span>Total Ítems</span>
                      <span>{checklist.length}</span>
                   </div>
                </div>
             </div>
           )}

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
           {activeStep === 2 && (
              <button 
                onClick={() => setActiveStep(1)}
                className="px-6 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                 Atrás
              </button>
           )}
           
           <div className="flex-1 flex gap-2">
                <button 
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-white border border-slate-300 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                    <FileText className="inline mr-2" size={14} /> Guardar Borrador
                </button>
                <button 
                    onClick={() => activeStep === 1 ? setActiveStep(2) : handleFinalSubmit()}
                    disabled={isSaving}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                        type === 'DELIVERY' ? 'bg-emerald-900 text-emerald-400 hover:bg-emerald-950 shadow-emerald-900/20' : 'bg-amber-900 text-amber-400 hover:bg-amber-950 shadow-amber-900/20'
                    }`}
                >
                    {activeStep === 1 ? 'Continuar' : 'Finalizar Ticket'}
                    {activeStep === 1 ? <CheckCircle2 size={16} /> : <Save size={16} />}
                </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default RoomTicketModal;
