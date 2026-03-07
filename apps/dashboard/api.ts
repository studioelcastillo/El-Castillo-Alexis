
import axios from 'axios';
import { StudioApiResponse, Studio } from './types';
import { supabase } from './supabaseClient';
import { getStoredUser } from './session';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const studioId = getStoredUser()?.std_id;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (studioId) {
      config.headers['X-Studio-Id'] = String(studioId);

      const method = String(config.method || 'get').toLowerCase();
      if (method === 'get' || method === 'delete') {
        const params = new URLSearchParams((config.params || {}) as Record<string, string>);
        if (!params.has('std_id')) {
          params.set('std_id', String(studioId));
        }
        config.params = Object.fromEntries(params.entries());
      }
    }
  } catch (error) {
    // ignore token injection errors
  }
  return config;
});

// Servicio de estudios (actualizado para usar la nueva instancia de api)

export const studioService = {
  getAll: () => {
    return api.get<{ status: string; data: StudioApiResponse[] }>('/studios');
  },
  getById: async (id: string): Promise<Studio> => {
    const response = await api.get(`/studios/${id}`);
    return response.data;
  },
  update: async (id: string, data: Partial<Studio>): Promise<Studio> => {
    const response = await api.patch(`/studios/${id}`, data);
    return response.data;
  },
  create: async (data: Omit<Studio, 'id'>): Promise<Studio> => {
    const response = await api.post('/studios', data);
    return response.data;
  }
};
