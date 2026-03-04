
import React, { useState } from 'react';
import { Search, AlertCircle, ArrowUpRight, Filter, AlertTriangle, FileWarning, HelpCircle } from 'lucide-react';

interface ModelsTableProps {
    data: any[];
}

export const ModelsTable: React.FC<ModelsTableProps> = ({ data = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = data.filter(m => 
        m.mod_artistic_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h3 className="text-lg font-bold text-slate-900">Metas y Cumplimiento</h3>
            <p className="text-sm text-slate-500 mt-1">Rendimiento individual de modelos</p>
        </div>
        <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text" 
                placeholder="Buscar modelo..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Meta (USD)</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actual (USD)</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Cumplimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {filtered.length > 0 ? filtered.map((m) => (
                <tr key={m.mod_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{m.mod_artistic_name}</td>
                    <td className="px-6 py-4 text-right text-slate-500 font-mono">${m.goal_usd?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 font-mono">${m.current_usd?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${m.percentage < 30 ? 'bg-red-500' : m.percentage < 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                                    style={{width: `${Math.min(m.percentage, 100)}%`}}
                                ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-600 w-10 text-right">{m.percentage}%</span>
                        </div>
                    </td>
                </tr>
            )) : (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No hay datos de metas disponibles</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface TasksListProps {
    tasks: any;
}

export const TasksList: React.FC<TasksListProps> = ({ tasks }) => {
    if (!tasks) return (
        <div className="bg-slate-900 rounded-2xl p-6 h-full text-white/50 animate-pulse">
            Cargando tareas críticas...
        </div>
    );

    // Mapear diferentes tipos de alertas a una lista unificada
    const alerts = [
        ...(tasks.missing_bank_info || []).map((m: any) => ({ 
            title: m.mod_artistic_name, sub: "Falta info bancaria", type: "warning" 
        })),
        ...(tasks.missing_documents || []).map((m: any) => ({ 
            title: m.mod_artistic_name, sub: `Falta doc: ${m.missing?.join(', ')}`, type: "danger" 
        })),
        ...(tasks.pending_petitions || []).map((p: any) => ({ 
            title: p.mod_artistic_name, sub: `Solicitud: ${p.pet_type}`, type: "info" 
        })),
        ...(tasks.birthdays_today || []).map((b: any) => ({ 
            title: b.mod_artistic_name, sub: "¡Cumpleaños hoy!", type: "success" 
        }))
    ].slice(0, 6);

    return (
        <div className="bg-slate-900 rounded-2xl shadow-xl p-6 h-full text-white relative overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">Tareas y Alertas</h3>
                <div className="bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded">
                    {alerts.length}
                </div>
            </div>

            <div className="space-y-3">
                {alerts.length > 0 ? alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 transition-all cursor-pointer">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                            alert.type === 'danger' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            alert.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                           {alert.type === 'danger' ? <FileWarning size={14} /> : <AlertTriangle size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-100 text-xs truncate uppercase tracking-tight">{alert.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{alert.sub}</p>
                        </div>
                        <ArrowUpRight size={14} className="text-slate-600" />
                    </div>
                )) : (
                    <div className="py-20 text-center">
                        <HelpCircle size={32} className="mx-auto text-slate-700 mb-2" />
                        <p className="text-xs text-slate-500">No hay alertas pendientes</p>
                    </div>
                )}
            </div>
            <button className="w-full mt-6 py-3 text-[10px] font-black text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all uppercase tracking-widest">
                CENTRO DE NOTIFICACIONES
            </button>
        </div>
    )
}
