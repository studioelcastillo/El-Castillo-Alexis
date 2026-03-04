
import React, { useState } from 'react';
import { X, Settings, Check, LayoutTemplate } from 'lucide-react';
import { RoomDashboardSettings } from '../types';

interface DashboardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RoomDashboardSettings;
  onSave: (s: RoomDashboardSettings) => void;
}

const DashboardConfigModal: React.FC<DashboardConfigModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  if (!isOpen) return null;

  const [localSettings, setLocalSettings] = useState(settings);

  const toggleColumn = (key: keyof RoomDashboardSettings['visibleColumns']) => {
    setLocalSettings({
        ...localSettings,
        visibleColumns: {
            ...localSettings.visibleColumns,
            [key]: !localSettings.visibleColumns[key]
        }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Settings size={20} className="text-slate-400" /> Configurar Tablero
             </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
            <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <LayoutTemplate size={14} /> Columnas Visibles
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(localSettings.visibleColumns).map(([key, val]) => (
                        <label key={key} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${val ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'}`}>
                                {val && <Check size={12} />}
                            </div>
                            <input type="checkbox" className="hidden" checked={val} onChange={() => toggleColumn(key as any)} />
                            <span className="text-sm font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Modo Compacto</span>
                <button 
                    onClick={() => setLocalSettings({...localSettings, compactMode: !localSettings.compactMode})}
                    className={`w-10 h-6 rounded-full relative transition-colors ${localSettings.compactMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${localSettings.compactMode ? 'left-5' : 'left-1'}`}></div>
                </button>
            </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50">Cancelar</button>
            <button onClick={() => { onSave(localSettings); onClose(); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

export default DashboardConfigModal;
