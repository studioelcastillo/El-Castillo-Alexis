import { api } from './api';

export type PetitionStateValue = 'EN PROCESO' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type PetitionTypeValue = 'CREACI\u00d3N DE CUENTA' | 'REPORTE';

export interface PetitionDatatableParams {
  start: number;
  length: number;
  sortBy?: string;
  dir?: 'ASC' | 'DESC';
  filter?: string;
  states?: PetitionStateValue[];
  studios?: Array<number | string>;
  userId?: number | string;
  columns?: string[];
}

export interface CreatePetitionPayload {
  ptn_type: PetitionTypeValue;
  ptn_nick: string;
  ptn_password: string;
  ptn_page: string[];
  user_id: number | string;
  stdmod_id: number | string;
  ptnstate_observation?: string;
}

export interface CreatePetitionStatePayload {
  ptn_id: number | string;
  ptnstate_state: PetitionStateValue;
  ptnstate_observation?: string;
  ptn_nick_final?: string;
  ptn_mail?: string;
  ptn_password_final?: string;
  ptn_payment_pseudonym?: string;
  ptn_linkacc?: string;
}

const DEFAULT_COLUMNS = [
  'petitions.ptn_consecutive',
  'petitions.ptn_type',
  'petitions.ptn_nick_final',
  'petitions.ptn_page',
  'petitions.created_at',
  'petitions.updated_at'
];

const PetitionService = {
  getPetitions: (params: PetitionDatatableParams | string) => {
    if (typeof params === 'string') {
      return api.get(`/petitions?${params}`);
    }

    const query = new URLSearchParams();
    query.append('start', String(params.start));
    query.append('length', String(params.length));
    query.append('sortby', params.sortBy || 'petitions.updated_at');
    query.append('dir', params.dir || 'DESC');
    query.append('filter', params.filter || '');
    query.append('columns', (params.columns && params.columns.length > 0 ? params.columns : DEFAULT_COLUMNS).join(','));

    if (params.studios && params.studios.length > 0) {
      query.append('studios', params.studios.join(','));
    }
    if (params.userId !== undefined && params.userId !== null) {
      query.append('user_id', String(params.userId));
    }
    if (params.states && params.states.length > 0) {
      query.append('states', params.states.join(','));
    }

    return api.get(`/petitions?${query.toString()}`);
  },

  getPetition: (id: number | string) => {
    return api.get(`/petitions/dynamic/conditions?ptn_id=${id}`);
  },

  addPetition: (payload: CreatePetitionPayload) => {
    return api.post('/petitions', payload);
  },

  addPetitionState: (payload: CreatePetitionStatePayload) => {
    return api.post('/petition/state', payload);
  },

  deletePetition: (id: number | string) => {
    return api.delete(`/petitions/${id}`);
  },

  getAccountCreations: (userId: number | string) => {
    return api.get(`/petitions/account_creations?user_id=${userId}`);
  },

  checkModelStudio: (userId: number | string) => {
    return api.get(`/petitions/check_model_studio?user_id=${userId}`);
  },

  getStudiosModelsByModel: (userId: number | string) => {
    return api.get(`/petitions/studios_models?user_id=${userId}`);
  },

  getPreviousObservations: (search: string) => {
    return api.get(`/petitions/observations/previous?search=${encodeURIComponent(search)}`);
  }
};

export default PetitionService;
