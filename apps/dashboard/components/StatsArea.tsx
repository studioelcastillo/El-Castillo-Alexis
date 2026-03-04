
import React from 'react';
import { DollarSign, Euro, Users, TrendingUp, Activity, Gift, Crown, ArrowUpRight, MonitorPlay, ChevronRight } from 'lucide-react';

interface StatsAreaProps {
  data: any;
  profId: number;
}

const StatsArea: React.FC<StatsAreaProps> = ({ data, profId }) => {
  if (!data) return null;

  const showFinancials = [1, 2, 3, 4].includes(profId);
  const showAdminStats = profId === 1;
  const showStudioStats = [1, 2, 4].includes(profId);

  return (
    <div className="space-y-6">
      
      {/* 1. Financial Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main COP Income */}
          <div className="relative bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-black rounded-2xl p-6 text-white overflow-hidden shadow-2xl border border-slate-800 group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Crown size={180} />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div> 
                            <span className="text-amber-500/80 font-bold text-xs uppercase tracking-widest">Ingresos Totales (COP)</span>
                        </div>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-sans tabular-nums">
                        $ {data.earnings?.cop?.toLocaleString() || '0'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                          En línea
                      </div>
                  </div>
              </div>
          </div>

          {/* USD Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                      <DollarSign size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">TRM USD</p>
                       <p className="text-lg font-bold text-slate-800 font-mono">
                          $ {data.trm?.usd?.toLocaleString() || '---'}
                       </p>
                  </div>
              </div>
              <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Ganancia USD</p>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">$ {data.earnings?.usd?.toFixed(2) || '0.00'}</h3>
              </div>
          </div>

          {/* EUR Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
                      <Euro size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">TRM EUR</p>
                       <p className="text-lg font-bold text-slate-800 font-mono">
                          $ {data.trm?.eur?.toLocaleString() || '---'}
                       </p>
                  </div>
              </div>
              <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Ganancia EUR</p>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">€ {data.earnings?.eur?.toFixed(2) || '0.00'}</h3>
              </div>
          </div>
      </div>

      {/* 2. Operations & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-900 text-amber-400 rounded-lg">
                        <Activity size={18} />
                      </div>
                      Centro de Operaciones
                  </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {showAdminStats && (
                      <div className="relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-amber-200 transition-all">
                          <p className="text-3xl font-bold text-slate-800 mb-1">{data.studios || 0}</p>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estudios</p>
                      </div>
                  )}

                  <div className="relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                      <p className="text-3xl font-bold text-slate-800 mb-1">{data.models || 0}</p>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Modelos</p>
                  </div>

                  <div className="relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between">
                       <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ocupación</p>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                    {data.rooms ? Math.round((data.rooms.occupied / data.rooms.total) * 100) : 0}%
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-slate-800">
                                {data.rooms?.occupied || 0} / {data.rooms?.total || 0}
                            </p>
                       </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{width: `${data.rooms ? (data.rooms.occupied / data.rooms.total) * 100 : 0}%`}}
                          ></div>
                      </div>
                  </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wide">
                    <Gift size={16} className="text-amber-500" /> Próximos Cumpleaños
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.birthdays?.length > 0 ? data.birthdays.map((b: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> {b.mod_artistic_name} ({b.mod_birthday.split('-')[2]})
                        </span>
                    )) : (
                        <span className="text-[10px] text-slate-400 italic">No hay cumpleaños cercanos</span>
                    )}
                  </div>
              </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-0 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Crown className="text-amber-500 fill-amber-500" size={20} />
                      Top Facturación
                  </h3>
              </div>
              <div className="p-2 flex-1 overflow-y-auto space-y-1">
                  {data.top_models?.length > 0 ? data.top_models.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-400">
                              {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-700 truncate">{m.mod_artistic_name}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{m.std_name}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-black text-emerald-600">$ {m.total_usd?.toFixed(2)}</p>
                          </div>
                      </div>
                  )) : (
                    <div className="py-10 text-center text-[10px] text-slate-400">Sin datos de ranking</div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default StatsArea;
