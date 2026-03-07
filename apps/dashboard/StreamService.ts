
import { api } from './api';
import { getCurrentStudioId } from './tenant';

// ==================== TYPES ====================

export interface StreamPayload {
  modacc_id: number | string;
  std_id?: number | string;
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
    const params = new URLSearchParams({ user_id: String(userId) });
    const stdId = getCurrentStudioId();
    if (stdId) {
      params.set('std_id', String(stdId));
    }
    return api.get(`/models_streams/model?${params.toString()}`);
  },

  getStreams: (query: string) => {
    const params = new URLSearchParams(query);
    const stdId = getCurrentStudioId();
    if (stdId && !params.has('std_id')) {
      params.set('std_id', String(stdId));
    }
    return api.get(`/models_streams?${params.toString()}`);
  },

  getStream: (id: number | string) => {
    return api.get(`/models_streams?modstr_id=${id}`);
  },

  addStream: (data: StreamPayload) => {
    return api.post('/models_streams', {
      ...data,
      std_id: data.std_id || getCurrentStudioId() || undefined,
    });
  },

  editStream: (id: number | string, data: StreamPayload) => {
    return api.put(`/models_streams/${id}`, {
      ...data,
      std_id: data.std_id || getCurrentStudioId() || undefined,
    });
  },

  deleteStream: (id: number | string) => {
    return api.delete(`/models_streams/${id}`);
  },

  // --- Model accounts for dropdown (by user) ---
  getModelAccountsByUser: (userId: number | string) => {
    const params = new URLSearchParams({ user_id: String(userId) });
    const stdId = getCurrentStudioId();
    if (stdId) {
      params.set('std_id', String(stdId));
    }
    return api.get(`/models_accounts/model?${params.toString()}`);
  },

  // --- Export Excel URL ---
  downloadExport: (userId: number | string) => {
    return api.get('/models_streams/export', {
      params: { user_id: userId },
      responseType: 'blob',
    });
  },
};

export default StreamService;
