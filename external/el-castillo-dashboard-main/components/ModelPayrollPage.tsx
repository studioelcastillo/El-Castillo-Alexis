
import React, { useState } from 'react';
import { 
  Calendar, Filter, Download, DollarSign, 
  Search, FileText, CheckCircle2, AlertCircle, 
  Building2, CreditCard, ChevronDown, Printer
} from 'lucide-react';
import { MOCK_PAYROLL } from '../constants';

const ModelPayrollPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-12-29 hasta 2026-01-04");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Totals Calculation
  const totalPayable = MOCK_PAYROLL.reduce((acc, curr) => acc + curr.totalPayable, 0);
  const totalUSD = MOCK_PAYROLL.reduce((acc, curr) => acc + curr.usd, 0);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Liquidación de Modelos</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gestión de pagos, deducciones y generación de planos bancarios.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-amber-400 font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest">
                <CheckCircle2 size={16} /> Liquidar Periodo
            </button>
            <button className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all shadow-sm">
                <Printer size={20} />
            </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Period Selector */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                    <Calendar size={12} /> Periodo de Pago
                </label>
                <div className="relative">
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-500/10 appearance-none cursor-pointer"
                    >
                        <option>2025-12-29 hasta 2026-01-04</option>
                        <option>2025-12-22 hasta 2025-12-28</option>
                        <option>2025-12-15 hasta 2025-12-21</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Studio Filter */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                    <Building2 size={12} /> Estudios
                </label>
                <div className="relative">
                    <select className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-500/10 appearance-none cursor-pointer">
                        <option>Todos los Estudios</option>
                        <option>Red Dreams</option>
                        <option>Red Ribbon</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Platform/Filter */}
             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                    <Filter size={12} /> Estado Liquidación
                </label>
                <div className="flex gap-2">
                     <button className="flex-1 bg-slate-900 text-white text-[10px] font-bold py-2.5 rounded-xl shadow-md">TODOS</button>
                     <button className="flex-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold py-2.5 rounded-xl hover:bg-slate-50">PENDIENTES</button>
                </div>
            </div>

            {/* Summary Card (Mini) */}
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700 text-white flex flex-col justify-center shadow-lg shadow-slate-900/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><DollarSign size={48} /></div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Total a Dispersar</p>
                <h3 className="text-2xl font-bold tracking-tight tabular-nums">$ {totalPayable.toLocaleString('es-CO')}</h3>
            </div>

        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
          
          <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <FileText size={16} className="text-amber-500" /> Detalle de Nómina
             </h3>
             <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar modelo..." 
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-medium"
                />
              </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Check</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Modelo</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Estudio</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap text-emerald-600 bg-emerald-50/50">(USD)</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap text-indigo-600 bg-indigo-50/50">(EUR)</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap text-amber-600 bg-amber-50/50">(COP)</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap text-red-500">Descuentos</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Neto</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Rte/Fte</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest text-right whitespace-nowrap bg-slate-100/50">A Pagar</th>
                        <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                    {MOCK_PAYROLL.map((row) => (
                        <tr key={row.id} className="hover:bg-amber-50/10 transition-colors group">
                            <td className="px-4 py-3">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 rounded cursor-pointer" />
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-700">{row.modelName}</td>
                            <td className="px-4 py-3 font-medium text-slate-500">{row.studio}</td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-700 bg-emerald-50/10">{row.usd.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono text-indigo-700 bg-indigo-50/10">{row.eur.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 bg-amber-50/10">${row.copConversion.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono text-red-500 font-medium">-${row.discounts.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 font-medium">${row.netTotal.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-400">-${row.retefuente.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">${row.totalPayable.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                    row.status === 'PAGADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
             <button className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all text-xs uppercase tracking-widest shadow-md shadow-emerald-500/20">
                <Download size={16} /> Descargar Excel Completo
             </button>
          </div>
      </div>

      {/* Bank Payment Files Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Descargar Archivos de Pago (Bancos)</h3>
            <p className="text-xs text-slate-500 mt-1">Selecciona el banco para generar el archivo plano PAB.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                   { id: 'bbva', name: 'Banco BBVA', color: 'text-blue-700', border: 'hover:border-blue-500', bg: 'hover:bg-blue-50' },
                   { id: 'bancolombia', name: 'Bancolombia', color: 'text-black', border: 'hover:border-slate-900', bg: 'hover:bg-slate-50' },
                   { id: 'scotiabank', name: 'Scotiabank', color: 'text-red-600', border: 'hover:border-red-500', bg: 'hover:bg-red-50' },
                   { id: 'avvillas', name: 'AV Villas', color: 'text-blue-500', border: 'hover:border-blue-400', bg: 'hover:bg-blue-50' }
               ].map(bank => (
                   <button 
                     key={bank.id}
                     onClick={() => setSelectedBank(bank.id)}
                     className={`
                        relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group
                        ${selectedBank === bank.id ? `border-amber-500 bg-amber-50 ring-2 ring-amber-500/20` : `border-slate-100 bg-white ${bank.border} ${bank.bg}`}
                     `}
                   >
                       <div className={`mb-3 ${bank.color}`}>
                           <CreditCard size={32} />
                       </div>
                       <span className={`text-xs font-bold uppercase tracking-widest ${selectedBank === bank.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>
                           {bank.name}
                       </span>
                       {selectedBank === bank.id && (
                           <div className="absolute top-3 right-3 text-amber-500">
                               <CheckCircle2 size={18} />
                           </div>
                       )}
                   </button>
               ))}
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-50 pt-4">
              <button 
                disabled={!selectedBank}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-lg"
              >
                  Descargar Plano de Pago
              </button>
          </div>
      </div>

    </div>
  );
};

export default ModelPayrollPage;
