import { supabase } from '../boot/supabase'

export default {

  // ── AUTH ──────────────────────────────────────────
  async login ({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async logout () {
    return supabase.auth.signOut()
  },

  async recoveryPassword ({ email }) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/recovery'
    })
  },

  async newPassword ({ password }) {
    return supabase.auth.updateUser({ password })
  },

  async getSession () {
    return supabase.auth.getSession()
  },

  async getUser () {
    return supabase.auth.getUser()
  },

  // ── PERFIL EXTENDIDO (tabla users) ────────────────
  async getUserProfile (authUserId) {
    return supabase
      .from('users')
      .select('*, profiles(*)')
      .eq('auth_user_id', authUserId)
      .single()
  },

  async changePassword ({ password }) {
    return supabase.auth.updateUser({ password })
  }
}
