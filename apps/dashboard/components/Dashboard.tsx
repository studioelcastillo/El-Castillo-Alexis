
import React, { useState, useEffect, useMemo, useRef } from 'react';
/* Added ChevronRight to the imports from lucide-react */
import { Calendar, Filter, ChevronDown, RefreshCw, AlertCircle, Check, ArrowLeft, Send, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StatsArea from './StatsArea';
import Charts from './Charts';
import { ModelsTable, TasksList } from './Tables';
import DashboardService, { DashboardParams } from '../DashboardService';
import { getStoredUser } from '../session';
import { clearAuthSession } from '../utils/session';
import { buildAppUrl } from '../utils/baseUrl';
import { supabase } from '../supabaseClient';

// Definición de periodos comunes para la operación
const PREDEFINED_PERIODS = [
  { label: 'Semana Actual', since: '2025-12-08', until: '2025-12-14' },
  { label: 'Semana Pasada', since: '2025-12-01', until: '2025-12-07' },
  { label: 'Diciembre (Mes)', since: '2025-12-01', until: '2025-12-31' },
  { label: 'Noviembre (Cerrado)', since: '2025-11-01', until: '2025-11-30' },
];

const Dashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const unauthorizedHandledRef = useRef(false);

    // Memoizamos el usuario
    const user = useMemo(() => {
        return getStoredUser();
    }, []);

    // Filters State
    const [since, setSince] = useState(() => localStorage.getItem('dashboard_since') || PREDEFINED_PERIODS[0].since);
    const [until, setUntil] = useState(() => localStorage.getItem('dashboard_until') || PREDEFINED_PERIODS[0].until);
    const [stdId, setStdId] = useState<string>("");
    
    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_since', since);
        localStorage.setItem('dashboard_until', until);
    }, [since, until]);
    
    // UI State for Menus
    const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
    const [isCustomRangeMode, setIsCustomRangeMode] = useState(false);
    const [tempSince, setTempSince] = useState(since);
    const [tempUntil, setTempUntil] = useState(until);
    const periodMenuRef = useRef<HTMLDivElement>(null);

    const userId = user?.user_id;

    const params: DashboardParams = useMemo(() => ({
        userId: userId,
        since,
        until,
        stdId: stdId || undefined
    }), [userId, since, until, stdId]);

    // React Query Configuration
    const queryConfig = {
        enabled: !!userId,
        retry: (failureCount: number, error: any) => {
            // No reintentar si es error de autenticación (401)
            if (error.response?.status === 401) return false;
            return failureCount < 3;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos de frescura
    };

    // 1. Fetch Indicators
    const { 
        data: indicators, 
        isLoading: isLoadingIndicators, 
        error: errorIndicators 
    } = useQuery({
        queryKey: ['dashboard', 'indicators', params],
        queryFn: () => DashboardService.getIndicators(params).then(res => res.data),
        ...queryConfig
    });

    // 2. Fetch Tasks
    const { 
        data: tasks, 
        isLoading: isLoadingTasks,
        error: errorTasks
    } = useQuery({
        queryKey: ['dashboard', 'tasks', params],
        queryFn: () => DashboardService.getTasks(params).then(res => res.data),
        ...queryConfig
    });

    // 3. Fetch Charts
    const { 
        data: charts, 
        isLoading: isLoadingCharts,
        error: errorCharts
    } = useQuery({
        queryKey: ['dashboard', 'charts', params],
        queryFn: () => DashboardService.getCharts(params).then(res => res.data),
        ...queryConfig
    });

    // Global Loading & Error State
    const isLoading = isLoadingIndicators || isLoadingTasks || isLoadingCharts;
    const error = errorIndicators || errorTasks || errorCharts;

    // Solo cerrar sesion si Supabase realmente ya no tiene sesion activa.
    useEffect(() => {
        const isUnauthorized = !!error && (error as any).response?.status === 401;

        if (!isUnauthorized) {
            unauthorizedHandledRef.current = false;
            return;
        }

        if (unauthorizedHandledRef.current) {
            return;
        }

        unauthorizedHandledRef.current = true;

        void (async () => {
            try {
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError || !session) {
                    clearAuthSession();
                    window.location.replace(buildAppUrl('login'));
                }
            } catch (sessionCheckError) {
                console.error('No se pudo validar la sesion despues del 401:', sessionCheckError);
                clearAuthSession();
                window.location.replace(buildAppUrl('login'));
            }
        })();
    }, [error]);

    // Cerrar menú al hacer click fuera y resetear modo
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (periodMenuRef.current && !periodMenuRef.current.contains(event.target as Node)) {
                setIsPeriodMenuOpen(false);
                setIsCustomRangeMode(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePeriodSelect = (p: typeof PREDEFINED_PERIODS[0]) => {
        setSince(p.since);
        setUntil(p.until);
        setIsPeriodMenuOpen(false);
        setIsCustomRangeMode(false);
    };

    const handleApplyCustomRange = () => {
        if (new Date(tempSince) > new Date(tempUntil)) {
            alert("La fecha de inicio no puede ser mayor a la de fin.");
            return;
        }
        setSince(tempSince);
        setUntil(tempUntil);
        setIsPeriodMenuOpen(false);
        setIsCustomRangeMode(false);
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const activePeriodLabel = PREDEFINED_PERIODS.find(p => p.since === since && p.until === until)?.label || "Rango Personalizado";

    return (
        <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
            
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    
                    {/* Period Selector Component */}
                    <div className="relative" ref={periodMenuRef}>
                        <button 
                            onClick={() => {
                                setIsPeriodMenuOpen(!isPeriodMenuOpen);
                                setIsCustomRangeMode(false); // Resetear al abrir
                            }}
                            className={`w-full sm:w-auto flex items-center gap-3 px-5 py-2.5 bg-white border shadow-sm rounded-xl text-sm font-semibold transition-all group ${isPeriodMenuOpen ? 'border-amber-500 ring-4 ring-amber-500/5' : 'border-slate-200 hover:border-amber-300'}`}
                        >
                            <Calendar size={18} className={`${isPeriodMenuOpen ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`} />
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-slate-900">{activePeriodLabel}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{since} - {until}</span>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 ml-auto sm:ml-2 transition-transform duration-300 ${isPeriodMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isPeriodMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-3 z-[110] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                
                                {!isCustomRangeMode ? (
                                    <>
                                        <div className="px-4 py-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Periodo</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {PREDEFINED_PERIODS.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handlePeriodSelect(p)}
                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
                                                >
                                                    <div className="flex flex-col items-start">
                                                        <span className={`text-sm font-bold ${since === p.since && until === p.until ? 'text-amber-600' : 'text-slate-700'}`}>{p.label}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{p.since} al {p.until}</span>
                                                    </div>
                                                    {since === p.since && until === p.until && <Check size={16} className="text-amber-500" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-1 pt-1 border-t border-slate-50 px-2">
                                            <button 
                                                onClick={() => setIsCustomRangeMode(true)}
                                                className="w-full px-4 py-3 text-left text-[10px] font-black text-amber-600 hover:bg-amber-50 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-between group"
                                            >
                                                Rango Personalizado...
                                                <ChevronRight size={14} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-5 animate-in slide-in-from-right-4 duration-300">
                                        <button 
                                            onClick={() => setIsCustomRangeMode(false)}
                                            className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 hover:text-slate-900 transition-colors"
                                        >
                                            <ArrowLeft size={14} /> Volver a la lista
                                        </button>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Inicio</label>
                                                <input 
                                                    type="date" 
                                                    value={tempSince}
                                                    onChange={(e) => setTempSince(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Fin</label>
                                                <input 
                                                    type="date" 
                                                    value={tempUntil}
                                                    onChange={(e) => setTempUntil(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 transition-all"
                                                />
                                            </div>
                                            
                                            <button 
                                                onClick={handleApplyCustomRange}
                                                className="w-full mt-4 py-3.5 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Send size={14} /> APLICAR RANGO
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Studio Filter (Placeholder) */}
                    <button className="w-full sm:w-auto flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-semibold text-slate-700 hover:border-amber-300 transition-all group">
                        <Filter size={18} className="text-slate-400 group-hover:text-amber-500" />
                        <span>{stdId ? `Estudio #${stdId}` : "Todos los estudios"}</span>
                        <ChevronDown size={14} className="text-slate-400 ml-auto sm:ml-2" />
                    </button>

                    {/* Refresh Button */}
                    <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="w-full sm:w-auto p-2.5 bg-slate-900 text-amber-400 rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center"
                        title="Refrescar datos"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
                
                {/* Sync Indicator */}
                <div className="flex items-center gap-2 self-end md:self-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                        {isLoading ? 'Sincronizando...' : 'Datos en tiempo real'}
                    </span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in zoom-in-95">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">
                        {(error as any).response?.status === 401
                            ? 'El dashboard no pudo validar el backend operativo, pero tu sesion sigue activa.'
                            : (error as Error).message || 'Error de conexión. Verifica tu red.'}
                    </p>
                </div>
            )}

            {/* Render Area */}
            <div className={`transition-all duration-500 ${isLoading && !indicators ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <StatsArea data={indicators} profId={user?.prof_id} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    <div className="lg:col-span-2">
                        <Charts data={charts?.earnings_by_platform} />
                    </div>
                    <div className="lg:col-span-1">
                        <TasksList tasks={tasks} />
                    </div>
                </div>

                <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <ModelsTable data={charts?.model_goals} />
                </div>
            </div>
            
        </main>
    );
};

export default Dashboard;
