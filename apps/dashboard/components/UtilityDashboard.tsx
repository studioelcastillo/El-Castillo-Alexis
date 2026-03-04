
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, 
  BarChart3, Calendar, Plus, Filter, ArrowRight, Download, 
  Settings, Users, Briefcase, Building2, LayoutDashboard, 
  ChevronRight, AlertCircle, CheckCircle2, Clock, Wallet,
  Search, RefreshCw, MoreVertical, Trash2, Edit3, Save, X,
  FileText, Landmark, UserPlus, History, ShieldCheck, Zap,
  ArrowUpRight, ArrowDownRight, Target, Info, Lock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import UtilityService from '../UtilityService';
import { 
  TenantCompany, Sede, IncomeLine, UtilityPeriod, 
  IncomeRecord, ExpenseCatalog, ExpenseRecord, UtilityKPIs,
  Partner, UtilityAuditLog, AssignmentRule
} from '../types';
import Avatar from './Avatar';

// --- SUB-COMPONENTS ---

const KPICard: React.FC<{ 
  title: string, 
  value: number, 
  variation?: number, 
  icon: React.ReactNode, 
  color: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate',
  prefix?: string,
  suffix?: string
}> = ({ title, value, variation, icon, color, prefix = '$', suffix = '' }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} border shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {variation !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${variation >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {variation >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(variation)}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">
        {prefix}{value.toLocaleString('es-CO')}{suffix}
      </p>
    </div>
  );
};

const UtilityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INCOME' | 'EXPENSES' | 'PAYROLL' | 'LOANS' | 'SETTINGS'>('OVERVIEW');
  const [selectedCompany, setSelectedCompany] = useState<string>('comp-1');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('per-2026-02');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isConfigIncomeOpen, setIsConfigIncomeOpen] = useState(false);
  const [isConfigExpenseOpen, setIsConfigExpenseOpen] = useState(false);
  const [newIncome, setNewIncome] = useState({ line_id: '', value: 0, date: new Date().toISOString().split('T')[0] });
  const [newExpense, setNewExpense] = useState({ catalog_id: '', value: 0, date: new Date().toISOString().split('T')[0] });

  // Data States
  const [companies, setCompanies] = useState<TenantCompany[]>([]);
  const [periods, setPeriods] = useState<UtilityPeriod[]>([]);
  const [kpis, setKpis] = useState<UtilityKPIs | null>(null);
  const [incomeByLine, setIncomeByLine] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [expenseCatalog, setExpenseCatalog] = useState<ExpenseCatalog[]>([]);
  const [incomeLines, setIncomeLines] = useState<IncomeLine[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [auditLogs, setAuditLogs] = useState<UtilityAuditLog[]>([]);
  const [rules, setRules] = useState<AssignmentRule[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCompany && selectedPeriod) {
      loadPeriodData();
    }
  }, [selectedCompany, selectedPeriod]);

  const loadInitialData = async () => {
    setLoading(true);
    const comps = await UtilityService.getCompanies();
    setCompanies(comps);
    if (comps.length > 0) {
      const pers = await UtilityService.getPeriods(comps[0].id);
      setPeriods(pers);
      const lines = await UtilityService.getIncomeLines(comps[0].id);
      setIncomeLines(lines);
      const catalog = await UtilityService.getExpenseCatalog(comps[0].id);
      setExpenseCatalog(catalog);
    }
    setLoading(false);
  };

  const loadPeriodData = async () => {
    setLoading(true);
    try {
      const [stats, incLine, expCat, incRecs, expRecs, partnersData] = await Promise.all([
        UtilityService.getKPIs(selectedPeriod),
        UtilityService.getIncomeByLine(selectedPeriod),
        UtilityService.getExpensesByCategory(selectedPeriod),
        UtilityService.getIncomeRecords(selectedPeriod),
        UtilityService.getExpenseRecords(selectedPeriod),
        UtilityService.getPartners(selectedCompany)
      ]);
      setKpis(stats);
      setIncomeByLine(incLine);
      setExpensesByCategory(expCat);
      setIncomeRecords(incRecs);
      setExpenseRecords(expRecs);
      setPartners(partnersData);
      
      const [logs, assignmentRules] = await Promise.all([
        UtilityService.getAuditLogs(selectedCompany),
        UtilityService.getAssignmentRules(selectedCompany)
      ]);
      setAuditLogs(logs);
      setRules(assignmentRules);
    } catch (error) {
      console.error("Error loading period data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.line_id || newIncome.value <= 0) return;
    await UtilityService.addIncomeRecord({
      ...newIncome,
      period_id: selectedPeriod,
      currency: 'COP'
    });
    setIsAddIncomeOpen(false);
    setNewIncome({ line_id: '', value: 0, date: new Date().toISOString().split('T')[0] });
    loadPeriodData();
  };

  const handleAddExpense = async () => {
    if (!newExpense.catalog_id || newExpense.value <= 0) return;
    await UtilityService.addExpenseRecord({
      ...newExpense,
      period_id: selectedPeriod,
      currency: 'COP',
      status: 'CONFIRMED'
    });
    setIsAddExpenseOpen(false);
    setNewExpense({ catalog_id: '', value: 0, date: new Date().toISOString().split('T')[0] });
    loadPeriodData();
  };

  const handleClosePeriod = async () => {
    if (!confirm('¿Estás seguro de cerrar este periodo? Esta acción es irreversible y bloqueará nuevos registros.')) return;
    setLoading(true);
    await UtilityService.closePeriod(selectedPeriod, '3990');
    await loadPeriodData();
    setLoading(false);
    alert('Periodo cerrado exitosamente.');
  };

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const renderOverview = () => {
    const waterfallData = [
      { name: 'Ingresos', value: kpis?.total_income || 0, fill: '#6366F1' },
      { name: 'Gastos', value: -(kpis?.total_expenses || 0), fill: '#EF4444' },
      { name: 'Utilidad (UG)', value: kpis?.ug || 0, fill: '#10B981' },
      { name: 'Impuestos', value: -(kpis?.pi || 0), fill: '#94a3b8' },
      { name: 'Disponible (UD)', value: kpis?.ud || 0, fill: '#F59E0B' }
    ];

    const isClosed = periods.find(p => p.id === selectedPeriod)?.status === 'CLOSED';

    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        {isClosed && (
          <div className="bg-slate-900 text-amber-400 p-4 rounded-3xl flex items-center justify-between px-8 shadow-xl">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Este periodo está CERRADO y es de solo lectura</span>
            </div>
            <Lock size={16} />
          </div>
        )}
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Ingresos Totales" 
          value={kpis?.total_income || 0} 
          variation={8.2} 
          icon={<ArrowUpRight size={24} />} 
          color="indigo" 
        />
        <KPICard 
          title="Gastos Operativos" 
          value={kpis?.total_expenses || 0} 
          variation={-2.1} 
          icon={<ArrowDownRight size={24} />} 
          color="rose" 
        />
        <KPICard 
          title="Utilidad Gerencial (UG)" 
          value={kpis?.ug || 0} 
          variation={12.5} 
          icon={<Zap size={24} />} 
          color="emerald" 
        />
        <KPICard 
          title="Margen UD" 
          value={kpis?.margin_ud || 0} 
          suffix="%" 
          prefix=""
          icon={<Target size={24} />} 
          color="amber" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Waterfall Flow */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Flujo de Utilidad (Waterfall)</h4>
            <TrendingUp size={16} className="text-slate-300" />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Distribution */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Distribución Ingresos</h4>
            <PieChartIcon size={16} className="text-slate-300" />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeByLine}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {incomeByLine.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Gastos por Categoría</h4>
            <BarChart3 size={16} className="text-slate-300" />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategory} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={24}>
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[32px] flex gap-4 items-start">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Alerta de Margen</p>
            <p className="text-sm font-bold text-rose-900 leading-tight">El margen UD cayó un 4.2% respecto al mes anterior.</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex gap-4 items-start">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Pendientes de Cierre</p>
            <p className="text-sm font-bold text-amber-900 leading-tight">Tienes 3 gastos sin asignar a líneas de ingreso.</p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[32px] flex gap-4 items-start">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Insight Financiero</p>
            <p className="text-sm font-bold text-indigo-900 leading-tight">La línea "Modelos" representa el 75% de tu utilidad este mes.</p>
          </div>
        </div>
      </div>

      {/* Break-even Analysis */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Punto de Equilibrio y Proyecciones</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Ingresos Necesarios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Ingresos Reales</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Punto de Equilibrio</p>
              <p className="text-2xl font-black text-slate-900">${(kpis?.total_expenses || 0).toLocaleString()}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-1">Ingresos mínimos para no tener pérdidas.</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Superávit Actual</p>
              <p className="text-2xl font-black text-emerald-600">${(kpis?.ug || 0).toLocaleString()}</p>
              <p className="text-[10px] font-medium text-emerald-700 mt-1">Exceso sobre el punto de equilibrio.</p>
            </div>
          </div>
          <div className="lg:col-span-3 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Semana 1', real: 40000000, target: 35000000 },
                { name: 'Semana 2', real: 85000000, target: 70000000 },
                { name: 'Semana 3', real: 120000000, target: 105000000 },
                { name: 'Semana 4', real: kpis?.total_income || 0, target: kpis?.total_expenses || 0 },
              ]}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="real" stroke="#10B981" fillOpacity={1} fill="url(#colorReal)" strokeWidth={3} />
                <Area type="monotone" dataKey="target" stroke="#6366F1" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Summary Table */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Resumen Financiero del Periodo</h4>
          <div className="flex gap-2">
            <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><Download size={16} /></button>
            <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><MoreVertical size={16} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">% Ingresos</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 text-sm font-bold text-slate-700">Ingresos Brutos</td>
                <td className="py-4 text-sm font-black text-slate-900 text-right">${kpis?.total_income.toLocaleString()}</td>
                <td className="py-4 text-sm font-bold text-slate-400 text-right">100%</td>
                <td className="py-4 text-right"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">Cerrado</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 text-sm font-bold text-slate-700">Costos y Gastos Totales</td>
                <td className="py-4 text-sm font-black text-rose-600 text-right">-${kpis?.total_expenses.toLocaleString()}</td>
                <td className="py-4 text-sm font-bold text-slate-400 text-right">{((kpis?.total_expenses || 0) / (kpis?.total_income || 1) * 100).toFixed(1)}%</td>
                <td className="py-4 text-right"><span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase">Pendiente</span></td>
              </tr>
              <tr className="bg-slate-900 text-white rounded-2xl">
                <td className="py-6 px-4 text-sm font-black uppercase tracking-widest">Utilidad Gerencial (UG)</td>
                <td className="py-6 px-4 text-lg font-black text-amber-400 text-right">${kpis?.ug.toLocaleString()}</td>
                <td className="py-6 px-4 text-sm font-black text-slate-400 text-right">{((kpis?.ug || 0) / (kpis?.total_income || 1) * 100).toFixed(1)}%</td>
                <td className="py-6 px-4 text-right"></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 text-sm font-bold text-slate-700">Provisión Impuestos (35%)</td>
                <td className="py-4 text-sm font-black text-slate-500 text-right">-${kpis?.pi.toLocaleString()}</td>
                <td className="py-4 text-sm font-bold text-slate-400 text-right">{( (kpis?.pi || 0) / (kpis?.total_income || 1) * 100).toFixed(1)}%</td>
                <td className="py-4 text-right"><span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase">Estimado</span></td>
              </tr>
              <tr className="bg-emerald-600 text-white">
                <td className="py-6 px-4 text-sm font-black uppercase tracking-widest">Utilidad Disponible (UD)</td>
                <td className="py-6 px-4 text-lg font-black text-white text-right">${kpis?.ud.toLocaleString()}</td>
                <td className="py-6 px-4 text-sm font-black text-emerald-200 text-right">{kpis?.margin_ud.toFixed(1)}%</td>
                <td className="py-6 px-4 text-right"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const renderIncome = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Ingresos</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsConfigIncomeOpen(true)}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Configurar Líneas
          </button>
          <button 
            onClick={() => setIsAddIncomeOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
          >
            <Plus size={16} /> Registrar Ingreso
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {incomeLines.map(line => {
          const lineTotal = incomeRecords.filter(r => r.line_id === line.id).reduce((sum, r) => sum + r.value, 0);
          return (
            <div key={line.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{line.category}</span>
              </div>
              <h5 className="text-sm font-black text-slate-900 mb-1">{line.name}</h5>
              <p className="text-2xl font-black text-slate-900 tracking-tight">${lineTotal.toLocaleString()}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">8 Transacciones</span>
                <button className="text-[10px] font-black text-indigo-500 hover:underline">VER DETALLE</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Historial de Ingresos</h4>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="text" placeholder="Buscar transacción..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Línea de Ingreso</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sede</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incomeRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 text-xs font-bold text-slate-500">{record.date}</td>
                  <td className="p-6">
                    <span className="text-sm font-black text-slate-900">{incomeLines.find(l => l.id === record.line_id)?.name}</span>
                  </td>
                  <td className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Sede Principal</td>
                  <td className="p-6 text-sm font-black text-emerald-600 text-right">${record.value.toLocaleString()}</td>
                  <td className="p-6 text-center">
                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Egresos</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsConfigExpenseOpen(true)}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Configurar Catálogo
          </button>
          <button 
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-6 py-3 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
          >
            Registrar Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Filtros Avanzados</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Categoría</label>
                <select className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none">
                  <option>Todas las categorías</option>
                  <option>Nómina</option>
                  <option>Operación</option>
                  <option>Administración</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo</label>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Fijos</button>
                  <button className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Variables</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-600/20">
            <ShieldCheck size={32} className="mb-4 text-indigo-200" />
            <h5 className="text-lg font-black tracking-tight mb-2">Asignación Automática</h5>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-6">
              El 85% de tus gastos recurrentes ya tienen reglas de asignación a líneas de ingreso.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Revisar Reglas
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Gastos del Periodo</h4>
            <div className="flex gap-2">
              <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><Filter size={16} /></button>
              <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><Download size={16} /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sede</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenseRecords.map(record => {
                  const catalog = expenseCatalog.find(c => c.id === record.catalog_id);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{catalog?.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{record.date}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {catalog?.category}
                        </span>
                      </td>
                      <td className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Sede Principal</td>
                      <td className="p-6 text-sm font-black text-rose-600 text-right">${record.value.toLocaleString()}</td>
                      <td className="p-6 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${record.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {record.status === 'CONFIRMED' ? 'Confirmado' : 'Borrador'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl shadow-xl shadow-slate-900/20">
              <BarChart3 size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Control de Utilidades</h1>
              <p className="text-sm text-slate-500 font-medium">Gestión gerencial, financiera y operativa del grupo El Castillo.</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm">
          <div className="flex flex-col px-4 border-r border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Empresa</span>
            <select 
              className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col px-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Periodo</span>
            <select 
              className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {periods.map(p => <option key={p.id} value={p.id}>{p.year} - {p.month.toString().padStart(2, '0')}</option>)}
            </select>
          </div>
          <button className="p-3 bg-slate-900 text-amber-400 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm gap-2">
        {[
          { id: 'OVERVIEW', label: 'Resumen General', icon: LayoutDashboard },
          { id: 'INCOME', label: 'Ingresos', icon: TrendingUp },
          { id: 'EXPENSES', label: 'Egresos / Gastos', icon: TrendingDown },
          { id: 'PAYROLL', label: 'Nómina', icon: Users },
          { id: 'LOANS', label: 'Préstamos', icon: Wallet },
          { id: 'SETTINGS', label: 'Configuración', icon: Settings }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-amber-400' : 'text-slate-400'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {loading && !kpis ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-200">
            <RefreshCw className="animate-spin mb-6" size={64} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Calculando métricas gerenciales...</p>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && renderOverview()}
            {activeTab === 'INCOME' && renderIncome()}
            {activeTab === 'EXPENSES' && renderExpenses()}
            {activeTab === 'PAYROLL' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Nómina</h3>
                  <button className="px-6 py-3 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">
                    Generar Nómina del Mes
                  </button>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Resumen de Nómina por Área</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['Administración', 'Monitoreo', 'Fotografía', 'Maquillaje'].map(area => (
                      <div key={area} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{area}</p>
                        <p className="text-xl font-black text-slate-900">$12.500.000</p>
                        <div className="mt-4 flex justify-between text-[9px] font-bold text-slate-500">
                          <span>8 Empleados</span>
                          <span className="text-emerald-600">Al día</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'LOANS' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Préstamos y Movimientos</h3>
                  <button className="px-6 py-3 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">
                    Nuevo Préstamo
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Cartera de Préstamos</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'Juan Perez', amount: 2000000, balance: 1500000, status: 'Al día' },
                        { name: 'Maria Lopez', amount: 500000, balance: 100000, status: 'Cerca de finalizar' }
                      ].map(loan => (
                        <div key={loan.name} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-sm font-black text-slate-900">{loan.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Saldo: ${loan.balance.toLocaleString()}</p>
                          </div>
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">{loan.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Ingresos por Intereses</h4>
                    <div className="flex items-center gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                      <TrendingUp className="text-indigo-600" size={32} />
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Intereses Mes</p>
                        <p className="text-2xl font-black text-indigo-600">$450.000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'SETTINGS' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Configuración Financiera</h3>
                  <button 
                    onClick={handleClosePeriod}
                    disabled={periods.find(p => p.id === selectedPeriod)?.status === 'CLOSED'}
                    className="px-6 py-3 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ShieldCheck size={16} /> Cerrar Periodo Actual
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Rules */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Reglas de Asignación Persistentes</h4>
                    <div className="space-y-4">
                      {rules.map(rule => (
                        <div key={rule.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-black text-slate-900">
                              {expenseCatalog.find(c => c.id === rule.catalog_id)?.name}
                            </p>
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase">{rule.mode}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rule.details.lines.map((l: any) => (
                              <span key={l.line_id} className="text-[9px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                                {incomeLines.find(il => il.id === l.line_id)?.name}: {l.value}%
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all">
                        Nueva Regla de Asignación
                      </button>
                    </div>
                  </div>

                  {/* Partners */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Participación de Socios</h4>
                    <div className="space-y-4">
                      {partners.map(partner => (
                        <div key={partner.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <span className="text-sm font-black text-slate-900">{partner.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-indigo-600">{partner.percentage}%</span>
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${partner.percentage}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all">
                        Gestionar Socios
                      </button>
                    </div>
                  </div>

                  {/* Audit Logs */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Historial de Auditoría Financiera</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {auditLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${log.action === 'CLOSE_PERIOD' ? 'bg-slate-900 text-amber-400' : 'bg-indigo-50 text-indigo-600'}`}>
                              {log.action === 'CLOSE_PERIOD' ? <ShieldCheck size={16} /> : <History size={16} />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{log.action} - {log.entity}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase">ID: {log.entity_id}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Providers */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Proveedores y Terceros</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'Abogado Externo (Honorarios)', type: 'Proveedor' },
                        { name: 'Provensoft', type: 'Software' },
                        { name: 'Evan Colombia', type: 'Servicios' }
                      ].map(prov => (
                        <div key={prov.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <span className="text-sm font-black text-slate-900">{prov.name}</span>
                          <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-2 py-1 rounded uppercase">{prov.type}</span>
                        </div>
                      ))}
                      <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all">
                        Gestionar Terceros
                      </button>
                    </div>
                  </div>

                  {/* Provision Params */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Parámetros de Provisión</h4>
                    <div className="space-y-6">
                      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Tasa Impuestos</span>
                          <span className="text-xl font-black text-amber-600">35%</span>
                        </div>
                        <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                          Esta tasa se aplica sobre la Utilidad Gerencial (UG) para calcular la caja de reserva tributaria.
                        </p>
                      </div>
                      <button className="w-full py-4 bg-slate-900 text-amber-400 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                        Editar Parámetros
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-rose-50 p-8 rounded-[40px] border border-rose-100 shadow-sm">
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-[0.2em] mb-6">Zona de Peligro</h4>
                    <div className="space-y-4">
                      <p className="text-[10px] font-medium text-rose-700 leading-relaxed">
                        Estas acciones son irreversibles. Ten precaución al ejecutarlas.
                      </p>
                      <button 
                        onClick={async () => {
                          if (confirm('¿Estás seguro de eliminar los datos de DEMO_SINPROD? Esta acción no se puede deshacer.')) {
                            await UtilityService.deleteDemoData();
                            alert('Datos de demo eliminados correctamente.');
                            loadInitialData();
                          }
                        }}
                        className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Eliminar Datos de Demo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {isAddIncomeOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddIncomeOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Registrar Nuevo Ingreso</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Línea de Ingreso</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={newIncome.line_id}
                  onChange={(e) => setNewIncome({...newIncome, line_id: e.target.value})}
                >
                  <option value="">Seleccionar línea...</option>
                  {incomeLines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor (COP)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={newIncome.value}
                  onChange={(e) => setNewIncome({...newIncome, value: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={newIncome.date}
                  onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAddIncome}
                className="w-full py-4 bg-slate-900 text-amber-400 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all mt-4"
              >
                Guardar Ingreso
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddExpenseOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Registrar Nuevo Gasto</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Concepto de Gasto</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={newExpense.catalog_id}
                  onChange={(e) => setNewExpense({...newExpense, catalog_id: e.target.value})}
                >
                  <option value="">Seleccionar concepto...</option>
                  {expenseCatalog.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor (COP)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={newExpense.value}
                  onChange={(e) => setNewExpense({...newExpense, value: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAddExpense}
                className="w-full py-4 bg-slate-900 text-amber-400 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all mt-4"
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfigIncomeOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsConfigIncomeOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Configurar Líneas de Ingreso</h3>
              <button onClick={() => setIsConfigIncomeOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {incomeLines.map(line => (
                <div key={line.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-black text-slate-900">{line.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{line.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 size={16} /></button>
                    <button 
                      onClick={async () => {
                        if (confirm('¿Eliminar esta línea?')) {
                          await UtilityService.deleteIncomeLine(line.id);
                          loadInitialData();
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={async () => {
                  const name = prompt('Nombre de la nueva línea:');
                  if (name) {
                    await UtilityService.addIncomeLine({
                      company_id: selectedCompany,
                      name,
                      category: 'Otros',
                      active: true
                    });
                    loadInitialData();
                  }
                }}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Agregar Nueva Línea
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfigExpenseOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsConfigExpenseOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Catálogo de Egresos</h3>
              <button onClick={() => setIsConfigExpenseOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {expenseCatalog.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-widest">{item.category}</span>
                      <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-widest">{item.type}</span>
                      {item.recurrent && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Recurrente</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 size={16} /></button>
                    <button 
                      onClick={async () => {
                        if (confirm('¿Eliminar este concepto?')) {
                          await UtilityService.deleteExpenseCatalogItem(item.id);
                          loadInitialData();
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={async () => {
                  const name = prompt('Nombre del nuevo concepto:');
                  if (name) {
                    await UtilityService.addExpenseCatalogItem({
                      company_id: selectedCompany,
                      name,
                      category: 'Operación',
                      type: 'OPERATIVO',
                      recurrent: true,
                      frequency: 'MENSUAL',
                      fixed_value: false,
                      currency: 'COP',
                      default_scope: 'COMPANY',
                      requires_assignment: true,
                      active: true
                    });
                    loadInitialData();
                  }
                }}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> Agregar al Catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilityDashboard;
