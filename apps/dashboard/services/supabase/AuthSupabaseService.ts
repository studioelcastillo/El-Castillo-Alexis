import { supabase } from "../../supabaseClient";
import { buildAppUrl } from "../../utils/baseUrl";
import { getStoredUser, setStoredUser } from "../../session";
import { clearAuthSession } from "../../utils/session";

type LoginParams = {
  email: string;
  password: string;
  policyId?: number;
  policyAnswer?: boolean;
};

const AuthSupabaseService = {
  async login({ email, password }: LoginParams) {
    const identifier = String(email || '').trim();
    const isEmailFormat = identifier.includes("@");
    let targetEmail = email;
    let userRecord: any = null;

    // Use server-side proxy to bypass RLS for user lookup
    try {
      const response = await fetch(
        `/__local/login-lookup?identifier=${encodeURIComponent(identifier)}`
      );

      if (response.ok) {
        const payload = await response.json();
        const userData = payload?.data;

        if (userData) {
          userRecord = userData;
          targetEmail = userData.user_email;
        }
      }
    } catch (e) {
      console.error("Local lookup failed:", e);
    }

    if (!userRecord) {
      // Fallback for development or if proxy fails - direct lookup (might be blocked by RLS)
      let query = supabase
        .from("users")
        .select("user_email, user_identification, auth_user_id, user_active")
        .is("deleted_at", null);

      if (isEmailFormat) {
        query = query.or(`user_email.ilike.${identifier},user_personal_email.ilike.${identifier}`);
      } else {
        query = query.or(`user_identification.eq.${identifier},user_name.ilike.${identifier}`);
      }

      const { data: userRecords } = await query;
      userRecord = userRecords?.find(u => u.user_active) || userRecords?.[0] || null;
      if (userRecord) targetEmail = userRecord.user_email;
    }

    if (!userRecord) {
      throw new Error(`Usuario no encontrado: ${identifier}`);
    }

    if (!userRecord.auth_user_id) {
       throw new Error(`El usuario ${identifier} no tiene cuenta de autenticación configurada.`);
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
      return null;
    }

    const cachedUser = getStoredUser();
    const canReuseCachedUser =
      !!cachedUser &&
      String((cachedUser as any).auth_user_id || '') === String(session.user.id || '');

    const { data: profile, error: profileError } =
      await AuthSupabaseService.getUserProfile(session.user.id);

    if (!profileError && profile) {
      return setStoredUser(profile);
    }

    if (canReuseCachedUser) {
      return cachedUser;
    }

    return null;
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

    await supabase.auth.updateUser({ password });
    
    // Clear must_change_password flag in public.users
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    if (updatedUser) {
        await supabase.from('users').update({ must_change_password: false }).eq('auth_user_id', updatedUser.id);
        
        // Update local session
        const currentStored = getStoredUser();
        if (currentStored) {
            setStoredUser({ ...currentStored, must_change_password: false });
        }
    }
    
    return { success: true };
  },
};

export default AuthSupabaseService;
