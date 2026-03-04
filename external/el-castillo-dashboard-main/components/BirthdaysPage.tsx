
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cake, Calendar, Search, Filter, Mail, Gift, 
  ChevronRight, ArrowRight, Settings, ChevronLeft, LayoutGrid, List,
  ArrowLeft, XCircle, RefreshCw
} from 'lucide-react';
import Avatar from './Avatar';
import BirthdayService from '../BirthdayService';
import { BirthdayUser } from '../types';
import BirthdayConfigModal from './BirthdayConfigModal';

const BirthdaysPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [users, setUsers] = useState<BirthdayUser[]>([]);
  const [weekUsers, setWeekUsers] = useState<BirthdayUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Calendar View State
  const [viewDate, setViewDate] = useState(new Date());

  // Modals
  const [configOpen, setConfigOpen] = useState(false);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
        // If calendar view, we might want to load all to populate calendar, but for now using same service
        const filters = { search, from: fromDate || undefined, to: toDate || undefined };
        const [allData, weekData] = await Promise.all([
            BirthdayService.getBirthdays(filters),
            BirthdayService.getWeekBirthdays()
        ]);
        setUsers(allData);
        setWeekUsers(weekData);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, fromDate, toDate]); // Re-fetch when filters change

  // Calendar Helpers
  const getMonthData = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay(); // 0 Sun, 1 Mon...
      
      const days = [];
      // Empty slots for previous month
      for (let i = 0; i < firstDay; i++) days.push(null);
      
      // Days of current month
      for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(year, month, i);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // Find birthdays on this day (ignoring year of birth, matching month/day)
          // BirthdayUser.nextBirthday is the next occurrence YYYY-MM-DD.
          // We need to check if user's birthday falls on this Month/Day.
          const todaysBirthdays = users.filter(u => {
              const bday = new Date(u.nextBirthday);
              return bday.getDate() === i && bday.getMonth() === month;
          });
          
          days.push({ day: i, birthdays: todaysBirthdays, isToday: new Date().toDateString() === date.toDateString() });
      }
      return days;
  };

  const calendarDays = useMemo(() => getMonthData(), [viewDate, users]);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Cake className="text-pink-500" size={32} />
                    Cumpleaños
                </h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Gestión de fechas especiales y automatización de saludos.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                    onClick={() => setConfigOpen(true)}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                    title="Configuración de Mensajes"
                >
                    <Settings size={20} />
                </button>
                <div className="bg-slate-100 p-1 rounded-xl flex">
                    <button 
                        onClick={() => setActiveView('LIST')}
                        className={`p-2.5 rounded-lg transition-all ${activeView === 'LIST' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={18} />
                    </button>
                    <button 
                        onClick={() => setActiveView('CALENDAR')}
                        className={`p-2.5 rounded-lg transition-all ${activeView === 'CALENDAR' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* Weekly Highlights (Top Row) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-pink-500 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-pink-500/20 md:col-span-1 flex flex-col justify-between">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Próximos 7 días</p>
                    <h3 className="text-4xl font-black tracking-tighter">{weekUsers.length}</h3>
                    <p className="text-sm font-bold mt-1 opacity-90">Cumpleaños cercanos</p>
                </div>
                <div className="relative z-10 mt-6">
                    <button className="bg-white text-pink-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-50 transition-colors w-full">
                        Ver Lista
                    </button>
                </div>
                <Gift size={120} className="absolute -bottom-4 -right-4 text-pink-400 opacity-50 rotate-12" />
            </div>

            <div className="md:col-span-3 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 overflow-x-auto">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Celebraciones de la Semana</h4>
                <div className="flex gap-4">
                    {weekUsers.length > 0 ? weekUsers.map(user => (
                        <div key={user.userId} className="flex-shrink-0 w-48 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center group hover:border-pink-200 transition-colors">
                            <div className="relative mb-3">
                                <Avatar name={user.fullName} src={user.profilePhotoUrl} size="lg" />
                                {user.isToday && <div className="absolute -top-1 -right-1 bg-pink-500 text-white p-1 rounded-full border-2 border-white shadow-sm"><Cake size={12} /></div>}
                            </div>
                            <p className="text-sm font-bold text-slate-900 truncate w-full">{user.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{user.birthDate.substring(5)}</p>
                            <span className={`mt-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.isToday ? 'bg-pink-100 text-pink-600' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                {user.isToday ? '¡Es Hoy!' : `En ${user.daysLeft} días`}
                            </span>
                        </div>
                    )) : (
                        <div className="w-full py-8 text-center text-slate-400 text-xs font-medium italic">
                            No hay cumpleaños en los próximos 7 días.
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                {activeView === 'LIST' ? (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-500/5 transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                            />
                            <span className="text-slate-300">-</span>
                            <input 
                                type="date" 
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"><ChevronLeft size={20} /></button>
                            <span className="w-40 text-center text-sm font-black text-slate-800 uppercase tracking-widest">
                                {viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"><ChevronRight size={20} /></button>
                        </div>
                        <button onClick={() => setViewDate(new Date())} className="text-[10px] font-black uppercase text-slate-500 hover:text-pink-600 tracking-widest">
                            Hoy
                        </button>
                    </div>
                )}
                
                <button onClick={() => fetchData()} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Views */}
            {activeView === 'LIST' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Usuario</th>
                                <th className="px-8 py-4">Rol</th>
                                <th className="px-8 py-4">Fecha Nacimiento</th>
                                <th className="px-8 py-4">Próximo Cumpleaños</th>
                                <th className="px-8 py-4 text-center">Días Faltantes</th>
                                <th className="px-8 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map(user => (
                                <tr key={user.userId} className={`hover:bg-slate-50/50 transition-colors group ${user.isToday ? 'bg-pink-50/30' : ''}`}>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={user.fullName} src={user.profilePhotoUrl} size="sm" />
                                            <span className="text-sm font-bold text-slate-800">{user.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-500 tracking-wide">{user.roleName}</span>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-medium text-slate-600">
                                        {user.birthDate}
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-700">
                                        {new Date(user.nextBirthday).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        {user.isToday ? (
                                            <span className="px-3 py-1 bg-pink-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md shadow-pink-500/20">
                                                Hoy
                                            </span>
                                        ) : (
                                            <span className={`text-xs font-bold ${user.daysLeft <= 30 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {user.daysLeft} días
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        {user.isToday && (
                                            <button className="text-pink-500 hover:bg-pink-50 p-2 rounded-lg transition-all" title="Enviar Felicitación">
                                                <Mail size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400 text-sm font-medium">No se encontraron resultados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8">
                    <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="bg-slate-50 p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map((date, i) => (
                            <div key={i} className={`bg-white min-h-[120px] p-2 transition-colors hover:bg-slate-50 ${!date ? 'bg-slate-50/50' : ''}`}>
                                {date && (
                                    <>
                                        <span className={`block text-xs font-bold mb-2 ${date.isToday ? 'text-pink-600 bg-pink-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-400'}`}>
                                            {date.day}
                                        </span>
                                        <div className="space-y-1">
                                            {date.birthdays.map(b => (
                                                <div key={b.userId} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-pink-200 transition-all cursor-pointer group">
                                                    <Avatar name={b.fullName} src={b.profilePhotoUrl} size="xs" />
                                                    <span className="text-[9px] font-bold text-slate-700 truncate group-hover:text-pink-600">{b.fullName.split(' ')[0]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Configuration Modal */}
        <BirthdayConfigModal isOpen={configOpen} onClose={() => setConfigOpen(false)} />

    </div>
  );
};

export default BirthdaysPage;
