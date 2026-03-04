
import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Edit2, Check, Trash2, Save, RotateCcw } from 'lucide-react';
import RoomControlService from '../RoomControlService';
import { RoomType } from '../types';

interface RoomTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoomTypesModal: React.FC<RoomTypesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [types, setTypes] = useState<RoomType[]>([]);
  
  // Create Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    const data = await RoomControlService.getRoomTypes();
    setTypes(data);
  };

  const handleCreate = async () => {
    if(!newName) return;
    await RoomControlService.createRoomType({ name: newName, description: newDesc });
    setNewName('');
    setNewDesc('');
    loadTypes();
  };

  const startEdit = (t: RoomType) => {
      setEditingId(t.id);
      setEditName(t.name);
      setEditDesc(t.description);
  };

  const saveEdit = async () => {
      if (!editingId) return;
      await RoomControlService.updateRoomType(editingId, { name: editName, description: editDesc });
      setEditingId(null);
      loadTypes();
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditName('');
      setEditDesc('');
  };

  const handleDelete = async (id: string) => {
      // Mensaje de confirmación explícito
      if (window.confirm('¿Deseas eliminar este tipo de habitación?')) {
          try {
            await RoomControlService.deleteRoomType(id);
            // Recargar la lista inmediatamente para reflejar el cambio
            await loadTypes();
          } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Hubo un error al intentar eliminar el elemento.");
          }
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers size={20} className="text-slate-400" /> Tipos de Habitación
             </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Create Section */}
            <div className="p-5 rounded-2xl border bg-slate-50 border-slate-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-500">
                    CREAR NUEVO TIPO
                </h4>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-slate-400 transition-colors placeholder:text-slate-400" 
                        placeholder="Nombre (Ej: Suite)" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                    />
                    <input 
                        type="text" 
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-slate-400 transition-colors placeholder:text-slate-400" 
                        placeholder="Descripción" 
                        value={newDesc} 
                        onChange={e => setNewDesc(e.target.value)} 
                    />
                    <button 
                        onClick={handleCreate} 
                        disabled={!newName}
                        type="button"
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-3">
                {types.map(t => (
                    <div key={t.id} className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm transition-all ${editingId === t.id ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-100 hover:border-slate-200'}`}>
                        {editingId === t.id ? (
                            // Edit Mode (Inline)
                            <div className="flex gap-3 w-full items-center animate-in fade-in">
                                <input 
                                    type="text" 
                                    className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/50 text-sm font-bold outline-none focus:border-amber-500 transition-colors text-slate-800" 
                                    value={editName} 
                                    onChange={e => setEditName(e.target.value)} 
                                    autoFocus
                                />
                                <input 
                                    type="text" 
                                    className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/50 text-sm font-bold outline-none focus:border-amber-500 transition-colors text-slate-600" 
                                    value={editDesc} 
                                    onChange={e => setEditDesc(e.target.value)} 
                                />
                                <div className="flex gap-2">
                                    <button onClick={saveEdit} className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"><Save size={16} /></button>
                                    <button onClick={cancelEdit} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"><X size={16} /></button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">{t.name}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{t.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${t.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                        {t.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <div className="flex gap-2 pl-2 border-l border-slate-100">
                                        <button 
                                            onClick={() => startEdit(t)} 
                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                            title="Editar"
                                            type="button"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(t.id)} 
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Eliminar"
                                            type="button" // IMPORTANTE: type="button" previene submit accidental
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                
                {types.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Layers size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No hay tipos registrados</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoomTypesModal;
