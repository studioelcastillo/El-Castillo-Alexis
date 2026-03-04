
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Clock, Users, Settings, Database, 
  RefreshCw, Calendar, Search, Filter, AlertTriangle, 
  CheckCircle2, ChevronRight, FileText, Download, Zap,
  Monitor, Smartphone, UserCheck, ShieldCheck, DollarSign,
  List, Tag, ArrowRightLeft, CreditCard, Trash2, Edit2, Plus,
  XCircle, MoreVertical
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import AttendanceService from '../AttendanceService';
import { AttendanceDay, ZKDevice, TimeValuationSettings, ZKTransaction, ZKEmployee } from '../types';
import Avatar from './Avatar';

const AttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LOGS' | 'PERSONNEL' | 'DEVICES' | 'VALUATION' | 'CONFIG'>('DASHBOARD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<ZKTransaction[]>([]);
  const [employees, setEmployees] = useState<ZKEmployee[]>([]);
  const [devices, setDevices] = useState<ZKDevice[]>([]);
  const [valuation, setValuation] = useState<TimeValuationSettings | null>(null);

  useEffect(() => {
    loadData();
  }, [date]);

  useEffect(() => {
    if (activeTab === 'LOGS') {
      loadTransactions();
      loadDevices();
      loadEmployees();
    }
    if (activeTab === 'PERSONNEL') {
      loadEmployees();
    }
    if (activeTab === 'DEVICES') {
      loadDevices();
    }
    if (activeTab === 'VALUATION') {
      loadValuation();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
        const att = await AttendanceService.getDailyAttendance(date);
        setData(att);
    } finally {
        setLoading(false);
    }
  };

  const loadTransactions = async () => {
    const rows = await AttendanceService.getTransactions();
    setTransactions(rows);
  };

  const loadEmployees = async () => {
    const rows = await AttendanceService.getEmployees();
    setEmployees(rows);
  };

  const loadDevices = async () => {
    const rows = await AttendanceService.getDevices();
    setDevices(rows);
  };

  const loadValuation = async () => {
    const settings = await AttendanceService.getValuationSettings();
    setValuation(settings);
  };

  const handleSync = async () => {
      setIsSyncing(true);
      await AttendanceService.syncTransactions();
      await loadData();
      setIsSyncing(false);
  };

  const filteredData = useMemo(() => {
      return data.filter(d => d.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, ZKEmployee>();
    employees.forEach(emp => map.set(emp.emp_code, emp));
    return map;
  }, [employees]);

  const deviceMap = useMemo(() => {
    const map = new Map<string, ZKDevice>();
    devices.forEach(device => map.set(device.sn, device));
    return map;
  }, [devices]);

  // --- RENDER TABS ---

  const renderDashboard = () => {
    const totalPresent = data.filter(d => d.status !== 'ABSENT').length;
    // Fix division by zero error
    const attendanceRate = data.length > 0 ? Math.round((totalPresent / data.length) * 100) : 0;
    
    const stats = [
        { label: 'Tasa Asistencia', value: `${attendanceRate}%`, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Tardanzas hoy', value: data.filter(d => d.status === 'LATE').length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Ausencias', value: data.filter(d => d.status === 'ABSENT').length.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Horas Extras', value: `${(data.reduce((a, b) => a + b.overtime_minutes, 0) / 60).toFixed(1)}h`, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                        <div className={`p-4 rounded-2xl ${s.bg} ${s.color}`}><s.icon size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 h-[450px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                            <BarChart3 size={16} className="text-amber-500" /> Tendencia de Asistencia
                        </h3>
                        <select className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none">
                            <option>Últimos 7 días</option>
                            <option>Este Mes</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{d: 'Lun', a: 85}, {d: 'Mar', a: 92}, {d: 'Mie', a: 78}, {d: 'Jue', a: 95}, {d: 'Vie', a: 88}, {d: 'Sab', a: 70}, {d: 'Dom', a: 65}]}>
                            <defs>
                                <linearGradient id="colorAsistencia" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{borderRadius: '24px', border:'none', boxShadow:'0 25px 50px -12px rgb(0 0 0 / 0.25)'}} />
                            <Area type="monotone" dataKey="a" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAsistencia)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-8 relative z-10">Ranking de Puntualidad</h3>
                    
                    <div className="space-y-6 relative z-10 flex-1 overflow-y-auto no-scrollbar">
                        {data.slice(0, 5).map((user, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black text-slate-600 w-4 italic">#{i+1}</span>
                                    <Avatar name={user.full_name} size="xs" />
                                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{user.full_name.split(' ')[0]}</span>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black">
                                        <CheckCircle2 size={12}/> 98%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Reporte Detallado</button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <List size={16} className="text-amber-500" /> Resumen de Marcaciones del Día
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Filtrar por nombre..." 
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-amber-400 transition-all w-64" 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"><Download size={16}/></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrada</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salida</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Horas</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Deuda/Extra</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar name={row.full_name} size="xs" />
                                            <div>
                                                <p className="text-xs font-black text-slate-900 tracking-tight">{row.full_name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{row.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-600">
                                        {row.check_in ? new Date(row.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-600">
                                        {row.check_out ? new Date(row.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                    </td>
                                    <td className="px-8 py-4 text-center text-xs font-black text-slate-900 font-mono">
                                        {(row.worked_minutes / 60).toFixed(1)}h
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            {row.overtime_minutes > 0 && <span className="text-[10px] font-black text-emerald-600">+{row.overtime_minutes}m Extra</span>}
                                            {row.debt_minutes > 0 && <span className="text-[10px] font-black text-red-500">-{row.debt_minutes}m Deuda</span>}
                                            {row.debt_minutes === 0 && row.overtime_minutes === 0 && row.status !== 'ABSENT' && <span className="text-[9px] text-slate-300 font-bold">Sin deuda</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            row.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            row.status === 'LATE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  const renderLogs = () => (
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={16} className="text-indigo-500" /> Historial de Marcaciones Crudo (Logs)
              </h3>
              <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600 shadow-sm">
                      <Download size={14} /> EXPORTAR CSV
                  </button>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                      <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiempo</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispositivo / SN</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verificación</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {transactions.map(tx => {
                        const emp = employeeMap.get(tx.emp_code);
                        const nameFromUser = emp?.user_name ? `${emp.user_name} ${emp.user_surname || ''}`.trim() : '';
                        const nameFromEmp = `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim();
                        const fullName = nameFromUser || nameFromEmp || `Emp ${tx.emp_code}`;
                        const device = deviceMap.get(tx.terminal_sn);
                        const statusClass = tx.punch_state === 'OUT'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100';

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4 text-xs font-bold text-slate-500">
                              {new Date(tx.punch_time).toLocaleString()}
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-400">
                                  ID: {tx.emp_code}
                                </div>
                                <span className="text-xs font-bold text-slate-800">{fullName}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-center">
                              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${statusClass}`}>
                                {tx.punch_state}
                              </span>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <Database size={12} className="text-slate-400" /> {device?.alias || tx.terminal_sn}
                              </div>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verif {tx.verify_type}</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderPersonnel = () => (
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-amber-500" /> Mapeo de Personal ZKTeco
              </h3>
              <div className="relative group">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Vincular por nombre..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none w-64" />
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                      <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario Software</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ID Bio (emp_code)</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sincronizado</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {employees.map(employee => {
                        const nameFromUser = employee.user_name
                          ? `${employee.user_name} ${employee.user_surname || ''}`.trim()
                          : '';
                        const nameFromEmp = `${employee.first_name} ${employee.last_name}`.trim();
                        const fullName = nameFromUser || nameFromEmp;
                        const isLinked = Boolean(employee.linked_user_id);

                        return (
                          <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-4 flex items-center gap-3">
                                  <Avatar name={fullName} src={employee.user_photo_url} size="xs" />
                                  <span className="text-xs font-bold text-slate-800">{fullName}</span>
                              </td>
                              <td className="px-8 py-4">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{employee.profile_name || employee.department || 'SIN PERFIL'}</span>
                              </td>
                              <td className="px-8 py-4 text-center">
                                  <input type="text" defaultValue={employee.emp_code} className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center outline-none focus:border-amber-500" />
                              </td>
                              <td className="px-8 py-4 text-center">
                                  {isLinked ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                                  ) : (
                                    <XCircle size={16} className="text-amber-500 mx-auto" />
                                  )}
                              </td>
                              <td className="px-8 py-4 text-right">
                                  <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Vincular</button>
                              </td>
                          </tr>
                        );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderDevices = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {devices.map(device => {
              const isOnline = device.status === 'ONLINE';
              return (
                <div key={device.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            <Monitor size={28} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-lg tracking-tight">{device.alias}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">SN: {device.sn}</p>
                        {device.last_sync_at && (
                          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1 rounded-lg">
                              <Clock size={12} /> Última sincronización: {new Date(device.last_sync_at).toLocaleString()}
                          </div>
                        )}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
                        <button className="flex-1 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all">Configurar</button>
                        <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><RefreshCw size={16} /></button>
                    </div>
                </div>
              );
          })}
          <button className="border-2 border-dashed border-slate-200 rounded-[40px] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-all group bg-slate-50/50">
              <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Añadir Terminal Bio</span>
          </button>
      </div>
  );

  const renderValuation = () => {
      const debtRate = valuation?.minute_debt_price || 0;
      const overtimeRate = valuation?.overtime_hour_price || 0;
      const totalDebtValue = data.reduce((sum, row) => sum + row.debt_minutes * debtRate, 0);
      const totalOvertimeValue = data.reduce((sum, row) => sum + (row.overtime_minutes / 60) * overtimeRate, 0);

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Costo Total Deuda</p>
                        <h2 className="text-5xl font-black tracking-tighter tabular-nums">$ {totalDebtValue.toLocaleString('es-CO')}</h2>
                        <p className="text-xs text-slate-400 font-medium">Acumulado por tiempo faltante en el periodo actual.</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Costo Total Horas Extra</p>
                        <h2 className="text-5xl font-black tracking-tighter tabular-nums">$ {totalOvertimeValue.toLocaleString('es-CO')}</h2>
                        <p className="text-xs text-slate-400 font-medium">Liquidación proyectada de tiempo adicional.</p>
                    </div>
                    <div className="flex flex-col justify-end">
                        <button className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-50 transition-all shadow-xl flex items-center justify-center gap-3">
                            <CreditCard size={18} /> GENERAR PLANO NÓMINA
                        </button>
                    </div>
                </div>
            </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Detalle de Valorización por Colaborador</h3>
                  <div className="flex gap-2">
                      <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"><Filter size={16}/></button>
                      <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"><Download size={16}/></button>
                  </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50/50">
                          <tr>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Min. Deuda</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Valor Deuda</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Horas Extra</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Neto</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {data.slice(0,6).map(row => {
                            const debtValue = row.debt_minutes * debtRate;
                            const overtimeValue = (row.overtime_minutes / 60) * overtimeRate;
                            const net = overtimeValue - debtValue;

                            return (
                              <tr key={row.id} className="hover:bg-slate-50/50">
                                  <td className="px-8 py-4 flex items-center gap-3">
                                      <Avatar name={row.full_name} size="xs" />
                                      <span className="text-xs font-bold text-slate-800">{row.full_name}</span>
                                  </td>
                                  <td className="px-8 py-4 text-center font-mono text-xs text-red-500 font-black">{row.debt_minutes}m</td>
                                  <td className="px-8 py-4 text-center font-mono text-xs text-slate-600">$ {debtValue.toLocaleString('es-CO')}</td>
                                  <td className="px-8 py-4 text-center font-mono text-xs text-emerald-600 font-black">{(row.overtime_minutes / 60).toFixed(1)}h</td>
                                  <td className="px-8 py-4 text-right font-black text-slate-900">$ {net.toLocaleString('es-CO')}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
      );
  };

  const renderConfig = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl"><Database size={24}/></div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Conexión con Servidor BioTime</h3>
              </div>
              <div className="space-y-4">
                  <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Modo de Integración</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all">
                          <option value="BIOTIME_API">API BioTime / ZKBioTime (JWT Auth)</option>
                          <option value="PUSH_ADMS">Push SDK / ADMS Receptor (TCP/IP)</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Endpoint de Sincronización</label>
                      <input type="text" placeholder="http://192.168.1.100:8081" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Token de Seguridad</label>
                          <input type="password" value="**************" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" />
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Frecuencia Sync</label>
                          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all">
                              <option>Cada 5 min</option>
                              <option>Cada 15 min</option>
                              <option>Manual únicamente</option>
                          </select>
                      </div>
                  </div>
              </div>
              <button className="w-full py-4 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">Probar Conexión & Guardar</button>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24}/></div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Reglas & Tolerancias</h3>
              </div>
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                          <p className="text-xs font-bold text-slate-900 uppercase">Emparejamiento Auto (Pairing)</p>
                          <p className="text-[10px] text-slate-500 font-medium">Detecta entrada/salida por orden si el Bio no reporta estado.</p>
                      </div>
                      <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tolerancia Tardanza</label>
                        <div className="relative">
                            <input type="number" defaultValue={10} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Min</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Costo por Minuto Deuda</label>
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="number" defaultValue={200} className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                      </div>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                      <Zap className="text-indigo-500 shrink-0" size={18} />
                      <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">Los turnos nocturnos se procesarán detectando marcaciones hasta las 12:00 PM del día siguiente.</p>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Clock className="text-amber-500" size={32} />
              Monitor de Asistencia ZKTeco
           </h2>
           <p className="text-sm text-slate-500 mt-2 font-medium">Integración directa con hardware biométrico y gestión de presencia real.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 shadow-sm group hover:border-amber-300 transition-colors">
                <Calendar size={16} className="text-slate-400" />
                <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="bg-transparent border-none text-xs font-black text-slate-700 outline-none py-3 w-32" 
                />
            </div>
            <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Biometría'}
            </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[28px] border border-slate-200/60 w-full md:w-fit shadow-sm gap-1 overflow-x-auto no-scrollbar">
          {[
              { id: 'DASHBOARD', label: 'Monitor Real-Time', icon: BarChart3 },
              { id: 'LOGS', label: 'Historial Punches', icon: Smartphone },
              { id: 'PERSONNEL', label: 'Mapeo Personal', icon: Users },
              { id: 'DEVICES', label: 'Dispositivos SN', icon: Monitor },
              { id: 'VALUATION', label: 'Valorización', icon: DollarSign },
              { id: 'CONFIG', label: 'Integración ZK', icon: Settings },
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-amber-400 shadow-xl shadow-slate-900/30' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
              >
                  <tab.icon size={16} />
                  {tab.label}
              </button>
          ))}
      </div>

      {/* Main Container */}
      <div className="min-h-[600px] transition-all duration-300">
          {activeTab === 'DASHBOARD' && renderDashboard()}
          {activeTab === 'LOGS' && renderLogs()}
          {activeTab === 'PERSONNEL' && renderPersonnel()}
          {activeTab === 'DEVICES' && renderDevices()}
          {activeTab === 'VALUATION' && renderValuation()}
          {activeTab === 'CONFIG' && renderConfig()}
      </div>
    </div>
  );
};

export default AttendancePage;
