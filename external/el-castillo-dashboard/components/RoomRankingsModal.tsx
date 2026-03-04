
import React, { useState, useEffect } from 'react';
import { X, Trophy, TrendingUp, TrendingDown, Minus, Filter, Calendar, RefreshCw } from 'lucide-react';
import RoomControlService from '../RoomControlService';
import { UserRanking, RankingFilterParams, RoomType } from '../types';
import Avatar from './Avatar';

interface RoomRankingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoomRankingsModal: React.FC<RoomRankingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'MONITOR' | 'MODELO'>('MONITOR');
  const [data, setData] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Filter State
  const [filters, setFilters] = useState<Omit<RankingFilterParams, 'role'>>({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
      endDate: new Date().toISOString().split('T')[0],
      shift: 'ALL',
      roomType: 'ALL'
  });

  // Load Room Types for filter
  useEffect(() => {
      RoomControlService.getRoomTypes().then(setRoomTypes);
  }, []);

  // Load Rankings
  const loadRankings = async () => {
    setLoading(true);
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 600));
    const res = await RoomControlService.getOperationalRankings({
        role: activeTab,
        ...filters
    });
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadRankings();
  }, [activeTab, filters]); // Reload on any filter change

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-xl text-slate-900 shadow-lg shadow-amber-500/20"><Trophy size={24} /></div>
                Rankings Operativos
             </h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Desempeño basado en tickets y calificaciones.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
        </div>

        {/* Filters Bar */}
        <div className="px-8 py-4 border-b border-slate-100 bg-white flex flex-col xl:flex-row gap-4 justify-between items-center">
           <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button 
                onClick={() => setActiveTab('MONITOR')}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MONITOR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 Monitores
              </button>
              <button 
                onClick={() => setActiveTab('MODELO')}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MODELO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 Modelos
              </button>
           </div>
           
           <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                 <Calendar size={14} className="text-slate-400 ml-2" />
                 <input 
                    type="date" 
                    value={filters.startDate} 
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none w-24"
                 />
                 <span className="text-slate-300">-</span>
                 <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none w-24"
                 />
              </div>

              <select 
                value={filters.shift}
                onChange={(e) => handleFilterChange('shift', e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none"
              >
                  <option value="ALL">Todos los Turnos</option>
                  <option value="MORNING">Mañana</option>
                  <option value="AFTERNOON">Tarde</option>
                  <option value="NIGHT">Noche</option>
              </select>

              <select 
                value={filters.roomType}
                onChange={(e) => handleFilterChange('roomType', e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none max-w-[150px]"
              >
                  <option value="ALL">Tipos de Cuarto</option>
                  {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
              </select>

              <button onClick={() => loadRankings()} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl border border-slate-100 hover:border-slate-300 transition-all">
                 <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8FAFC]">
           {loading ? (
              <div className="space-y-4">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="h-20 bg-white rounded-3xl border border-slate-100 p-4 flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                            <div className="h-3 bg-slate-50 rounded w-1/3"></div>
                        </div>
                    </div>
                 ))}
              </div>
           ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Filter size={48} className="mb-4 opacity-20" />
                  <p className="font-bold text-sm">No hay resultados para estos filtros.</p>
                  <button 
                    onClick={() => setFilters({ startDate: '', endDate: '', shift: 'ALL', roomType: 'ALL' })}
                    className="mt-4 text-xs font-black text-amber-500 uppercase tracking-widest hover:underline"
                  >
                      Limpiar Filtros
                  </button>
              </div>
           ) : (
              <div className="space-y-4">
                 {data.map((item, idx) => (
                    <div key={item.user_id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-all group">
                       <div className="flex items-center gap-6 flex-1 w-full">
                           <div className="w-10 h-10 flex items-center justify-center font-black text-xl text-slate-300 italic shrink-0">#{idx + 1}</div>
                           
                           <div className="flex items-center gap-4 flex-1">
                              <Avatar name={item.name} size="md" />
                              <div>
                                 <h4 className="font-bold text-slate-900">{item.name}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded">{item.role}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{item.tickets_count} Tickets</span>
                                 </div>
                              </div>
                           </div>
                       </div>

                       <div className="flex w-full md:w-auto justify-between md:justify-end gap-8 text-center bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                             <p className={`text-xl font-black ${item.score >= 90 ? 'text-emerald-500' : item.score >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{item.score}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                             <p className="text-xl font-black text-slate-800 flex items-center gap-1">
                                {item.avg_rating} <span className="text-amber-400 text-sm">★</span>
                             </p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Disputas</p>
                             <p className={`text-xl font-black ${item.disputes_count > 0 ? 'text-red-500' : 'text-slate-800'}`}>{item.disputes_count}</p>
                          </div>
                          <div className="flex items-center justify-center w-8">
                             {item.trend === 'up' && <TrendingUp size={20} className="text-emerald-500" />}
                             {item.trend === 'down' && <TrendingDown size={20} className="text-red-500" />}
                             {item.trend === 'neutral' && <Minus size={20} className="text-slate-300" />}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default RoomRankingsModal;
