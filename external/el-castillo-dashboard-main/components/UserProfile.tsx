
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, User, CreditCard, FileText, Image,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Shield, Pencil, Save, X, Plus, Loader2, Power
} from 'lucide-react';
import { User as UserType } from '../types';
import UserService from '../UserService';
import ProfileService from '../ProfileService';
import ContractService from '../ContractService';
import CreateContractModal from './CreateContractModal';
import DocumentsSection from './DocumentsSection';
import MultimediaSection from './MultimediaSection';
import StreamsSection from './StreamsSection';
import TransactionsSection from './TransactionsSection';
import { UserProfileData } from '../types';

interface UserProfileProps {
  user: UserType;
  isCreating?: boolean;
  onBack: () => void;
  onUpdate?: (updatedUser: UserType) => void;
}

const SectionCard: React.FC<{ 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  action?: React.ReactNode;
}> = ({ title, icon: Icon, children, defaultOpen = true, action }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div 
        className="p-5 border-b border-slate-50 flex items-center justify-between cursor-pointer bg-slate-50/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400">
             <Icon size={18} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
            {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
            {isOpen ? <ChevronUp size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-slate-300" />}
        </div>
      </div>
      {isOpen && (
        <div className="p-6 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string | number | React.ReactNode;
  fullWidth?: boolean;
  editing?: boolean;
  fieldKey?: string;
  fieldType?: 'text' | 'email' | 'date' | 'select';
  options?: string[];
  onChange?: (key: string, value: string) => void;
}> = ({ label, value, fullWidth, editing, fieldKey, fieldType = 'text', options, onChange }) => (
  <div className={`p-3.5 rounded-xl border transition-colors group ${fullWidth ? 'col-span-full' : ''} ${editing ? 'bg-white border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-amber-200'}`}>
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 group-hover:text-amber-500 transition-colors">{label}</label>
    {editing && fieldKey && onChange ? (
      fieldType === 'select' && options ? (
        <select
          className="w-full bg-transparent font-bold text-slate-700 text-sm outline-none border-b border-amber-300 pb-0.5 cursor-pointer"
          value={(value as string) || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
        >
          <option value="">---</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={fieldType}
          className="w-full bg-transparent font-bold text-slate-700 text-sm outline-none border-b border-amber-300 pb-0.5"
          value={(value as string) || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      )
    ) : (
      <div className="font-bold text-slate-700 text-sm truncate">{value || '---'}</div>
    )}
  </div>
);

const UserProfile: React.FC<UserProfileProps> = ({ user, isCreating = false, onBack, onUpdate }) => {
  const isActive = !isCreating && (user.user_active === true || user.user_active === 1);
  const [isEditing, setIsEditing] = useState(isCreating);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>(isCreating ? {
    user_name: '',
    user_name2: '',
    user_surname: '',
    user_surname2: '',
    user_personal_email: '',
    user_identification_type: '',
    user_identification: '',
    user_issued_in: '',
    user_sex: '',
    user_telephone: '',
    user_birthdate: '',
    user_address: '',
    user_rh: '',
    user_model_category: '',
    user_bank_entity: '',
    user_bank_account: '',
    user_bank_account_type: '',
    user_beneficiary_name: '',
    user_beneficiary_document: '',
    user_beneficiary_document_type: '',
    user_active: true,
    prof_id: '',
  } : {});
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<UserProfileData[]>([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [togglingContractId, setTogglingContractId] = useState<number | null>(null);

  useEffect(() => {
    if (isCreating) {
      ProfileService.getProfiles().then(res => {
        setProfiles(res.data?.data || []);
      }).catch(err => console.error('Error cargando perfiles:', err));
    }
  }, [isCreating]);

  const loadContracts = useCallback(async () => {
    if (isCreating) return;
    try {
      setLoadingContracts(true);
      const res = await ContractService.getUserContracts(user.user_id);
      setContracts(res.data?.data || []);
    } catch (err) {
      console.error('Error cargando contratos:', err);
    } finally {
      setLoadingContracts(false);
    }
  }, [user.user_id, isCreating]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setIsContractModalOpen(true);
  };

  const handleToggleContractActive = async (contract: any) => {
    try {
      setTogglingContractId(contract.stdmod_id);
      if (contract.stdmod_active) {
        await ContractService.deactivateContract(contract.stdmod_id);
      } else {
        await ContractService.editContract(contract.stdmod_id, {
          std_id: contract.studio?.std_id ?? contract.std_id,
          stdroom_id: contract.studio_room?.stdroom_id ?? contract.stdroom_id ?? '',
          user_id_model: user.user_id,
          stdmod_start_at: contract.stdmod_start_at ?? '',
          stdmod_finish_at: contract.stdmod_finish_at ?? '',
          stdmod_active: true,
          stdmod_percent: contract.stdmod_percent != null ? String(contract.stdmod_percent) : '',
          stdmod_rtefte: !!contract.stdmod_rtefte,
          stdshift_id: contract.studio_shift?.stdshift_id ?? contract.stdshift_id ?? '',
          stdmod_commission_type: contract.stdmod_commission_type ?? '',
          stdmod_goal: contract.stdmod_goal != null ? String(contract.stdmod_goal) : '',
          stdmod_contract_type: contract.stdmod_contract_type ?? '',
          stdmod_position: contract.stdmod_position ?? '',
          stdmod_area: contract.stdmod_area ?? '',
          city_id: contract.city_id ?? '',
        });
      }
      await loadContracts();
    } catch (err) {
      console.error('Error cambiando estado del contrato:', err);
    } finally {
      setTogglingContractId(null);
    }
  };

  const startEditing = () => {
    setFormData({
      user_name: user.user_name ?? '',
      user_name2: user.user_name2 ?? '',
      user_surname: user.user_surname ?? '',
      user_surname2: user.user_surname2 ?? '',
      user_personal_email: user.user_personal_email ?? '',
      user_identification_type: user.user_identification_type ?? '',
      user_identification: user.user_identification ?? '',
      user_issued_in: user.user_issued_in ?? '',
      user_sex: user.user_sex ?? '',
      user_telephone: user.user_telephone ?? '',
      user_birthdate: user.user_birthdate ?? '',
      user_address: user.user_address ?? '',
      user_rh: user.user_rh ?? '',
      user_model_category: user.user_model_category ?? '',
      // Datos bancarios
      user_bank_entity: user.user_bank_entity ?? '',
      user_bank_account: user.user_bank_account ?? '',
      user_bank_account_type: user.user_bank_account_type ?? '',
      user_beneficiary_name: user.user_beneficiary_name ?? '',
      user_beneficiary_document: user.user_beneficiary_document ?? '',
      user_beneficiary_document_type: user.user_beneficiary_document_type ?? '',
      // Estado
      user_active: user.user_active === true || user.user_active === 1,
    });
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormData({});
    setError(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (isCreating) {
        // Validar campos requeridos
        if (!formData.user_name?.trim()) {
          setError('El nombre es requerido');
          setIsSaving(false);
          return;
        }
        if (!formData.user_identification?.trim()) {
          setError('La identificación es requerida');
          setIsSaving(false);
          return;
        }
        if (!formData.prof_id) {
          setError('El perfil es requerido');
          setIsSaving(false);
          return;
        }

        const createPayload = {
          user_identification: formData.user_identification ?? '',
          user_name: formData.user_name ?? '',
          prof_id: Number(formData.prof_id),
          user_identification_type: formData.user_identification_type ?? '',
          user_issued_in: formData.user_issued_in ?? '',
          user_name2: formData.user_name2 ?? '',
          user_surname: formData.user_surname ?? '',
          user_surname2: formData.user_surname2 ?? '',
          user_telephone: formData.user_telephone ?? '',
          user_birthdate: formData.user_birthdate ?? '',
          user_address: formData.user_address ?? '',
          user_sex: formData.user_sex ?? '',
          user_bank_entity: formData.user_bank_entity ?? '',
          user_bank_account: formData.user_bank_account ?? '',
          user_bank_account_type: formData.user_bank_account_type ?? '',
          user_active: formData.user_active ?? true,
          user_beneficiary_name: formData.user_beneficiary_name ?? '',
          user_beneficiary_document: formData.user_beneficiary_document ?? '',
          user_beneficiary_document_type: formData.user_beneficiary_document_type ?? '',
          user_rh: formData.user_rh ?? '',
          user_model_category: formData.user_model_category ?? '',
          user_personal_email: formData.user_personal_email ?? '',
          additional_models: [],
          users_coincidences: [],
          users_coincidences_observation: '',
        };

        const response = await UserService.createUser(createPayload);
        const newUserId = response.data?.data?.user_id;

        if (newUserId) {
          const newUserResponse = await UserService.getUser(newUserId);
          if (newUserResponse.data?.data?.[0]) {
            onUpdate?.(newUserResponse.data.data[0]);
          }
        }
        return;
      }

      // Preparar datos para el API (mismo formato que legacy)
      const payload = {
        id: user.user_id,
        user_name: formData.user_name ?? '',
        user_name2: formData.user_name2 ?? '',
        user_surname: formData.user_surname ?? '',
        user_surname2: formData.user_surname2 ?? '',
        user_personal_email: formData.user_personal_email ?? '',
        user_identification_type: formData.user_identification_type ?? '',
        user_identification: formData.user_identification ?? '',
        user_issued_in: formData.user_issued_in ?? '',
        user_sex: formData.user_sex ?? '',
        user_telephone: formData.user_telephone ?? '',
        user_birthdate: formData.user_birthdate ?? '',
        user_address: formData.user_address ?? '',
        user_rh: formData.user_rh ?? '',
        user_model_category: formData.user_model_category ?? '',
        // Datos bancarios
        user_bank_entity: formData.user_bank_entity ?? '',
        user_bank_account: formData.user_bank_account ?? '',
        user_bank_account_type: formData.user_bank_account_type ?? '',
        user_beneficiary_name: formData.user_beneficiary_name ?? '',
        user_beneficiary_document: formData.user_beneficiary_document ?? '',
        user_beneficiary_document_type: formData.user_beneficiary_document_type ?? '',
        // Mantener otros campos que no se editan aquí
        prof_id: user.prof_id,
        user_email: user.user_email,
        user_active: formData.user_active,
        city_id: user.city?.city_id,
        // Campos vacíos pero requeridos por el backend
        additional_models: [],
        additional_models_todelete: [],
        users_coincidences: [],
        users_coincidences_observation: '',
      };

      const response = await UserService.editUser(payload);

      // Actualizar usuario en el padre
      if (response.data?.data) {
        // Recargar datos completos del usuario
        const updatedUserResponse = await UserService.getUser(user.user_id);
        if (updatedUserResponse.data?.data?.[0]) {
          onUpdate?.(updatedUserResponse.data.data[0]);
        }
      }

      setIsEditing(false);
      setFormData({});
    } catch (err: any) {
      console.error('Error al guardar usuario:', err);
      const msg = err.response?.data?.message || 'Error al guardar los cambios';
      if (err.response?.data?.code === 'USER_ALREADY_EXISTS') {
        setError('Ya existe un usuario registrado con este email');
      } else {
        setError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const val = (key: string) => isEditing ? formData[key] : (user as any)[key];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {isCreating ? 'Nuevo Usuario' : (
                <>
                  {user.user_name} {user.user_name2 || ''} {user.user_surname} {user.user_surname2 || ''}
                  {isActive && <CheckCircle2 size={20} className="text-emerald-500" />}
                </>
              )}
            </h1>
            {!isCreating && (
              <p className="text-xs text-slate-500 font-medium mt-1">
                 ID: <span className="font-mono text-slate-600">{user.user_identification}</span> • Perfil: {user.profile?.prof_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
            {isEditing && !isCreating ? (
              <button
                type="button"
                onClick={() => handleChange('user_active', !formData.user_active)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border cursor-pointer transition-all ${formData.user_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
              >
                {formData.user_active ? 'Activo' : 'Inactivo'}
              </button>
            ) : !isCreating ? (
              <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {isActive ? 'Usuario Activo' : 'Usuario Inactivo'}
              </span>
            ) : null}
            {isEditing ? (
              <>
                <button
                  onClick={isCreating ? onBack : cancelEditing}
                  disabled={isSaving}
                  className="px-5 py-2 bg-white border border-slate-300 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={14} /> CANCELAR
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="px-5 py-2 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
              >
                <Pencil size={14} /> EDITAR PERFIL
              </button>
            )}
        </div>
      </div>

      <div className={`grid gap-6 ${isCreating ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-3'}`}>
        
        {/* Left Column: Personal Info & Image */}
        <div className="space-y-6 xl:col-span-2">
            
            {/* 1. Datos Básicos */}
            <SectionCard title="Datos Básicos" icon={User}>
                {isEditing && (
                  <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-700 flex items-center gap-2">
                    <Pencil size={12} /> Modo edici&oacute;n activo &mdash; modifica los campos y pulsa GUARDAR
                  </div>
                )}
                {error && (
                  <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 flex items-center gap-2">
                    <AlertCircle size={12} /> {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isCreating ? (
                      <div className="col-span-full p-3.5 rounded-xl border bg-white border-amber-200 shadow-sm">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Perfil *</label>
                        <select
                          className="w-full bg-transparent font-bold text-slate-700 text-sm outline-none border-b border-amber-300 pb-0.5 cursor-pointer"
                          value={formData.prof_id || ''}
                          onChange={e => handleChange('prof_id', e.target.value)}
                        >
                          <option value="">Seleccionar perfil...</option>
                          {profiles.map(p => <option key={p.prof_id} value={p.prof_id}>{p.prof_name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <Field label="Perfil" value={user.profile?.prof_name} fullWidth />
                    )}
                    <Field label="Nombre" value={val('user_name')} editing={isEditing} fieldKey="user_name" onChange={handleChange} />
                    <Field label="Segundo Nombre" value={val('user_name2')} editing={isEditing} fieldKey="user_name2" onChange={handleChange} />
                    <Field label="Apellido" value={val('user_surname')} editing={isEditing} fieldKey="user_surname" onChange={handleChange} />
                    <Field label="Segundo Apellido" value={val('user_surname2')} editing={isEditing} fieldKey="user_surname2" onChange={handleChange} />
                    <Field label="Email Personal" value={val('user_personal_email')} editing={isEditing} fieldKey="user_personal_email" fieldType="email" onChange={handleChange} />
                    <Field label="Tipo Identificación" value={val('user_identification_type')} editing={isEditing} fieldKey="user_identification_type" fieldType="select" options={['CEDULA DE CIUDADANÍA', 'CEDULA DE EXTRANJERÍA', 'PASAPORTE', 'NIT', 'PEP']} onChange={handleChange} />
                    <Field label="Identificación" value={val('user_identification')} editing={isEditing} fieldKey="user_identification" onChange={handleChange} />
                    <Field label="Lugar de Expedición" value={val('user_issued_in')} editing={isEditing} fieldKey="user_issued_in" onChange={handleChange} />
                    <Field label="Sexo" value={val('user_sex')} editing={isEditing} fieldKey="user_sex" fieldType="select" options={['MASCULINO', 'FEMENINO', 'OTRO']} onChange={handleChange} />
                    <Field label="Teléfono" value={val('user_telephone')} editing={isEditing} fieldKey="user_telephone" onChange={handleChange} />
                    <Field label="Fecha Nacimiento" value={val('user_birthdate')} editing={isEditing} fieldKey="user_birthdate" fieldType="date" onChange={handleChange} />
                    <Field label="Dirección" value={val('user_address')} editing={isEditing} fieldKey="user_address" onChange={handleChange} fullWidth />
                    {!isCreating && <Field label="País" value={user.city?.department?.country?.country_name} />}
                    {!isCreating && <Field label="Departamento" value={user.city?.department?.dpto_name} />}
                    {!isCreating && <Field label="Ciudad" value={user.city?.city_name} />}
                    <Field label="RH" value={val('user_rh')} editing={isEditing} fieldKey="user_rh" fieldType="select" options={['A +', 'A -', 'B +', 'B -', 'AB +', 'AB -', 'O +', 'O -']} onChange={handleChange} />
                    <Field label="Categoría" value={val('user_model_category')} editing={isEditing} fieldKey="user_model_category" fieldType="select" options={['HETEROSEXUAL', 'HOMOSEXUAL', 'TRANSEXUAL', 'PAREJA']} onChange={handleChange} />
                </div>
            </SectionCard>

             {/* 2. Datos Bancarios */}
             <SectionCard title="Datos Bancarios" icon={CreditCard} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Banco" value={val('user_bank_entity')} editing={isEditing} fieldKey="user_bank_entity" fieldType="select" options={['BANCO DE BOGOTA', 'BANCO POPULAR', 'BANCOLOMBIA', 'BANCO BBVA', 'COLPATRIA', 'BANCO DE OCCIDENTE', 'BANCO CAJA SOCIAL', 'BANCO DAVIVIENDA', 'BANCO AV VILLAS', 'BANCOOMEVA', 'SCOTIABANK', 'NEQUI']} onChange={handleChange} />
                    <Field label="Nro. de Cuenta" value={val('user_bank_account')} editing={isEditing} fieldKey="user_bank_account" onChange={handleChange} />
                    <Field label="Tipo de Cuenta" value={val('user_bank_account_type')} editing={isEditing} fieldKey="user_bank_account_type" fieldType="select" options={['CORRIENTE', 'AHORRO']} onChange={handleChange} />
                    <Field label="Nombre del Beneficiario" value={val('user_beneficiary_name')} editing={isEditing} fieldKey="user_beneficiary_name" onChange={handleChange} />
                    <Field label="Nro. Documento Beneficiario" value={val('user_beneficiary_document')} editing={isEditing} fieldKey="user_beneficiary_document" onChange={handleChange} />
                    <Field label="Tipo ID Beneficiario" value={val('user_beneficiary_document_type')} editing={isEditing} fieldKey="user_beneficiary_document_type" fieldType="select" options={['CEDULA CUIDADANIA', 'CEDULA EXTRANJERIA', 'PASAPORTE', 'NIT', 'PPT']} onChange={handleChange} />
                </div>
            </SectionCard>

            {/* 3. Contratos */}
            {!isCreating && <SectionCard
                title="Contratos"
                icon={Shield}
                action={
                    <button
                        onClick={() => { setEditingContract(null); setIsContractModalOpen(true); }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Crear Contrato"
                    >
                        <Plus size={18} />
                    </button>
                }
            >
                {loadingContracts ? (
                  <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                    <Loader2 size={16} className="animate-spin" /> Cargando contratos...
                  </div>
                ) : contracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
                    <AlertCircle size={24} className="mb-2 opacity-20" />
                    Sin contratos registrados
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="p-3">Nro</th>
                          <th className="p-3">Estudio</th>
                          <th className="p-3">Cuarto</th>
                          <th className="p-3">Turno</th>
                          <th className="p-3">Inicio</th>
                          <th className="p-3">Fin</th>
                          <th className="p-3">Activo</th>
                          <th className="p-3">% Ingreso</th>
                          <th className="p-3">Rte.Fte</th>
                          <th className="p-3">Tipo Comisión</th>
                          <th className="p-3">Meta</th>
                          <th className="p-3">Creado</th>
                          <th className="p-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {contracts.map((c: any) => (
                          <tr key={c.stdmod_id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-mono text-slate-500">{c.stdmod_contract_number || '---'}</td>
                            <td className="p-3 font-bold text-slate-700">{c.studio?.std_name || '---'}</td>
                            <td className="p-3 text-slate-600">{c.studio_room?.stdroom_name || '---'}</td>
                            <td className="p-3 text-slate-600">{c.studio_shift?.stdshift_name || '---'}</td>
                            <td className="p-3 text-slate-600">{c.stdmod_start_at || '---'}</td>
                            <td className="p-3 text-slate-600">{c.stdmod_finish_at || '---'}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.stdmod_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                {c.stdmod_active ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-700">{c.stdmod_percent ?? '---'}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${c.stdmod_rtefte ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                {c.stdmod_rtefte ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{c.stdmod_commission_type || '---'}</td>
                            <td className="p-3 text-slate-600">{c.stdmod_goal || '---'}</td>
                            <td className="p-3 text-slate-500">{c.created_at ? c.created_at.split(' ')[0] : '---'}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleEditContract(c)}
                                  className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                                  title="Editar contrato"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleContractActive(c)}
                                  disabled={togglingContractId === c.stdmod_id}
                                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${c.stdmod_active ? 'hover:bg-red-50 text-slate-400 hover:text-red-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500'}`}
                                  title={c.stdmod_active ? 'Desactivar contrato' : 'Activar contrato'}
                                >
                                  {togglingContractId === c.stdmod_id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </SectionCard>}

            {/* 4. Transacciones */}
            {!isCreating && (
              <TransactionsSection userId={user.user_id} isModel={user.profile?.prof_name?.toUpperCase().includes('MODELO') || false} />
            )}

            {/* 5. Streams */}
            {!isCreating && (
              <StreamsSection userId={user.user_id} />
            )}

        </div>

        {/* Right Column: Profile Image, Companion, Multimedia */}
        {!isCreating && (
        <div className="space-y-6">

            {/* Profile Image Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="relative mb-4 group">
                    <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-slate-200">
                        <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-100">
                             {user.image
                                ? <img src={user.image} className="w-full h-full object-cover" alt="User" />
                                : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-300">
                                    {user.user_name?.[0]}{user.user_surname?.[0]}
                                  </div>
                             }
                        </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white"></div>
                </div>
                <h2 className="text-lg font-black text-slate-900">{user.user_name} {user.user_name2 || ''} {user.user_surname} {user.user_surname2 || ''}</h2>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4">{user.profile?.prof_name}</p>

                <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] font-black text-slate-400 uppercase">Edad</span>
                        <span className="font-bold text-slate-700">{user.user_age || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] font-black text-slate-400 uppercase">Registro</span>
                        <span className="font-bold text-slate-700">{user.created_at ? user.created_at.split(' ')[0] : '---'}</span>
                    </div>
                </div>
            </div>

            {/* Documentos */}
            <SectionCard title="Documentos" icon={FileText} defaultOpen={false}>
              <DocumentsSection userId={user.user_id} userName={`${user.user_name} ${user.user_name2 ?? ''} ${user.user_surname} ${user.user_surname2 ?? ''}`.trim()} />
            </SectionCard>

             {/* Multimedia */}
            <SectionCard title="Multimedia" icon={Image} defaultOpen={false}>
              <MultimediaSection userId={user.user_id} />
            </SectionCard>

        </div>
        )}
      </div>

      {!isCreating && (
      <CreateContractModal
        isOpen={isContractModalOpen}
        onClose={() => { setIsContractModalOpen(false); setEditingContract(null); }}
        userId={user.user_id}
        userName={`${user.user_name} ${user.user_name2 ?? ''} ${user.user_surname} ${user.user_surname2 ?? ''}`.trim()}
        contract={editingContract}
        onSaved={() => {
          setIsContractModalOpen(false);
          setEditingContract(null);
          loadContracts();
          UserService.getUser(user.user_id).then(res => {
            if (res.data?.data?.[0]) onUpdate?.(res.data.data[0]);
          });
        }}
      />
      )}
    </div>
  );
};

export default UserProfile;
