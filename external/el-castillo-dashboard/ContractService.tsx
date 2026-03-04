
import { api } from './api';

export interface SelectOption {
  label: string;
  value: string | number;
}

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
}

const ContractService = {
  // --- Studios ---
  getStudios: () => {
    return api.get('/studios?std_active=true');
  },

  // --- Studio Rooms (por estudio) ---
  getStudioRooms: (studioId: number | string) => {
    return api.get(`/studios_rooms?std_id=${studioId}`);
  },

  // --- Studio Shifts (por estudio) ---
  getStudioShifts: (studioId: number | string) => {
    return api.get(`/studios_shifts?std_id=${studioId}`);
  },

  // --- Ubicación (cascada) ---
  getCountries: () => {
    return api.get('/countries');
  },

  getDepartments: (countryId: number | string) => {
    return api.get(`/departments/${countryId}`);
  },

  getCities: (departmentId: number | string) => {
    return api.get(`/cities/${departmentId}`);
  },

  // --- CRUD Contratos (studios_models) ---
  addContract: (data: ContractPayload) => {
    return api.post('/studios_models', data);
  },

  editContract: (id: number | string, data: ContractPayload) => {
    return api.put(`/studios_models/${id}`, data);
  },

  deactivateContract: (id: number | string) => {
    return api.put(`/studios_models/inactive/${id}`);
  },

  getContract: (id: number | string) => {
    return api.get(`/studios_models?stdmod_id=${id}`);
  },

  getUserContracts: (userId: number | string) => {
    return api.get(`/studios_models?parentfield=user_id_model&parentid=${userId}`);
  },
};

export default ContractService;
