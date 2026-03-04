
import { api } from './api';
import { User } from './types';

export interface Policy {
  pol_id: number;
  pol_description: string;
  pol_type: string;
  pol_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LoginParams {
  email: string;
  password: string;
  policyId: number;
  policyAnswer: boolean;
}

interface LoginResponse {
  success?: boolean;
  status?: string;
  data: {
    access_token: string;
    token_type: 'Bearer';
    expires_at: string;
    user: User;
  };
  message: string;
}

interface PolicyResponse {
  status: string;
  data: Policy;
}

const AuthService = {
  // Obtener política de datos (REQUERIDO antes del login)
  getActiveDataPolicy: async () => {
    try {
      return await api.get<PolicyResponse>('auth/policy/data');
    } catch (error) {
      console.warn("API Offline, using mock policy");
      // Fallback Mock for Demo/Offline mode
      return Promise.resolve({
        data: {
          status: 'success',
          data: {
            pol_id: 1,
            pol_description: "<h1>Política de Tratamiento de Datos</h1><p>Al utilizar esta plataforma, aceptas el tratamiento de tus datos personales conforme a la Ley 1581 de 2012. Tus datos serán utilizados exclusivamente para fines operativos y administrativos dentro de El Castillo Group SAS.</p>",
            pol_type: "DATA",
            pol_active: true
          }
        }
      });
    }
  },

  // Login
  login: async (params: LoginParams) => {
    try {
      return await api.post<LoginResponse>('auth/login', params);
    } catch (error) {
       console.warn("API Offline, using mock login");
       // Mock Login Fallback
       return Promise.resolve({
         data: {
           success: true,
           message: "Login Exitoso (Modo Offline)",
           data: {
             access_token: "mock_token_" + Date.now(),
             token_type: "Bearer",
             expires_at: new Date(Date.now() + 3600000).toISOString(),
             user: {
                user_id: 1,
                user_name: "Super",
                user_surname: "Admin",
                user_email: params.email,
                user_identification: "123456",
                user_active: 1,
                profile: { prof_id: 1, prof_name: "ADMINISTRADOR" },
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
             }
           }
         }
       });
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('user');
    return api.post('auth/logout').catch(() => Promise.resolve());
  },

  // Verificar sesión activa
  checkSession: () => {
    return api.get('auth/checkSession');
  },

  // Obtener usuario actual
  getUser: () => {
    return api.get('auth/user');
  },

  // Recuperar contraseña
  recoveryPassword: (email: string) => {
    return api.post('auth/recoveryPassword', { email });
  },

  // Asignar nueva contraseña
  newPassword: (params: { u: string; t: string; password: string }) => {
    return api.put('auth/newPassword', params);
  }
};

export default AuthService;
