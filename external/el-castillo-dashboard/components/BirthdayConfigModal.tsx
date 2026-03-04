
import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, Clock, Zap, Variable, Mail } from 'lucide-react';
import { BirthdayTemplate } from '../types';
import BirthdayService from '../BirthdayService';

interface BirthdayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BirthdayConfigModal: React.FC<BirthdayConfigModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [template, setTemplate] = useState<BirthdayTemplate>({
      isActive: false,
      bodyText: '',
      sendTime: '09:00',
      channel: 'IN_APP'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
      const load = async () => {
          const data = await BirthdayService.getTemplate();
          setTemplate(data);
          setLoading(false);
      };
      load();
  }, []);

  const handleSave = async () => {
      setSaving(true);
      await BirthdayService.saveTemplate(template);
      setSaving(false);
      onClose();
      alert("Configuración de cumpleaños actualizada.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare size={20} className="text-pink-500" /> Mensaje Automático
             </h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración de Felicitaciones</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        {/* Content */}
        {loading ? (
            <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : (
            <div className="p-6 space-y-6">
                
                {/* Toggle Active */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-sm font-bold text-slate-900">Activar Envío Automático</p>
                        <p className="text-[10px] text-slate-500 font-medium">Se enviará el día del cumpleaños.</p>
                    </div>
                    <button 
                        onClick={() => setTemplate({...template, isActive: !template.isActive})}
                        className={`w-12 h-6 rounded-full relative transition-colors ${template.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${template.isActive ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                {/* Body Text */}
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mensaje</label>
                    <textarea 
                        rows={4}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-pink-500/10 outline-none transition-all resize-none"
                        value={template.bodyText}
                        onChange={(e) => setTemplate({...template, bodyText: e.target.value})}
                    />
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                        {['{{first_name}}', '{{last_name}}', '{{company_name}}'].map(v => (
                            <span key={v} className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded cursor-pointer hover:bg-slate-200" title="Click to copy">
                                {v}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hora de Envío</label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="time" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                                value={template.sendTime}
                                onChange={(e) => setTemplate({...template, sendTime: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Canal</label>
                        <div className="relative">
                            <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none appearance-none"
                                value={template.channel}
                                onChange={(e) => setTemplate({...template, channel: e.target.value as any})}
                            >
                                <option value="IN_APP">In-App (Notificación)</option>
                                <option value="EMAIL">Email</option>
                                <option value="WHATSAPP">WhatsApp (Integrado)</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-xl hover:bg-slate-100">Cancelar</button>
            <button 
                onClick={handleSave}
                disabled={saving || loading}
                className="px-6 py-3 bg-slate-900 text-pink-400 text-[10px] font-black uppercase rounded-xl hover:bg-black shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50"
            >
                <Save size={14} /> Guardar Cambios
            </button>
        </div>

      </div>
    </div>
  );
};

export default BirthdayConfigModal;
