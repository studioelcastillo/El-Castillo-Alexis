import { supabase } from '../boot/supabase'

export default {

  // ── INDICADORES ──────────────────────────────────
  async getIndicators ({ per_id = null, std_id = null } = {}) {
    const { data, error } = await supabase.rpc('get_dashboard_indicators', {
      p_per_id: per_id,
      p_std_id: std_id
    })
    return { data, error }
  },

  // ── TAREAS ────────────────────────────────────────
  async getTasks (user_id) {
    const { data, error } = await supabase.rpc('get_dashboard_tasks', {
      p_user_id: user_id
    })
    return { data, error }
  },

  // ── GRÁFICAS: ganancias x plataforma x período ───
  async getCharts ({ per_id = null, std_id = null } = {}) {
    let query = supabase
      .from('model_streams')
      .select('modstr_platform, modstr_earnings_usd, modstr_earnings_eur, modstr_date, std_id')
      .order('modstr_date', { ascending: true })

    if (std_id) query = query.eq('std_id', std_id)

    const { data, error } = await query
    // Agrupar por plataforma para highcharts
    if (data) {
      const grouped = {}
      data.forEach(row => {
        const platform = row.modstr_platform || 'Sin plataforma'
        if (!grouped[platform]) grouped[platform] = { name: platform, data: [] }
        grouped[platform].data.push(parseFloat(row.modstr_earnings_usd || 0))
      })
      return { data: Object.values(grouped), error }
    }
    return { data, error }
  },

  // ── METAS POR MODELO ─────────────────────────────
  async getModelGoals ({ per_id = null, std_id = null } = {}) {
    let query = supabase
      .from('model_goals')
      .select(`
        *,
        users(user_id, user_name, user_surname, user_identification),
        periods(per_name)
      `)
    if (per_id) query = query.eq('per_id', per_id)
    if (std_id) query = query.eq('std_id', std_id)

    return query
  },

  // ── METAS POR ESTUDIO ────────────────────────────
  async getStudioGoals ({ per_id = null, std_id = null } = {}) {
    let query = supabase
      .from('model_goals')
      .select(`*, studios(std_name), periods(per_name)`)
    if (per_id) query = query.eq('per_id', per_id)
    if (std_id) query = query.eq('std_id', std_id)
    return query
  }
}
