import React, { useState, useMemo } from 'react';
import {
  Users, Calendar, AlertTriangle, CheckCircle2,
  Search, Filter, DollarSign, ChevronRight,
  CreditCard, Zap, Building2, MoreVertical, ShieldCheck, Mail,
  Edit, X, Save, Infinity, TrendingUp, Award, BarChart3, List,
  ArrowUpRight, ArrowDownRight, CalendarDays, TrendingDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- INITIAL DATA ---
const INITIAL_REVENUE_DATA = [
  { month: 'Ene', revenue: 4200, licenses: 120 },
  { month: 'Feb', revenue: 4800, licenses: 145 },
  { month: 'Mar', revenue: 5100, licenses: 160 },
  { month: 'Abr', revenue: 5900, licenses: 190 },
  { month: 'May', revenue: 6500, licenses: 210 },
  { month: 'Jun', revenue: 7200, licenses: 240 },
];

const INITIAL_CLIENTS = [
  {
    id: 'c1',
    studioName: 'Red Dreams (Principal)',
    adminName: 'Admin Castillo',
    email: 'admin@elcastillo.app',
    totalLicenses: 45, // Includes sub-studios
    subStudiosCount: 2,
    plan: '31 a 50 Licencias',
    nextBillingDate: '2025-06-15',
    daysUntilDue: 14,
    status: 'ACTIVE',
    paymentMethod: 'Stripe (Auto)',
    monthlyValue: 100
  },
  {
    id: 'c2',
    studioName: 'Blue Ocean Studios',
    adminName: 'Carlos Gomez',
    email: 'carlos@blueocean.com',
    totalLicenses: 12,
    subStudiosCount: 0,
    plan: '1 a 15 Licencias',
    nextBillingDate: '2025-05-28',
    daysUntilDue: 4,
    status: 'EXPIRING_SOON',
    paymentMethod: 'Manual (Transferencia)',
    monthlyValue: 45
  },
  {
    id: 'c3',
    studioName: 'Neon Lights Agency',
    adminName: 'Laura Martinez',
    email: 'laura@neonlights.com',
    totalLicenses: 180,
    subStudiosCount: 5,
    plan: '151 a 200 Licencias',
    nextBillingDate: '2025-05-20',
    daysUntilDue: -4,
    status: 'EXPIRED',
    paymentMethod: 'Stripe (Auto)',
    monthlyValue: 200,
    isExempt: false
  },
  {
    id: 'c4',
    studioName: 'Golden Models',
    adminName: 'Maria Silva',
    email: 'maria@golden.com',
    totalLicenses: 10,
    subStudiosCount: 0,
    plan: '1 a 15 Licencias',
    nextBillingDate: '2025-06-25',
    daysUntilDue: 24,
    status: 'ACTIVE',
    paymentMethod: 'Stripe (Auto)',
    monthlyValue: 45,
    isExempt: false
  },
  {
    id: 'c5',
    studioName: 'Diamond Agency',
    adminName: 'Roberto Sanchez',
    email: 'roberto@diamond.com',
    totalLicenses: 250,
    subStudiosCount: 8,
    plan: '201 a 250 Licencias',
    nextBillingDate: '2025-06-05',
    daysUntilDue: 4,
    status: 'EXPIRING_SOON',
    paymentMethod: 'Stripe (Auto)',
    monthlyValue: 300,
    isExempt: false
  },
  {
    id: 'c6',
    studioName: 'Silver Stars',
    adminName: 'Ana Lopez',
    email: 'ana@silver.com',
    totalLicenses: 85,
    subStudiosCount: 3,
    plan: '51 a 100 Licencias',
    nextBillingDate: '2025-06-20',
    daysUntilDue: 19,
    status: 'ACTIVE',
    paymentMethod: 'Stripe (Auto)',
    monthlyValue: 150,
    isExempt: false
  },
  {
    id: 'c7',
    studioName: 'Bronze Studio',
    adminName: 'Luis Perez',
    email: 'luis@bronze.com',
    totalLicenses: 25,
    subStudiosCount: 1,
    plan: '16 a 30 Licencias',
    nextBillingDate: '2025-06-10',
    daysUntilDue: 9,
    status: 'ACTIVE',
    paymentMethod: 'Manual (Transferencia)',
    monthlyValue: 80,
    isExempt: false
  }
];

const SubscriptionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LIST'>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clients, setClients] = useState(INITIAL_CLIENTS);

  // Time Filter State
  const [timeFilter, setTimeFilter] = useState<'MONTH' | 'QUARTER' | 'SEMESTER' | 'YEAR' | 'CUSTOM'>('MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Edit Modal State
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editIsExempt, setEditIsExempt] = useState(false);

  const handleMarkAsPaid = (id: string) => {
    if (window.confirm('¿Confirmar pago manual para este cliente? Se actualizará su fecha de vencimiento +1 mes.')) {
      setClients(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'ACTIVE',
            daysUntilDue: 30, // Reset
            nextBillingDate: '2025-07-15' // Next date
          };
        }
        return c;
      }));
    }
  };

  const handleSendReminder = (email: string) => {
    alert(`Recordatorio de pago enviado a ${email}`);
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setEditDate(client.nextBillingDate);
    setEditIsExempt(client.isExempt || false);
  };

  const handleSaveEdit = () => {
    if (!editingClient) return;

    setClients(prev => prev.map(c => {
      if (c.id === editingClient.id) {
        // Calculate new days until due
        const today = new Date('2025-06-01'); // Current date
        const targetDate = new Date(editDate);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let newStatus = 'ACTIVE';
        if (!editIsExempt) {
            if (diffDays < 0) newStatus = 'EXPIRED';
            else if (diffDays <= 5) newStatus = 'EXPIRING_SOON';
        }

        return {
          ...c,
          nextBillingDate: editIsExempt ? '2099-12-31' : editDate,
          isExempt: editIsExempt,
          daysUntilDue: editIsExempt ? 9999 : diffDays,
          status: newStatus,
          paymentMethod: editIsExempt ? 'Exento' : c.paymentMethod,
          monthlyValue: editIsExempt ? 0 : c.monthlyValue
        };
      }
      return c;
    }));

    setEditingClient(null);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.studioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.adminName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      totalActive: clients.filter(c => c.status === 'ACTIVE').length,
      expiringSoon: clients.filter(c => c.status === 'EXPIRING_SOON').length,
      expired: clients.filter(c => c.status === 'EXPIRED').length,
      totalRevenue: clients.filter(c => c.status !== 'EXPIRED' && !c.isExempt).reduce((acc, c) => acc + c.monthlyValue, 0),
      totalLicensesActive: clients.filter(c => c.status !== 'EXPIRED').reduce((acc, c) => acc + c.totalLicenses, 0)
    };
  }, [clients]);

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const combinedPlanStats = useMemo(() => {
    const distribution: Record<string, { count: number, revenue: number }> = {};
    clients.forEach(c => {
      if (c.status !== 'EXPIRED') {
        if (!distribution[c.plan]) {
          distribution[c.plan] = { count: 0, revenue: 0 };
        }
        distribution[c.plan].count += 1;
        if (!c.isExempt) {
          distribution[c.plan].revenue += c.monthlyValue;
        }
      }
    });

    return Object.entries(distribution)
      .sort((a, b) => b[1].revenue - a[1].revenue) // Sort by revenue descending
      .map(([name, stats], index) => ({
        name,
        count: stats.count,
        revenue: stats.revenue,
        color: COLORS[index % COLORS.length]
      }));
  }, [clients]);

  const topPlanByCount = useMemo(() => {
    if (combinedPlanStats.length === 0) return 'N/A';
    return [...combinedPlanStats].sort((a, b) => b.count - a.count)[0].name;
  }, [combinedPlanStats]);

  // Comparison Logic based on timeFilter
  const comparison = useMemo(() => {
    let multiplier = 0.85; // Default: previous was 15% lower (growth)
    if (timeFilter === 'QUARTER') multiplier = 0.70;
    if (timeFilter === 'SEMESTER') multiplier = 0.50;
    if (timeFilter === 'YEAR') multiplier = 0.40;

    const prevRevenue = stats.totalRevenue * multiplier;
    const growth = ((stats.totalRevenue - prevRevenue) / prevRevenue) * 100;

    return {
      prevRevenue,
      growth,
      isPositive: growth >= 0
    };
  }, [stats.totalRevenue, timeFilter]);

  // Top Licensees Logic
  const [showAllTop, setShowAllTop] = useState(false);
  const topLicensees = useMemo(() => {
    return [...clients]
      .filter(c => !c.isExempt && c.status !== 'EXPIRED')
      .sort((a, b) => b.monthlyValue - a.monthlyValue);
  }, [clients]);

  const displayedTopLicensees = showAllTop ? topLicensees : topLicensees.slice(0, 3);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-800"><ShieldCheck size={28} /></div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Control de Licencias</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium pl-14">Supervisa el estado de pago de todos los estudios y sedes aliadas.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
           <button
             onClick={() => setActiveTab('DASHBOARD')}
             className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <BarChart3 size={16} /> Resumen
           </button>
           <button
             onClick={() => setActiveTab('LIST')}
             className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <List size={16} /> Listado
           </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Building2 size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudios (Master)</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalActive}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Licencias (Total)</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalLicensesActive}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Award size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Más Vendido</p>
            <p className="text-sm font-black text-slate-900 leading-tight">{topPlanByCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos (MRR)</p>
              <p className="text-2xl font-black text-slate-900">${stats.totalRevenue}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${comparison.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {comparison.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {comparison.growth.toFixed(1)}%
          </div>
        </div>
      </div>

      {activeTab === 'DASHBOARD' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Time Filter Banner */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <CalendarDays size={18} className="text-indigo-500" />
              <span>Periodo de Análisis:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['MONTH', 'QUARTER', 'SEMESTER', 'YEAR', 'CUSTOM'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    timeFilter === filter
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {filter === 'MONTH' ? 'Mensual' :
                   filter === 'QUARTER' ? 'Trimestral' :
                   filter === 'SEMESTER' ? 'Semestral' :
                   filter === 'YEAR' ? 'Anual' : 'Personalizado'}
                </button>
              ))}
            </div>
            {timeFilter === 'CUSTOM' && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400 text-xs font-bold">a</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Comparative Summary */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${comparison.isPositive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
            <div className={`p-3 rounded-xl ${comparison.isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {comparison.isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <h4 className={`text-sm font-black ${comparison.isPositive ? 'text-emerald-900' : 'text-red-900'}`}>
                Resumen Comparativo ({timeFilter === 'MONTH' ? 'Mes Anterior' : timeFilter === 'QUARTER' ? 'Trimestre Anterior' : timeFilter === 'SEMESTER' ? 'Semestre Anterior' : timeFilter === 'YEAR' ? 'Año Anterior' : 'Periodo Anterior'})
              </h4>
              <p className={`text-xs font-medium mt-0.5 ${comparison.isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                {comparison.isPositive ? 'Crecimos un' : 'Bajamos un'} <strong className="font-black">{Math.abs(comparison.growth).toFixed(1)}%</strong> en ingresos.
                El periodo anterior generó <strong className="font-black">${comparison.prevRevenue.toFixed(0)}</strong>,
                mientras que el actual genera <strong className="font-black">${stats.totalRevenue}</strong>.
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-500" /> Ingresos Mensuales
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Crecimiento del MRR en los últimos 6 meses</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-600">${stats.totalRevenue}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mes Actual</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={INITIAL_REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                      formatter={(value: number) => [`$${value}`, 'Ingresos']}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Licenses Chart */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users size={20} className="text-indigo-500" /> Licencias Activas
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Evolución de licencias en uso</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-600">{stats.totalLicensesActive}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Actual</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={INITIAL_REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLicenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                      formatter={(value: number) => [value, 'Licencias']}
                    />
                    <Area type="monotone" dataKey="licenses" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLicenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Combined Plan Distribution Chart */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Award size={20} className="text-amber-500" /> Distribución e Ingresos por Plan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Análisis combinado de cantidad de estudios y dinero generado por categoría</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Chart Side */}
                <div className="h-80 w-full md:w-1/2 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                                <p className="text-sm font-black text-slate-900 mb-2" style={{ color: data.color }}>{data.name}</p>
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-slate-500">Estudios: <span className="text-slate-900">{data.count}</span></p>
                                  <p className="text-xs font-bold text-slate-500">Ingresos: <span className="text-emerald-600">${data.revenue}</span></p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={combinedPlanStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="revenue"
                        stroke="none"
                      >
                        {combinedPlanStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-xl font-black text-slate-900">${stats.totalRevenue}</span>
                  </div>
                </div>

                {/* Legend / Data Table Side */}
                <div className="w-full md:w-1/2 space-y-2">
                  <div className="grid grid-cols-12 gap-2 px-4 pb-2 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-6">Plan</div>
                    <div className="col-span-3 text-center">Estudios</div>
                    <div className="col-span-3 text-right">Ingresos</div>
                  </div>
                  {combinedPlanStats.map((stat, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 rounded-2xl items-center hover:bg-slate-100 transition-colors">
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: stat.color }}></div>
                        <span className="text-xs font-bold text-slate-700 truncate" title={stat.name}>{stat.name}</span>
                      </div>
                      <div className="col-span-3 text-center">
                        <span className="text-sm font-black text-slate-900">{stat.count}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-sm font-black text-emerald-600">${stat.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Top Licensees */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Award size={24} className="text-amber-500" /> Top Estudios (Mayor Ingreso)
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Los clientes que más aportan al MRR.</p>
              </div>
              {topLicensees.length > 3 && (
                <button
                  onClick={() => setShowAllTop(!showAllTop)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs uppercase tracking-widest"
                >
                  {showAllTop ? 'Ver Menos' : 'Ver Todos'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedTopLicensees.map((client, index) => (
                <div key={client.id} className="relative p-6 rounded-[24px] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-slate-900/20 transform -rotate-6 group-hover:rotate-0 transition-transform">
                    #{index + 1}
                  </div>
                  <div className="flex justify-between items-start mb-6 mt-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">{client.studioName}</h4>
                      <p className="text-xs text-slate-500 font-medium">{client.adminName}</p>
                    </div>
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                      <Award size={20} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aporte Mensual</span>
                      <span className="font-black text-emerald-600 text-lg">${client.monthlyValue}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Licencias</span>
                      <span className="font-black text-indigo-600 text-lg">{client.totalLicenses}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Actual</span>
                      <span className="font-bold text-slate-700 text-sm">{client.plan}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por estudio o administrador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === status
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {status === 'ALL' ? 'Todos' :
                  status === 'ACTIVE' ? 'Activos' :
                  status === 'EXPIRING_SOON' ? 'Por Vencer' : 'Vencidos'}
                </button>
              ))}
            </div>
          </div>

          {/* Clients Table */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudio Principal</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Licencias (Total)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Actual</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximo Pago</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{client.studioName}</p>
                            <p className="text-xs text-slate-500">{client.adminName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-700">{client.totalLicenses}</span>
                          {client.subStudiosCount > 0 && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">
                              +{client.subStudiosCount} sedes
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700">{client.plan}</p>
                        <p className="text-[10px] text-slate-400">${client.monthlyValue}/mes</p>
                      </td>
                      <td className="px-6 py-4">
                        {client.isExempt ? (
                            <div className="flex items-center gap-2">
                                <Infinity size={16} className="text-indigo-500" />
                                <p className="text-sm font-bold text-indigo-700">Exento</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-slate-700">{client.nextBillingDate}</p>
                                <p className={`text-[10px] font-bold ${
                                client.daysUntilDue < 0 ? 'text-red-500' :
                                client.daysUntilDue <= 5 ? 'text-amber-500' : 'text-slate-400'
                                }`}>
                                {client.daysUntilDue < 0 ? `Vencido hace ${Math.abs(client.daysUntilDue)} días` :
                                client.daysUntilDue === 0 ? 'Vence hoy' : `En ${client.daysUntilDue} días`}
                                </p>
                            </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          client.isExempt ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          client.status === 'EXPIRING_SOON' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {client.isExempt ? 'Exento' :
                          client.status === 'ACTIVE' ? 'Activo' :
                          client.status === 'EXPIRING_SOON' ? 'Por Vencer' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <CreditCard size={14} className="text-slate-400" />
                          {client.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="Editar Licencia (Exento / Fecha)"
                          >
                            <Edit size={16} />
                          </button>
                          {!client.isExempt && client.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleSendReminder(client.email)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                              title="Enviar Recordatorio"
                            >
                              <Mail size={16} />
                            </button>
                          )}
                          {!client.isExempt && (
                              <button
                                onClick={() => handleMarkAsPaid(client.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                title="Marcar como Pagado Manualmente"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No se encontraron clientes con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Editar Licencia</h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-900">{editingClient.studioName}</p>
                <p className="text-xs text-slate-500">{editingClient.adminName}</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={editIsExempt}
                    onChange={(e) => setEditIsExempt(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Exento de Pago (Lifetime)</p>
                    <p className="text-xs text-slate-500">Esta cuenta no requiere pagos recurrentes.</p>
                  </div>
                </label>

                {!editIsExempt && (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Fecha de Próximo Pago
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingClient(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <Save size={16} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubscriptionManagementPage;
