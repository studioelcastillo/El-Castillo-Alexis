
import { api } from './api';
import { getStoredUser } from './session';

// ==================== TYPES ====================

export interface StreamPayload {
  modacc_id: number | string;
  modstr_date: string;
  modstr_period?: string;
  modstr_earnings_tokens?: number | string | null;
  modstr_earnings_usd?: number | string | null;
  modstr_earnings_eur?: number | string | null;
}

export interface StreamTotals {
  tokens: number;
  usd: number;
  eur: number;
  cop: number;
}

// ==================== SERVICE ====================

const StreamService = {
  // --- List by model/user ---
  getStreamsByModel: (userId: number | string) => {
    return api.get(`/models_streams/model?user_id=${userId}`);
  },

  getStreams: (query: string) => {
    return api.get(`/models_streams?${query}`);
  },

  getStream: (id: number | string) => {
    return api.get(`/models_streams?modstr_id=${id}`);
  },

  addStream: (data: StreamPayload) => {
    return api.post('/models_streams', data);
  },

  editStream: (id: number | string, data: StreamPayload) => {
    return api.put(`/models_streams/${id}`, data);
  },

  deleteStream: (id: number | string) => {
    return api.delete(`/models_streams/${id}`);
  },

  // --- Model accounts for dropdown (by user) ---
  getModelAccountsByUser: (userId: number | string) => {
    return api.get(`/models_accounts/model?user_id=${userId}`);
  },

  // --- Export Excel URL ---
  getExportUrl: (userId: number | string): string => {
    const token = getStoredUser()?.access_token || '';
    return `${api.defaults.baseURL}/models_streams/export?access_token=${token}&user_id=${userId}`;
  },
};

export default StreamService;
