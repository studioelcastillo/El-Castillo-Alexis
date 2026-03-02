import { supabase } from "../../boot/supabase";

export default {
  // ── AUTH ──────────────────────────────────────────
  async login({ email, password, policyId, policyAnswer }) {
    // 1. Identificar si es email o cédula
    let targetEmail = email;
    if (!email.includes("@")) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_email")
        .eq("user_identification", email)
        .single();

      if (userError || !userData) {
        throw new Error("Usuario no encontrado por identificación");
      }
      targetEmail = userData.user_email;
    }

    // 2. Autenticar con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) throw error;

    // 3. Obtener el perfil extendido del usuario
    const { data: profile, error: profileError } = await this.getUserProfile(
      data.user.id
    );
    if (profileError) throw profileError;

    // 4. Registrar en el historial de login
    const { data: logData } = await supabase
      .from("login_history")
      .insert([
        {
          user_id: profile.user_id,
          lhist_ip: "local", // En prod se puede obtener la IP
          lhist_success: true,
        },
      ])
      .select()
      .single();

    // 5. Devolver formato compatible con el frontend (Laravel-like)
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

  async logout() {
    return supabase.auth.signOut();
  },

  async recoveryPassword({ email }) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/recovery",
    });
  },

  async newPassword({ password }) {
    return supabase.auth.updateUser({ password });
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser() {
    return supabase.auth.getUser();
  },

  // ── POLÍTICAS DE DATOS ──────────────────────────
  async getActiveDataPolicy() {
    // Mock temporal dado que no se encontró tabla en schema.sql
    return {
      data: {
        status: "Success",
        data: {
          pol_id: 1,
          pol_description:
            "Al iniciar sesión, usted acepta el tratamiento de sus datos personales según la ley vigente de protección de datos de El Castillo Group SAS.",
        },
      },
    };
  },

  // ── PERFIL EXTENDIDO (tabla users) ────────────────
  async getUserProfile(authUserId) {
    return supabase
      .from("users")
      .select("*, profiles(*)")
      .eq("auth_user_id", authUserId)
      .single();
  },

  async changePassword({ password }) {
    return supabase.auth.updateUser({ password });
  },
};
