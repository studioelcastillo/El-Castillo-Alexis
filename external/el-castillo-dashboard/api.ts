
import axios from 'axios';
import { StudioApiResponse, Studio } from './types';

const API_BASE_URL = 'https://el-castillo-api.bygeckode.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const { access_token } = JSON.parse(userStr);
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
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
