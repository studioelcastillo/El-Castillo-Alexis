
import { api } from './api';
import { LocationCountry, LocationDepartment, LocationCity } from './types';

interface LocationsResponse {
  status: string;
  data: LocationCountry[];
}

interface LocationActionResponse {
  status: string;
  message?: string;
}

const LocationService = {
  // Obtener todas las localizaciones (países con departamentos y ciudades)
  getLocations: () => {
    return api.get<LocationsResponse>('/locations');
  },

  // Países (Countries)
  addCountry: (data: { country_name: string }) => {
    return api.post<LocationActionResponse>('/locations/country', data);
  },

  editCountry: (data: { id: number; country_name: string }) => {
    const { id, ...payload } = data;
    return api.put<LocationActionResponse>(`/locations/country/${id}`, payload);
  },

  delCountry: (data: { id: number }) => {
    return api.delete<LocationActionResponse>(`/locations/country/${data.id}`);
  },

  // Departamentos (Departments/States)
  addDepartment: (data: { country_id: number; dpto_name: string }) => {
    return api.post<LocationActionResponse>('/locations/department', data);
  },

  editDepartment: (data: { id: number; dpto_name: string }) => {
    const { id, ...payload } = data;
    return api.put<LocationActionResponse>(`/locations/department/${id}`, payload);
  },

  delDepartment: (data: { id: number }) => {
    return api.delete<LocationActionResponse>(`/locations/department/${data.id}`);
  },

  // Ciudades (Cities)
  addCity: (data: { dpto_id: number; city_name: string }) => {
    return api.post<LocationActionResponse>('/locations/city', data);
  },

  editCity: (data: { id: number; city_name: string }) => {
    const { id, ...payload } = data;
    return api.put<LocationActionResponse>(`/locations/city/${id}`, payload);
  },

  delCity: (data: { id: number }) => {
    return api.delete<LocationActionResponse>(`/locations/city/${data.id}`);
  }
};

export default LocationService;
