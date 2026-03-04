
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, 
  Variable, Paperclip, ChevronDown, Check,
  X, AlertCircle, Bookmark, Copy
} from 'lucide-react';
import { MessageTemplate } from '../types';

const MOCK_TEMPLATES: MessageTemplate[] = [
  {
    id: 't1',
    name: 'Bienvenida Nuevo Usuario',
    category: 'Onboarding',
    body_text: 'Hola {{nombre}}, bienvenido/a al equipo de El Castillo. Tu turno asignado es {{turno}}.',
    variables_json: ['nombre', 'turno'],
    attachments_json: [],
    scope: 'global',
    is_active: true,
    created_by: 1,
    created_at: '2025-05-10T10:00:00Z',
    updated_at: '2025-05-10T10:00:00Z'
  },
  {
    id: 't2',
    name: 'Reporte de Pago Listo',
    category: 'Pagos',
    body_text: 'Estimado/a {{nombre}}, tu reporte de liquidación para el periodo {{fecha}} ya está disponible en el portal.',
    variables_json: ['nombre', 'fecha'],
    attachments_json: [],
    scope: 'role',
    role_id: 3,
    is_active: true,
    created_by: 1,
    created_at: '2025-05-12T14:00:00Z',
    updated_at: '2025-05-12T14:00:00Z'
  }
];

const ChatTemplatesAdmin: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>(MOCK_TEMPLATES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null);
  const [search, setSearch] = useState('');

  const handleSave = () => {
    if (!editingTemplate?.name || !editingTemplate?.body_text) return;
    
    if (editingTemplate.id) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, ...editingTemplate } as MessageTemplate : t));
    } else {
      const newTemplate: MessageTemplate = {
        ...editingTemplate,
        id: 't' + Date.now(),
        is_active: true,
        variables_json: (editingTemplate.body_text?.match(/{{(.*?)}}/g) || []).map(v => v.replace(/{{|}}/g, '')),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 1,
        scope: 'global'
      } as MessageTemplate;
      setTemplates([newTemplate, ...templates]);
    }
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <BookOpen className="text-amber-500" size={32} />
             Plantillas de Mensaje
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Crea respuestas rápidas con variables dinámicas para agilizar la comunicación.</p>
        </div>
        <button 
          onClick={() => { setEditingTemplate({ name: '', category: 'General', body_text: '' }); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-[#0B1120] font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Plus size={16} /> NUEVA PLANTILLA
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o categoría..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {template.category}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => { setEditingTemplate(template); setIsModalOpen(true); }}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-amber-500"
                   >
                    <Edit2 size={16} />
                   </button>
                   <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                   </button>
                </div>
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-2">{template.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-3">
                "{template.body_text}"
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
               <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {template.variables_json.map(v => (
                    <span key={v} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold">
                      {v}
                    </span>
                  ))}
               </div>
               <button className="p-1.5 text-slate-400 hover:text-slate-900"><Copy size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingTemplate?.id ? 'Editar' : 'Nueva'} Plantilla</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configura el contenido y variables.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                   <X size={20} />
                </button>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
                        value={editingTemplate?.name}
                        onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Categoría</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
                        value={editingTemplate?.category}
                        onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuerpo del Mensaje</label>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                         <Variable size={10} />
                         Usa {'{{variable}}'} para datos dinámicos
                      </div>
                   </div>
                   <textarea 
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 outline-none transition-all resize-none"
                      value={editingTemplate?.body_text}
                      onChange={(e) => setEditingTemplate({...editingTemplate, body_text: e.target.value})}
                   />
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                   <div className="p-2 bg-blue-500 text-white rounded-xl h-fit"><AlertCircle size={16} /></div>
                   <div className="space-y-1">
                      <p className="text-[11px] font-black text-blue-900 uppercase">Vista Previa de Variables</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                         {(editingTemplate?.body_text?.match(/{{(.*?)}}/g) || []).map(v => (
                           <span key={v} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">
                             {v}
                           </span>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all">
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] px-6 py-4 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20"
                >
                  Guardar Plantilla
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatTemplatesAdmin;
