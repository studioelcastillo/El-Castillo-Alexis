
import AuthSupabaseService from "./services/supabase/AuthSupabaseService";
import { User } from "./types";
import { clearAuthSession } from "./utils/session";

export interface Policy {
  pol_id: number;
  pol_description: string;
  pol_type?: string | null;
  pol_active?: boolean | null;
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
    user: User;
  };
  message: string;
}

interface PolicyResponse {
  status: string;
  data: Policy;
}

const AuthService = {
  getActiveDataPolicy: async () => {
    const response = await AuthSupabaseService.getActiveDataPolicy();
    const policy = response?.data?.data;
    if (!policy) {
      throw new Error('Data policy not available');
    }
    return {
      data: {
        status: "success",
        data: {
          pol_id: policy.pol_id,
          pol_description: policy.pol_description,
          pol_type: policy.pol_type ?? null,
          pol_active: policy.pol_active ?? null,
        },
      },
    } as { data: PolicyResponse };
  },

  login: async (params: LoginParams) => {
    const response = await AuthSupabaseService.login(params);
    const payload = response?.data?.data;

    return {
      data: {
        success: true,
        status: "Success",
        message: "User logged",
        data: {
          user: payload?.user as User,
        },
      },
    } as { data: LoginResponse };
  },

  logout: async () => {
    clearAuthSession();
    await AuthSupabaseService.logout();
  },

  syncStoredSession: () => AuthSupabaseService.syncStoredSession(),

  getSession: () => AuthSupabaseService.getSession(),

  checkSession: () => AuthSupabaseService.checkSession(),

  getUser: () => AuthSupabaseService.getUser(),

  recoveryPassword: (email: string) =>
    AuthSupabaseService.recoveryPassword({ email }),

  newPassword: (params: { u: string; t: string; password: string }) =>
    AuthSupabaseService.newPassword({ password: params.password }),

  changePassword: (params: { password: string; oldPassword: string }) =>
    AuthSupabaseService.changePassword({ password: params.password, oldPassword: params.oldPassword }),
};

export default AuthService;
