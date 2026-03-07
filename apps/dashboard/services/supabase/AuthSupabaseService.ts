import { supabase } from "../../supabaseClient";
import { buildAppUrl } from "../../utils/baseUrl";
import { setStoredUser } from "../../session";
import { clearAuthSession } from "../../utils/session";

type LoginParams = {
  email: string;
  password: string;
  policyId?: number;
  policyAnswer?: boolean;
};

const AuthSupabaseService = {
  async login({ email, password }: LoginParams) {
    let targetEmail = email;
    let userRecord: {
      user_email?: string;
      user_identification?: string | number | null;
      auth_user_id?: string | null;
    } | null = null;

    if (!email.includes("@")) {
      let userData: typeof userRecord = null;
      let userError: Error | null = null;

      try {
        const response = await fetch(
          `/__local/login-lookup?identifier=${encodeURIComponent(email)}`
        );

        if (response.ok) {
          const payload = await response.json();
          userData = payload?.data || null;
        }
      } catch {
        // ignore local lookup failures and fall back to direct query
      }

      if (!userData) {
        const directLookup = await supabase
          .from("users")
          .select("user_email, user_identification, auth_user_id")
          .eq("user_identification", email)
          .single();

        userData = directLookup.data || null;
        userError = directLookup.error;
      }

      if (userError || !userData) {
        throw new Error("Usuario no encontrado por identificación");
      }
      targetEmail = userData.user_email;
      userRecord = userData;
    } else {
      const { data: userData } = await supabase
        .from("users")
        .select("user_email, user_identification, auth_user_id")
        .eq("user_email", email)
        .single();
      userRecord = userData || null;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) {
      throw error;
    }

    const { data: profile, error: profileError } =
      await AuthSupabaseService.getUserProfile(data.user.id);
    if (profileError) throw profileError;

    const clientIp = 'unknown';

    const { data: logData } = await supabase
      .from("login_history")
      .insert([
        {
          user_id: profile.user_id,
          lhist_ip: clientIp,
          lhist_success: true,
        },
      ])
      .select()
      .single();

    return {
      data: {
        status: "Success",
        data: {
          user: profile,
          access_token: data.session.access_token,
          lgnhist_id: logData ? logData.lhist_id : null,
        },
      },
    };
  },

  async syncStoredSession() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      clearAuthSession();
      return null;
    }

    const { data: profile, error: profileError } =
      await AuthSupabaseService.getUserProfile(session.user.id);

    if (profileError || !profile) {
      clearAuthSession();
      return null;
    }

    return setStoredUser(profile);
  },

  logout() {
    return supabase.auth.signOut();
  },

  signInWithOAuth({ provider }: { provider: string }) {
    return supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: buildAppUrl("auth/callback"),
      },
    });
  },

  recoveryPassword({ email }: { email: string }) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAppUrl("recovery-password"),
    });
  },

  newPassword({ password }: { password: string }) {
    return supabase.auth.updateUser({ password });
  },

  getSession() {
    return supabase.auth.getSession();
  },

  getUser() {
    return supabase.auth.getUser();
  },

  async checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      data: {
        session: session ? "active" : "inactive",
      },
    };
  },

  async getActiveDataPolicy() {
    const { data, error } = await supabase
      .from("data_policies")
      .select("pol_id, pol_description, pol_type, pol_active")
      .eq("pol_active", true)
      .order("pol_id", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return {
        data: {
          status: "Success",
          data: {
            pol_id: 0,
            pol_description:
              "Autorizo el tratamiento de mis datos personales para el uso operativo y administrativo del sistema El Castillo.",
            pol_type: "default",
            pol_active: true,
          },
        },
      };
    }

    return {
      data: {
        status: "Success",
        data: {
          pol_id: data.pol_id,
          pol_description: data.pol_description,
          pol_type: data.pol_type ?? null,
          pol_active: data.pol_active ?? null,
        },
      },
    };
  },

  getUserProfile(authUserId: string) {
    return supabase
      .from("users")
      .select("*, profiles(*)")
      .eq("auth_user_id", authUserId)
      .single();
  },

  async changePassword({ password, oldPassword }: { password: string; oldPassword: string }) {
    // Re-authenticate first to verify the current password (prevents unauthorized changes)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('No hay sesión activa.');

    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (reAuthError) throw new Error('La contraseña actual es incorrecta.');

    return supabase.auth.updateUser({ password });
  },
};

export default AuthSupabaseService;
