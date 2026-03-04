
import React, { useState } from 'react';
import { X, Bell, Volume2, Moon, Shield, Save, Check } from 'lucide-react';
import { ChatSettings } from '../types';

interface ChatSettingsModalProps {
  settings: ChatSettings;
  onClose: () => void;
  onSave: (newSettings: ChatSettings) => void;
}

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-none">
    <span className="text-xs font-bold text-slate-600">{label}</span>
    <button 
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-amber-500' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  </div>
);

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({ settings, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

  const update = (key: keyof ChatSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Preferencias de Chat</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Personaliza tu experiencia</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Sounds */}
          <div>
            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <Volume2 size={14} /> Sonidos y Alertas
            </h4>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <ToggleRow label="Sonido al recibir mensaje" checked={localSettings.sound_incoming} onChange={v => update('sound_incoming', v)} />
              <ToggleRow label="Sonido al enviar mensaje" checked={localSettings.sound_outgoing} onChange={v => update('sound_outgoing', v)} />
              <ToggleRow label="Sonido en menciones (@)" checked={localSettings.sound_mentions} onChange={v => update('sound_mentions', v)} />
            </div>
          </div>

          {/* Visuals */}
          <div>
            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <Bell size={14} /> Visualización
            </h4>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <ToggleRow label="Efecto Glow al recibir mensaje" checked={localSettings.glow_on_new} onChange={v => update('glow_on_new', v)} />
              <ToggleRow label="Mostrar Toast In-App" checked={localSettings.toast_on_new} onChange={v => update('toast_on_new', v)} />
            </div>
          </div>

          {/* Privacy & Behavior */}
          <div>
            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <Shield size={14} /> Privacidad y Quiet Hours
            </h4>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <ToggleRow label="Mostrarme 'En Línea' a otros" checked={localSettings.show_online_status} onChange={v => update('show_online_status', v)} />
              <div className="border-t border-slate-100 my-2 pt-2">
                <ToggleRow label="Activar Horario Silencioso" checked={localSettings.quiet_hours_enabled} onChange={v => update('quiet_hours_enabled', v)} />
                {localSettings.quiet_hours_enabled && (
                  <div className="flex gap-2 mt-3 animate-in slide-in-from-top-1">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Inicio</label>
                      <input 
                        type="time" 
                        value={localSettings.quiet_hours_start} 
                        onChange={e => update('quiet_hours_start', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Fin</label>
                      <input 
                        type="time" 
                        value={localSettings.quiet_hours_end} 
                        onChange={e => update('quiet_hours_end', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={handleSave}
            className="w-full py-3 bg-slate-900 text-amber-400 font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            <Save size={16} /> Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsModal;
