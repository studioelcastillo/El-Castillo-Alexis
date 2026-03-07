import { supabase } from "../../supabaseClient";
import { getCurrentStudioId } from "../../tenant";
import { getTenantSettingValue } from "../../tenantSettings";

const ReportSupabaseService = {
  async getStudioPeriods() {
    const studioId = getCurrentStudioId();
    let query = supabase
      .from("periods")
      .select("period_start_date, period_end_date")
      .order("period_start_date", { ascending: false });

    if (studioId) {
      query = query.eq("std_id", studioId);
    }

    const { data, error } = await query;

    const mapped = (data || []).map((row) => ({
      label: `${row.period_start_date} - ${row.period_end_date}`,
      since: row.period_start_date,
      until: row.period_end_date,
    }));

    return { data: { data: mapped }, error };
  },

  async getConsecutiveReport(params: { report_number: number }) {
    const key = `report_consecutive_${params.report_number}`;
    const rawValue = await getTenantSettingValue(key, getCurrentStudioId());
    const value = Number(rawValue);
    return { data: { data: Number.isFinite(value) ? value : 1 }, error: null };
  },

  async getReport(params: { report_table?: string; period_id?: number }) {
    let query = supabase.from(params.report_table || "reports").select("*");
    const studioId = getCurrentStudioId();
    if (params.period_id) {
      query = query.eq("period_id", params.period_id);
    }
    if (studioId) {
      query = query.eq("std_id", studioId);
    }

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getModelsReport() {
    const studioId = getCurrentStudioId();
    let query = supabase
      .from("models_reports")
      .select("*, users(user_name, user_surname)");
    if (studioId) {
      query = query.eq("std_id", studioId);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getStudiosReport() {
    const studioId = getCurrentStudioId();
    let query = supabase
      .from("studios_reports")
      .select("*, studios(std_name)");
    if (studioId) {
      query = query.eq("std_id", studioId);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },
};

export default ReportSupabaseService;
