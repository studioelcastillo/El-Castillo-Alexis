
import React, { useState, useEffect } from 'react';
import {
  X, ChevronDown, Loader2, Plus, Pencil, Power, Trash2,
  FileText, Download, Users, Target, DollarSign, ChevronUp, Copy, Check
} from 'lucide-react';
import ContractService, {
  CONTRACT_TYPES,
  COMMISSION_TYPES,
  ARL_RISK_LEVELS,
  PLATFORM_OPTIONS,
  DOCUMENT_TYPES,
} from '../ContractService';
import type { ContractPayload } from '../ContractService';
import { downloadFromResponse } from '../utils/download';

// ==================== TYPES ====================

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  contract?: any | null;
  onSaved: () => void;
}

interface SelectOption {
  label: string;
  value: string | number;
}

// ==================== HELPERS ====================

const formatCurrency = (value: number | string | null | undefined): string => {
  if (value == null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('es-CO', { maximumFractionDigits: 0 });
};

const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const getDaysInCurrentMonth = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const fmtDate = (d: string | null) => {
  if (!d) return '---';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
};

const maskSecret = (value: string | null | undefined) => {
  if (!value) return '---';
  return '••••••••';
};

// ==================== SHARED UI COMPONENTS ====================

const ModalSelect: React.FC<{
  label: string; value: string | number; onChange: (v: string) => void;
  options: SelectOption[]; disabled?: boolean; required?: boolean;
}> = ({ label, value, onChange, options, disabled, required }) => (
  <div className="relative">
    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute top-2 left-4 z-10">{label}{required && ' *'}</label>
    <select
      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-4 pt-7 pb-2.5 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
    >
      <option value="">--- Seleccionar ---</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-4 top-1/2 text-slate-400 pointer-events-none" />
  </div>
);

const ModalInput: React.FC<{
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; disabled?: boolean; required?: boolean; placeholder?: string;
}> = ({ label, value, onChange, type = 'text', disabled, required, placeholder }) => (
  <div className="relative">
    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute top-2 left-4 z-10">{label}{required && ' *'}</label>
    <input
      type={type}
      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-4 pt-7 pb-2.5 text-sm text-slate-700 font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
    />
  </div>
);

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-3">
    <button type="button" onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
    <span className="text-sm text-slate-600">{label} ({value ? 'SI' : 'NO'})</span>
  </div>
);

const Checkbox: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${value ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'}`}
      onClick={() => onChange(!value)}>
      {value && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
    <span className="text-sm text-slate-600">{label}</span>
  </label>
);

const SubSection: React.FC<{
  title: string; icon: any; children: React.ReactNode;
  action?: React.ReactNode; color?: string; defaultOpen?: boolean;
}> = ({ title, icon: Icon, children, action, color = 'slate', defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-slate-500" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
};

const Chip: React.FC<{ active: boolean; label?: string }> = ({ active, label }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
    {label ?? (active ? 'Si' : 'No')}
  </span>
);

// ==================== MAIN COMPONENT ====================

const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen, onClose, userId, userName, contract, onSaved,
}) => {
  const isEditMode = !!contract;
  const isModel = isEditMode
    ? (contract?.stdmod_contract_type === 'MANDANTE - MODELO')
    : true; // default for create

  // ============ CONTRACT FORM STATE ============
  const [form, setForm] = useState({
    contract_type: 'MANDANTE - MODELO', position: '', area: '',
    std_id: '', stdroom_id: '', stdshift_id: '',
    start_at: '', finish_at: '',
    country_id: '', department_id: '', city_id: '',
    commission_type: '', percent: '', goal: '',
    rtefte: false, active: true,
    monthly_salary: '', daily_salary: '', dotacion_amount: '100000',
    has_sena: false, has_caja_compensacion: false, has_icbf: false, arl_risk_level: 'I',
  });
  const formIsModel = form.contract_type === 'MANDANTE - MODELO';

  // ============ DROPDOWNS ============
  const [studios, setStudios] = useState<SelectOption[]>([]);
  const [rooms, setRooms] = useState<SelectOption[]>([]);
  const [shifts, setShifts] = useState<SelectOption[]>([]);
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [cities, setCities] = useState<SelectOption[]>([]);

  // ============ UI ============
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'accounts' | 'goals' | 'payments'>('form');
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  // ============ SUBGRID DATA (edit mode only) ============
  const [accounts, setAccounts] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // ============ ACCOUNT FORM (inline) ============
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accForm, setAccForm] = useState({ app: '', username: '', password: '', screen_name: '', payment_username: '', mail: '', linkacc: '', active: true });
  const [savingAccount, setSavingAccount] = useState(false);

  // ============ GOAL FORM (inline) ============
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [goalForm, setGoalForm] = useState({ type: '', amount: '', percent: '', date: '' });
  const [savingGoal, setSavingGoal] = useState(false);

  // ============ COPIED SCREEN NAME ============
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleDownloadDocument = async (docType: string) => {
    if (!contract?.stdmod_id || downloadingDoc) return;
    setDownloadingDoc(docType);
    try {
      const response = await ContractService.downloadDocument(contract.stdmod_id, docType);
      downloadFromResponse(response, `documento-${contract.stdmod_id}-${docType}.pdf`);
    } catch (err) {
      console.error('Error descargando documento:', err);
    } finally {
      setDownloadingDoc(null);
    }
  };

  // ============ LOAD INITIAL DATA ============
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [studiosRes, countriesRes] = await Promise.all([
          ContractService.getStudios(), ContractService.getCountries(),
        ]);
        setStudios((studiosRes.data?.data || []).map((s: any) => ({ label: s.std_name, value: s.std_id })));
        setCountries((countriesRes.data?.data || []).map((c: any) => ({ label: c.country_name, value: c.country_id })));
      } catch {}
    })();
  }, [isOpen]);

  // ============ POPULATE EDIT ============
  useEffect(() => {
    if (!isOpen) return;
    if (contract) {
      const c = contract;
      setForm({
        contract_type: c.stdmod_contract_type || 'MANDANTE - MODELO',
        position: c.stdmod_position || '', area: c.stdmod_area || '',
        std_id: c.studio?.std_id ?? c.std_id ?? '',
        stdroom_id: c.studio_room?.stdroom_id ?? c.stdroom_id ?? '',
        stdshift_id: c.studio_shift?.stdshift_id ?? c.stdshift_id ?? '',
        start_at: c.stdmod_start_at ? c.stdmod_start_at.split('T')[0].split(' ')[0] : '',
        finish_at: c.stdmod_finish_at ? c.stdmod_finish_at.split('T')[0].split(' ')[0] : '',
        country_id: c.city?.department?.country?.country_id ?? '',
        department_id: c.city?.department?.dpto_id ?? '',
        city_id: c.city_id ?? '',
        commission_type: c.stdmod_commission_type || '',
        percent: c.stdmod_percent != null ? String(c.stdmod_percent) : '',
        goal: c.stdmod_goal != null ? String(c.stdmod_goal) : '',
        rtefte: !!c.stdmod_rtefte,
        active: c.stdmod_active !== false && c.stdmod_active !== 0,
        monthly_salary: c.stdmod_monthly_salary != null ? formatCurrency(c.stdmod_monthly_salary) : '',
        daily_salary: c.stdmod_daily_salary != null ? formatCurrency(c.stdmod_daily_salary) : '',
        dotacion_amount: c.stdmod_dotacion_amount != null ? formatCurrency(c.stdmod_dotacion_amount) : '100.000',
        has_sena: !!c.stdmod_has_sena, has_caja_compensacion: !!c.stdmod_has_caja_compensacion,
        has_icbf: !!c.stdmod_has_icbf, arl_risk_level: c.stdmod_arl_risk_level || 'I',
      });
      // Cascade loads
      const studioId = c.studio?.std_id ?? c.std_id;
      if (studioId) {
        ContractService.getStudioRooms(studioId).then(r => setRooms((r.data?.data || []).map((x: any) => ({ label: x.stdroom_name, value: x.stdroom_id }))));
        ContractService.getStudioShifts(studioId).then(r => setShifts((r.data?.data || []).map((x: any) => ({ label: x.stdshift_name, value: x.stdshift_id }))));
      }
      const countryId = c.city?.department?.country?.country_id;
      if (countryId) ContractService.getDepartments(countryId).then(r => setDepartments((r.data?.data || []).map((x: any) => ({ label: x.dpto_name, value: x.dpto_id }))));
      const dptoId = c.city?.department?.dpto_id;
      if (dptoId) ContractService.getCities(dptoId).then(r => setCities((r.data?.data || []).map((x: any) => ({ label: x.city_name, value: x.city_id }))));

      // Load subgrid data
      loadAccounts(c.stdmod_id);
      loadGoals(c.stdmod_id);
      loadPayments(c.stdmod_id);
    } else {
      // Reset
      setForm({ contract_type: 'MANDANTE - MODELO', position: '', area: '', std_id: '', stdroom_id: '', stdshift_id: '', start_at: '', finish_at: '', country_id: '', department_id: '', city_id: '', commission_type: '', percent: '', goal: '', rtefte: false, active: true, monthly_salary: '', daily_salary: '', dotacion_amount: '100.000', has_sena: false, has_caja_compensacion: false, has_icbf: false, arl_risk_level: 'I' });
      setRooms([]); setShifts([]); setDepartments([]); setCities([]);
      setAccounts([]); setGoals([]); setPayments([]);
      setActiveTab('form');
    }
  }, [isOpen, contract]);

  // ============ SUBGRID LOADERS ============
  const loadAccounts = async (id: number | string) => {
    setLoadingAccounts(true);
    try { const r = await ContractService.getAccounts(id); setAccounts(r.data?.data || []); } catch {} finally { setLoadingAccounts(false); }
  };
  const loadGoals = async (id: number | string) => {
    setLoadingGoals(true);
    try { const r = await ContractService.getGoals(id); setGoals(r.data?.data || []); } catch {} finally { setLoadingGoals(false); }
  };
  const loadPayments = async (id: number | string) => {
    setLoadingPayments(true);
    try { const r = await ContractService.getPayments(id); setPayments(r.data?.data || []); } catch {} finally { setLoadingPayments(false); }
  };

  // ============ CASCADE HANDLERS ============
  const handleStudioChange = async (studioId: string) => {
    set('std_id', studioId); set('stdroom_id', ''); set('stdshift_id', '');
    setRooms([]); setShifts([]);
    if (!studioId) return;
    setLoadingRooms(true); setLoadingShifts(true);
    try {
      const [rr, sr] = await Promise.all([ContractService.getStudioRooms(studioId), ContractService.getStudioShifts(studioId)]);
      setRooms((rr.data?.data || []).map((x: any) => ({ label: x.stdroom_name, value: x.stdroom_id })));
      setShifts((sr.data?.data || []).map((x: any) => ({ label: x.stdshift_name, value: x.stdshift_id })));
    } catch {} finally { setLoadingRooms(false); setLoadingShifts(false); }
  };
  const handleCountryChange = async (countryId: string) => {
    set('country_id', countryId); set('department_id', ''); set('city_id', '');
    setDepartments([]); setCities([]);
    if (!countryId) return;
    setLoadingDepts(true);
    try { const r = await ContractService.getDepartments(countryId); setDepartments((r.data?.data || []).map((x: any) => ({ label: x.dpto_name, value: x.dpto_id }))); } catch {} finally { setLoadingDepts(false); }
  };
  const handleDepartmentChange = async (dptoId: string) => {
    set('department_id', dptoId); set('city_id', ''); setCities([]);
    if (!dptoId) return;
    setLoadingCities(true);
    try { const r = await ContractService.getCities(dptoId); setCities((r.data?.data || []).map((x: any) => ({ label: x.city_name, value: x.city_id }))); } catch {} finally { setLoadingCities(false); }
  };

  const handleMonthlySalaryChange = (val: string) => {
    set('monthly_salary', val);
    const num = parseCurrency(val);
    if (num > 0) { set('daily_salary', formatCurrency(Math.round((num / getDaysInCurrentMonth()) * 100) / 100)); }
    else { set('daily_salary', ''); }
  };

  // ============ CONTRACT SUBMIT ============
  const handleSubmit = async () => {
    if (!form.std_id) { setError('Seleccione un estudio'); return; }
    if (!form.start_at) { setError('Seleccione fecha de inicio'); return; }
    if (!form.city_id) { setError('Seleccione una ciudad'); return; }
    setSaving(true); setError(null);
    try {
      const payload: ContractPayload = {
        std_id: form.std_id, stdroom_id: form.stdroom_id || '', user_id_model: userId,
        stdmod_start_at: form.start_at, stdmod_finish_at: form.finish_at,
        stdmod_active: form.active, stdmod_percent: form.percent, stdmod_rtefte: form.rtefte,
        stdshift_id: form.stdshift_id || '', stdmod_commission_type: form.commission_type,
        stdmod_goal: form.goal, stdmod_contract_type: form.contract_type,
        stdmod_position: form.position, stdmod_area: form.area, city_id: form.city_id,
        stdmod_monthly_salary: !formIsModel ? parseCurrency(form.monthly_salary) || null : null,
        stdmod_biweekly_salary: null,
        stdmod_daily_salary: !formIsModel ? parseCurrency(form.daily_salary) || null : null,
        stdmod_dotacion_amount: !formIsModel ? parseCurrency(form.dotacion_amount) || 100000 : null,
        stdmod_has_sena: !formIsModel ? form.has_sena : false,
        stdmod_has_caja_compensacion: !formIsModel ? form.has_caja_compensacion : false,
        stdmod_has_icbf: !formIsModel ? form.has_icbf : false,
        stdmod_arl_risk_level: !formIsModel ? form.arl_risk_level : '',
      };
      if (isEditMode) await ContractService.editContract(contract.stdmod_id, payload);
      else await ContractService.addContract(payload);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el contrato');
    } finally { setSaving(false); }
  };

  // ============ ACCOUNT CRUD ============
  const openAccountForm = (acc?: any) => {
    if (acc) {
      setEditingAccount(acc);
      setAccForm({ app: acc.modacc_app || '', username: acc.modacc_username || '', password: acc.modacc_password || '', screen_name: acc.modacc_screen_name || '', payment_username: acc.modacc_payment_username || '', mail: acc.modacc_mail || '', linkacc: acc.modacc_linkacc || '', active: acc.modacc_active !== false && acc.modacc_active !== 0 });
    } else {
      setEditingAccount(null);
      setAccForm({ app: '', username: '', password: '', screen_name: '', payment_username: '', mail: '', linkacc: '', active: true });
    }
    setShowAccountForm(true);
  };

  const saveAccount = async () => {
    if (!accForm.app || !accForm.username || !accForm.password || !accForm.mail) { setError('Campos requeridos: App, Usuario, Contrasena, Correo'); return; }
    if (accForm.app === 'LIVEJASMIN' && !accForm.screen_name) { setError('Screen Name es requerido para LiveJasmin'); return; }
    setSavingAccount(true); setError(null);
    try {
      const data = {
        stdmod_id: contract.stdmod_id,
        modacc_app: accForm.app, modacc_username: accForm.username, modacc_password: accForm.password,
        modacc_screen_name: accForm.app === 'LIVEJASMIN' ? accForm.screen_name : null,
        modacc_payment_username: accForm.payment_username, modacc_mail: accForm.mail,
        modacc_linkacc: accForm.app === 'XLOVECAM' ? accForm.linkacc : null,
        modacc_active: accForm.active, modacc_state: null, modacc_fail_message: null, modacc_fail_count: 0,
      };
      if (editingAccount) await ContractService.editAccount(editingAccount.modacc_id, data);
      else await ContractService.addAccount(data);
      setShowAccountForm(false);
      loadAccounts(contract.stdmod_id);
    } catch (err: any) { setError(err.response?.data?.message || 'Error guardando cuenta'); }
    finally { setSavingAccount(false); }
  };

  const toggleAccountActive = async (acc: any) => {
    try {
      if (acc.modacc_active) await ContractService.deactivateAccount(acc.modacc_id);
      else await ContractService.activateAccount(acc.modacc_id);
      loadAccounts(contract.stdmod_id);
    } catch {}
  };

  const deleteAccount = async (acc: any) => {
    if (!window.confirm(`¿Estás seguro de eliminar la cuenta "${acc.modacc_app} - ${acc.modacc_username}"?`)) return;
    try { await ContractService.deleteAccount(acc.modacc_id); loadAccounts(contract.stdmod_id); }
    catch (err: any) { setError(err.response?.data?.message || 'No se pudo eliminar la cuenta'); }
  };

  const copyScreenName = (acc: any) => {
    navigator.clipboard.writeText(acc.modacc_screen_name || '');
    setCopiedId(acc.modacc_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ============ GOAL CRUD ============
  const openGoalForm = (g?: any) => {
    if (g) {
      setEditingGoal(g);
      setGoalForm({ type: g.modgoal_type || '', amount: g.modgoal_amount != null ? String(g.modgoal_amount) : '', percent: g.modgoal_percent != null ? String(g.modgoal_percent) : '', date: g.modgoal_date ? g.modgoal_date.split('T')[0].split(' ')[0] : '' });
    } else {
      setEditingGoal(null);
      setGoalForm({ type: '', amount: '', percent: '', date: '' });
    }
    setShowGoalForm(true);
  };

  const saveGoal = async () => {
    if (!goalForm.amount) { setError('El monto es requerido'); return; }
    setSavingGoal(true); setError(null);
    try {
      const data = { stdmod_id: contract.stdmod_id, modgoal_type: goalForm.type, modgoal_amount: parseFloat(goalForm.amount) || 0, modgoal_percent: goalForm.percent ? parseFloat(goalForm.percent) : null, modgoal_date: goalForm.date || null };
      if (editingGoal) await ContractService.editGoal(editingGoal.modgoal_id, data);
      else await ContractService.addGoal(data);
      setShowGoalForm(false);
      loadGoals(contract.stdmod_id);
    } catch (err: any) { setError(err.response?.data?.message || 'Error guardando meta'); }
    finally { setSavingGoal(false); }
  };

  const deleteGoal = async (g: any) => {
    if (!window.confirm('¿Estás seguro de eliminar esta meta?')) return;
    try { await ContractService.deleteGoal(g.modgoal_id); loadGoals(contract.stdmod_id); }
    catch (err: any) { setError(err.response?.data?.message || 'No se pudo eliminar la meta'); }
  };

  if (!isOpen) return null;

  // ============ TAB NAVIGATION (edit mode) ============
  const tabs = [
    { id: 'form' as const, label: 'Contrato', icon: FileText },
    ...(isEditMode && isModel ? [
      { id: 'accounts' as const, label: `Cuentas (${accounts.length})`, icon: Users },
      { id: 'goals' as const, label: `Metas (${goals.length})`, icon: Target },
      { id: 'payments' as const, label: `Pagos (${payments.length})`, icon: DollarSign },
    ] : []),
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{isEditMode ? 'Editar contrato' : 'Crear contrato'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Usuario: <span className="font-semibold text-slate-600">{userName}</span>
              {isEditMode && <> &bull; Nro: <span className="font-mono text-slate-600">{contract.stdmod_contract_number || contract.stdmod_id}</span></>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"><X size={20} /></button>
        </div>

        {/* TABS (edit mode only, model contracts) */}
        {isEditMode && isModel && (
          <div className="flex border-b border-slate-100 bg-white px-5">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === t.id ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">{error} <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button></div>}

          {/* ==================== TAB: CONTRACT FORM ==================== */}
          {activeTab === 'form' && (
            <>
              {/* Tipo & Cargo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModalSelect label="Tipo de contrato" value={form.contract_type} onChange={v => set('contract_type', v)} options={CONTRACT_TYPES.map(t => ({ label: t, value: t }))} disabled={isEditMode} required />
                <ModalInput label="Cargo" value={form.position} onChange={v => set('position', v)} placeholder="Ej: AWS Devops" />
              </div>
              {/* Area & Estudio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModalInput label="Area" value={form.area} onChange={v => set('area', v)} placeholder="Ej: Devops" />
                <ModalSelect label="Estudio" value={form.std_id} onChange={handleStudioChange} options={studios} disabled={isEditMode} required />
              </div>
              {/* Cuarto & Turno */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModalSelect label={loadingRooms ? 'Cargando...' : 'Cuarto'} value={form.stdroom_id} onChange={v => set('stdroom_id', v)} options={rooms} disabled={loadingRooms} />
                <ModalSelect label={loadingShifts ? 'Cargando...' : 'Turno'} value={form.stdshift_id} onChange={v => set('stdshift_id', v)} options={shifts} disabled={loadingShifts} />
              </div>
              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModalInput label="Fecha inicio" value={form.start_at} onChange={v => set('start_at', v)} type="date" required />
                <ModalInput label="Fecha fin" value={form.finish_at} onChange={v => set('finish_at', v)} type="date" />
              </div>
              {/* Ubicacion */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ModalSelect label="Pais" value={form.country_id} onChange={handleCountryChange} options={countries} required />
                <ModalSelect label={loadingDepts ? 'Cargando...' : 'Departamento'} value={form.department_id} onChange={handleDepartmentChange} options={departments} disabled={loadingDepts || !form.country_id} required />
                <ModalSelect label={loadingCities ? 'Cargando...' : 'Ciudad'} value={form.city_id} onChange={v => set('city_id', v)} options={cities} disabled={loadingCities || !form.department_id} required />
              </div>

              {/* MODEL: Ingreso config */}
              {formIsModel && (
                <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Configuracion % de ingreso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ModalSelect label="Tipo de comision" value={form.commission_type} onChange={v => set('commission_type', v)} options={COMMISSION_TYPES.filter(Boolean).map(t => ({ label: t, value: t }))} />
                    {form.commission_type === 'FIJO' && <ModalInput label="Porcentaje de ingreso" value={form.percent} onChange={v => set('percent', v)} type="number" placeholder="50" />}
                    {form.commission_type === 'PRESENCIAL' && <ModalInput label="Meta actual" value={form.goal} onChange={v => set('goal', v)} type="number" placeholder="400" />}
                  </div>
                </div>
              )}

              {/* EMPLOYEE: Payroll config */}
              {!formIsModel && (
                <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-5 space-y-5">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Configuracion nomina</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ModalInput label="Salario mensual" value={form.monthly_salary} onChange={handleMonthlySalaryChange} placeholder="1.300.000" required />
                    <ModalInput label="Salario diario (calculado)" value={form.daily_salary} onChange={() => {}} disabled />
                    <ModalInput label="Dotacion" value={form.dotacion_amount} onChange={v => set('dotacion_amount', v)} placeholder="100.000" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Parafiscales</p>
                    <div className="flex flex-wrap gap-6">
                      <Checkbox label="SENA (2%)" value={form.has_sena} onChange={v => set('has_sena', v)} />
                      <Checkbox label="Caja Compensacion (4%)" value={form.has_caja_compensacion} onChange={v => set('has_caja_compensacion', v)} />
                      <Checkbox label="ICBF (3%)" value={form.has_icbf} onChange={v => set('has_icbf', v)} />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <ModalSelect label="Nivel de riesgo ARL" value={form.arl_risk_level} onChange={v => set('arl_risk_level', v)} options={ARL_RISK_LEVELS.map(a => ({ label: a.label, value: a.value }))} />
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
                <Toggle label="Aplica Rte. Fte?" value={form.rtefte} onChange={v => set('rtefte', v)} />
                <Toggle label="Contrato activo" value={form.active} onChange={v => set('active', v)} />
              </div>

              {/* DOCUMENTS (edit only) */}
              {isEditMode && (
                <SubSection title="Documentos" icon={Download} defaultOpen={false}>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {DOCUMENT_TYPES.map(doc => (
                      <button
                        key={doc.type}
                        type="button"
                        onClick={() => handleDownloadDocument(doc.type)}
                        disabled={downloadingDoc === doc.type}
                        className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-amber-300 hover:shadow-sm transition-all group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <FileText size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center group-hover:text-amber-600">{doc.label}</span>
                      </button>
                    ))}
                  </div>
                </SubSection>
              )}
            </>
          )}

          {/* ==================== TAB: CUENTAS ==================== */}
          {activeTab === 'accounts' && isEditMode && (
            <div className="space-y-4">
              {/* Inline form */}
              {showAccountForm && (
                <div className="border border-amber-200 bg-amber-50/20 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 uppercase">{editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ModalSelect label="Plataforma" value={accForm.app} onChange={v => setAccForm(p => ({ ...p, app: v }))} options={PLATFORM_OPTIONS.map(p => ({ label: p, value: p }))} disabled={!!editingAccount} required />
                    <ModalInput label="Nombre de usuario" value={accForm.username} onChange={v => setAccForm(p => ({ ...p, username: v }))} required />
                    <ModalInput label="Contrasena" value={accForm.password} onChange={v => setAccForm(p => ({ ...p, password: v }))} type="password" required />
                    <ModalInput label="Nick de pago" value={accForm.payment_username} onChange={v => setAccForm(p => ({ ...p, payment_username: v }))} required />
                    <ModalInput label="Correo" value={accForm.mail} onChange={v => setAccForm(p => ({ ...p, mail: v }))} required />
                    {accForm.app === 'LIVEJASMIN' && (
                      <ModalInput label="Screen Name" value={accForm.screen_name} onChange={v => setAccForm(p => ({ ...p, screen_name: v }))} required />
                    )}
                    {accForm.app === 'XLOVECAM' && (
                      <ModalInput label="Link de cuenta" value={accForm.linkacc} onChange={v => setAccForm(p => ({ ...p, linkacc: v }))} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Toggle label="Cuenta activa" value={accForm.active} onChange={v => setAccForm(p => ({ ...p, active: v }))} />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAccountForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">CANCELAR</button>
                      <button onClick={saveAccount} disabled={savingAccount}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
                        {savingAccount && <Loader2 size={12} className="animate-spin" />} GUARDAR
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Accounts table */}
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2"><Loader2 size={16} className="animate-spin" /> Cargando cuentas...</div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Sin cuentas registradas</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="p-3">App</th>
                        <th className="p-3">Usuario</th>
                        <th className="p-3">Contrasena</th>
                        <th className="p-3">Screen Name</th>
                        <th className="p-3">Nick Pago</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3">Activo</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {accounts.map((a: any) => (
                        <tr key={a.modacc_id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3"><span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">{a.modacc_app}</span></td>
                          <td className="p-3 font-medium text-slate-700">{a.modacc_username}</td>
                          <td className="p-3 text-slate-500 font-mono">{maskSecret(a.modacc_password)}</td>
                          <td className="p-3">
                            {a.modacc_screen_name ? (
                              <button onClick={() => copyScreenName(a)} className="flex items-center gap-1 text-slate-600 hover:text-amber-600 transition-colors" title="Click para copiar">
                                <span className="font-mono truncate max-w-[80px]">{a.modacc_screen_name}</span>
                                {copiedId === a.modacc_id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            ) : '---'}
                          </td>
                          <td className="p-3 text-slate-600">{a.modacc_payment_username || '---'}</td>
                          <td className="p-3 text-slate-500">{a.modacc_mail || '---'}</td>
                          <td className="p-3"><Chip active={!!a.modacc_active} /></td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openAccountForm(a)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Editar"><Pencil size={13} /></button>
                              <button onClick={() => toggleAccountActive(a)} className={`p-1.5 rounded-lg ${a.modacc_active ? 'hover:bg-red-50 text-slate-400 hover:text-red-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500'}`} title={a.modacc_active ? 'Desactivar' : 'Activar'}><Power size={13} /></button>
                              <button onClick={() => deleteAccount(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Eliminar"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB: METAS ==================== */}
          {activeTab === 'goals' && isEditMode && (
            <div className="space-y-4">
              {showGoalForm && (
                <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase">{editingGoal ? 'Editar meta' : 'Nueva meta'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ModalSelect label="Tipo" value={goalForm.type} onChange={v => setGoalForm(p => ({ ...p, type: v }))} options={COMMISSION_TYPES.filter(Boolean).map(t => ({ label: t, value: t }))} />
                    <ModalInput label="Monto" value={goalForm.amount} onChange={v => setGoalForm(p => ({ ...p, amount: v }))} type="number" required />
                    <ModalInput label="Porcentaje de ingreso" value={goalForm.percent} onChange={v => setGoalForm(p => ({ ...p, percent: v }))} type="number" />
                    <ModalInput label="Periodo (fecha)" value={goalForm.date} onChange={v => setGoalForm(p => ({ ...p, date: v }))} type="date" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowGoalForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">CANCELAR</button>
                    <button onClick={saveGoal} disabled={savingGoal}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
                      {savingGoal && <Loader2 size={12} className="animate-spin" />} GUARDAR
                    </button>
                  </div>
                </div>
              )}

              {loadingGoals ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2"><Loader2 size={16} className="animate-spin" /> Cargando metas...</div>
              ) : goals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Sin metas registradas</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Monto</th>
                        <th className="p-3">%</th>
                        <th className="p-3">Periodo</th>
                        <th className="p-3">Asignado</th>
                        <th className="p-3">Creado</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {goals.map((g: any) => (
                        <tr key={g.modgoal_id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-400">{g.modgoal_id}</td>
                          <td className="p-3 text-slate-600">{g.modgoal_type || '---'}</td>
                          <td className="p-3 font-bold text-slate-700">{formatCurrency(g.modgoal_amount)}</td>
                          <td className="p-3 text-slate-600">{g.modgoal_percent ?? '---'}</td>
                          <td className="p-3 text-slate-600">{fmtDate(g.modgoal_date)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.modgoal_auto ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                              {g.modgoal_auto ? 'AUTO' : 'MANUAL'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{fmtDate(g.created_at)}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openGoalForm(g)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Editar"><Pencil size={13} /></button>
                              <button onClick={() => deleteGoal(g)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Eliminar"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB: PAGOS ==================== */}
          {activeTab === 'payments' && isEditMode && (
            <div className="space-y-4">
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2"><Loader2 size={16} className="animate-spin" /> Cargando pagos...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Sin pagos registrados</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Cargue</th>
                        <th className="p-3">Estudio</th>
                        <th className="p-3">Monto</th>
                        <th className="p-3">Periodo desde</th>
                        <th className="p-3">Periodo hasta</th>
                        <th className="p-3">Creado</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {payments.map((p: any) => (
                        <tr key={p.pay_id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-400">{p.pay_id}</td>
                          <td className="p-3 text-slate-600">{p.payment_file?.payfile_description || '---'}</td>
                          <td className="p-3 text-slate-600">{p.studio_model?.studio?.std_name || '---'}</td>
                          <td className="p-3 font-bold text-emerald-600">${formatCurrency(p.pay_amount)}</td>
                          <td className="p-3 text-slate-600">{fmtDate(p.pay_period_since)}</td>
                          <td className="p-3 text-slate-600">{fmtDate(p.pay_period_until)}</td>
                          <td className="p-3 text-slate-500">{fmtDate(p.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <div className="flex gap-3">
            {/* Create/Save button on form tab; Add buttons on subgrid tabs */}
            {activeTab === 'form' && (
              <button onClick={handleSubmit} disabled={saving}
                className="px-8 py-3 bg-slate-900 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'GUARDANDO...' : isEditMode ? 'ACTUALIZAR' : 'CREAR CONTRATO'}
              </button>
            )}
            {activeTab === 'accounts' && (
              <button onClick={() => openAccountForm()} className="px-6 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-600/10">
                <Plus size={14} /> NUEVA CUENTA
              </button>
            )}
            {activeTab === 'goals' && (
              <button onClick={() => openGoalForm()} className="px-6 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-600/10">
                <Plus size={14} /> NUEVA META
              </button>
            )}
          </div>
          <button onClick={onClose} disabled={saving}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateContractModal;
