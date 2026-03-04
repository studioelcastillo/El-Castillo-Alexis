import { supabase } from "../../supabaseClient";

export default {
  async getStudioPeriods(params) {
    const { data, error } = await supabase
      .from("periods")
      .select("period_start_date, period_end_date")
      .order("period_start_date", { ascending: false });

    const mapped = (data || []).map((row) => ({
      label: `${row.period_start_date} - ${row.period_end_date}`,
      since: row.period_start_date,
      until: row.period_end_date,
    }));

    return { data: { data: mapped }, error };
  },

  async getConsecutiveReport(params) {
    const key = `report_consecutive_${params.report_number}`;
    const { data, error } = await supabase
      .from("settings")
      .select("set_value")
      .eq("set_key", key)
      .maybeSingle();

    const value = data ? Number(data.set_value) : 1;
    return { data: { data: Number.isFinite(value) ? value : 1 }, error };
  },

  async getReport(params) {
    // Report logic would typically involve complex queries or Edge Functions.
    // For now, we simulate a generic report fetch.
    let query = supabase.from(params.report_table || "reports").select("*");
    if (params.period_id) query = query.eq("period_id", params.period_id);

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getModelsReport(params) {
    const { data, error } = await supabase
      .from("models_reports")
      .select("*, users(user_name, user_surname)");
    return { data: { data: data || [] }, error };
  },

  async getStudiosReport(params) {
    const { data, error } = await supabase
      .from("studios_reports")
      .select("*, studios(std_name)");
    return { data: { data: data || [] }, error };
  },
};
