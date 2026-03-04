
import { api } from './api';

export interface UsersDatatableParams {
  start: number;
  length: number;
  sortby?: string;
  dir?: 'ASC' | 'DESC';
  filter?: string;
  columns?: string;
  studios?: string;
  profiles?: string;
  activeusers?: string; // 'true' | 'false' (compatible con Vue legacy)
}

export interface CreateUserParams {
  user_identification: string;
  user_name: string;
  prof_id: number;
  user_identification_type?: string;
  user_issued_in?: string;
  user_name2?: string;
  user_surname?: string;
  user_surname2?: string;
  user_email?: string;
  user_telephone?: string;
  user_birthdate?: string;
  user_address?: string;
  user_sex?: string;
  user_bank_entity?: string;
  user_bank_account?: string;
  user_bank_account_type?: string;
  user_active?: boolean;
  user_beneficiary_name?: string;
  user_beneficiary_document?: string;
  user_beneficiary_document_type?: string;
  city_id?: number;
  user_rh?: string;
  user_model_category?: string;
  user_personal_email?: string;
  additional_models?: any[];
  users_coincidences?: any[];
  users_coincidences_observation?: string;
  other_permissions?: Record<string, any>;
}

export interface EditUserParams {
  id: number;
  user_identification?: string;
  user_identification_type?: string;
  user_issued_in?: string;
  user_name?: string;
  user_name2?: string;
  user_surname?: string;
  user_surname2?: string;
  user_email?: string;
  user_telephone?: string;
  user_birthdate?: string;
  user_address?: string;
  prof_id?: number;
  user_sex?: string;
  user_bank_entity?: string;
  user_bank_account?: string;
  user_bank_account_type?: string;
  user_active?: boolean;
  other_permissions?: Record<string, any>;
  user_beneficiary_name?: string;
  user_beneficiary_document?: string;
  user_beneficiary_document_type?: string;
  city_id?: number;
  user_rh?: string;
  user_model_category?: string;
  additional_models?: any[];
  additional_models_todelete?: any[];
  users_coincidences?: any[];
  users_coincidences_observation?: string;
  user_personal_email?: string;
}

export interface ModelsByOwnerStudioParams {
  search: string;
  profIds?: number[];
  ownerId?: number | string;
  userMutualStudiosId?: number | string;
}

const UserService = {
  getUsersDatatable: (params: UsersDatatableParams) => {
    // Convertimos los parámetros a URLSearchParams
    const query = new URLSearchParams();
    query.append('start', params.start.toString());
    query.append('length', params.length.toString());

    if (params.sortby) query.append('sortby', params.sortby);
    if (params.dir) query.append('dir', params.dir);
    if (params.filter) query.append('filter', params.filter);
    if (params.columns) query.append('columns', params.columns);
    if (params.studios) query.append('studios', params.studios);
    if (params.profiles) query.append('profiles', params.profiles);
    if (params.activeusers !== undefined && params.activeusers !== '') {
      query.append('activeusers', params.activeusers);
    }

    return api.get(`/users/datatable?${query.toString()}`);
  },

  getUser: (userId: number) => {
    return api.get(`/users?user_id=${userId}`);
  },

  editUser: (params: EditUserParams) => {
    const { id, ...data } = params;
    return api.put(`/users/${id}`, data);
  },

  createUser: (params: CreateUserParams) => {
    return api.post('/users', params);
  },

  uploadImage: (userId: number, formData: FormData) => {
    return api.post(`/users/image/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getModelsByOwnerStudio: (params: ModelsByOwnerStudioParams) => {
    const query = new URLSearchParams();
    query.append('searchterm', params.search || '');
    query.append('prof_ids', (params.profIds || [4, 5]).join(','));
    // Keep query shape exactly as legacy service string concat behavior.
    query.append('owner_id', String(params.ownerId));
    query.append('user_mutual_studios_id', String(params.userMutualStudiosId));

    return api.get(`/users/models/owner?${query.toString()}`);
  }
};

export default UserService;
