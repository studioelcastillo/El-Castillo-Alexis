
import { api } from './api';
import { getStoredUser } from './session';

// ==================== TYPES ====================

export interface ContractPayload {
  std_id: number | string;
  stdroom_id?: number | string;
  user_id_model: number | string;
  stdmod_start_at: string;
  stdmod_finish_at: string;
  stdmod_active: boolean;
  stdmod_percent: string;
  stdmod_rtefte: boolean;
  stdshift_id?: number | string;
  stdmod_commission_type: string;
  stdmod_goal: string;
  stdmod_contract_type: string;
  stdmod_position?: string;
  stdmod_area?: string;
  city_id?: number | string;
  // Payroll fields
  stdmod_monthly_salary?: number | string | null;
  stdmod_biweekly_salary?: number | string | null;
  stdmod_daily_salary?: number | string | null;
  stdmod_dotacion_amount?: number | string | null;
  stdmod_has_sena?: boolean;
  stdmod_has_caja_compensacion?: boolean;
  stdmod_has_icbf?: boolean;
  stdmod_arl_risk_level?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

// ==================== CONSTANTS ====================

export const CONTRACT_TYPES = [
  'APRENDIZAJE',
  'CIVIL POR PRESTACIÓN DE SERVICIOS',
  'MANDANTE - MODELO',
  'OBRA O LABOR',
  'OCASIONAL DE TRABAJO',
  'TERMINO FIJO',
  'TERMINO INDEFINIDO',
];

export const COMMISSION_TYPES = ['', 'PRESENCIAL', 'SATELITE', 'FIJO'];

export const ARL_RISK_LEVELS = [
  { value: 'I', label: 'Clase I (0.522%)' },
  { value: 'II', label: 'Clase II (1.044%)' },
  { value: 'III', label: 'Clase III (2.436%)' },
  { value: 'IV', label: 'Clase IV (4.350%)' },
  { value: 'V', label: 'Clase V (6.960%)' },
];

// ==================== SERVICE ====================

const ContractService = {
  // --- Studios ---
  getStudios: () => {
    return api.get('/studios?std_active=true');
  },

  // --- Studio Rooms (filtered by studio) ---
  getStudioRooms: (studioId: number | string) => {
    return api.get(`/studios_rooms?std_id=${studioId}`);
  },

  // --- Studio Shifts (filtered by studio) ---
  getStudioShifts: (studioId: number | string) => {
    return api.get(`/studios_shifts?std_id=${studioId}`);
  },

  // --- Location cascade ---
  getCountries: () => {
    return api.get('/countries');
  },

  getDepartments: (countryId: number | string) => {
    return api.get(`/departments/${countryId}`);
  },

  getCities: (departmentId: number | string) => {
    return api.get(`/cities/${departmentId}`);
  },

  // --- CRUD Contracts (studios_models) ---
  addContract: (data: ContractPayload) => {
    return api.post('/studios_models', data);
  },

  editContract: (id: number | string, data: ContractPayload) => {
    return api.put(`/studios_models/${id}`, data);
  },

  getContract: (id: number | string) => {
    return api.get(`/studios_models?stdmod_id=${id}`);
  },

  getUserContracts: (userId: number | string) => {
    return api.get(`/studios_models?parentfield=user_id_model&parentid=${userId}`);
  },

  // --- Activate / Deactivate (dedicated routes) ---
  activateContract: (id: number | string) => {
    return api.put(`/studios_models/active/${id}`);
  },

  deactivateContract: (id: number | string) => {
    return api.put(`/studios_models/inactive/${id}`);
  },

  // --- Documents (PDF download URL) ---
  getDocumentUrl: (contractId: number | string, type: string): string => {
    const token = getStoredUser()?.access_token || '';
    return `${api.defaults.baseURL}/studios_models/pdf/${type}/${contractId}?access_token=${token}&type=${type}`;
  },

  // --- Model Accounts ---
  getAccounts: (contractId: number | string) => {
    return api.get(`/models_accounts?stdmod_id=${contractId}`);
  },

  addAccount: (data: any) => {
    return api.post('/models_accounts', data);
  },

  editAccount: (id: number | string, data: any) => {
    return api.put(`/models_accounts/${id}`, data);
  },

  deleteAccount: (id: number | string) => {
    return api.delete(`/models_accounts/${id}`);
  },

  activateAccount: (id: number | string) => {
    return api.put(`/models_accounts/active/${id}`);
  },

  deactivateAccount: (id: number | string) => {
    return api.put(`/models_accounts/inactive/${id}`);
  },

  // --- Model Goals ---
  getGoals: (contractId: number | string) => {
    return api.get(`/models_goals?stdmod_id=${contractId}`);
  },

  addGoal: (data: any) => {
    return api.post('/models_goals', data);
  },

  editGoal: (id: number | string, data: any) => {
    return api.put(`/models_goals/${id}`, data);
  },

  deleteGoal: (id: number | string) => {
    return api.delete(`/models_goals/${id}`);
  },

  // --- Payments ---
  getPayments: (contractId: number | string) => {
    return api.get(`/payments?stdmod_id=${contractId}`);
  },
};

export const PLATFORM_OPTIONS = [
  'LIVEJASMIN', 'XLOVECAM', 'BONGACAMS', 'CAM4', 'CAMSODA',
  'CHATURBATE', 'FLIRT4FREE', 'IMLIVE', 'MYDIRTYHOBY',
  'MYFREECAMS', 'ONLYFANS', 'SKYPRIVATE', 'STREAMATE',
  'STREAMRAY', 'STRIPCHAT', 'XHAMSTER',
];

export const DOCUMENT_TYPES = [
  { type: 'contract', label: 'Contrato', color: 'blue' },
  { type: 'certification', label: 'Certificacion', color: 'red' },
  { type: 'bank_letter', label: 'Carta Banco', color: 'teal' },
  { type: 'code_conduct', label: 'Codigo de Conducta', color: 'orange' },
  { type: 'habeas_data', label: 'Habeas Data', color: 'purple' },
];

export default ContractService;
