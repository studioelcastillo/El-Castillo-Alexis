
import axios from 'axios';
import { StudioApiResponse, Studio } from './types';
import { getStoredUser } from './session';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://el-castillo-api.bygeckode.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config) => {
  const user = getStoredUser();
  const accessToken = user?.access_token;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
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
