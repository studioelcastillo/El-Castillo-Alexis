import { supabase } from "../../supabaseClient";

export default {
  async getPaysheetUsers(params) {
    let query = supabase
      .from("paysheets")
      .select(
        "*, studios(std_name), periods(period_id, period_start_date, period_end_date, period_state)"
      );

    if (params.period_id) query = query.eq("period_id", params.period_id);
    if (params.std_id) query = query.eq("std_id", params.std_id);

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getPaysheetPDF(params) {
    // Sin servidor Laravel, los PDFs se generan desde los datos almacenados
    const { data, error } = await supabase
      .from("payroll_transactions")
      .select("*")
      .eq("payroll_trans_id", params.payroll_trans_id)
      .single();

    return { data: { data }, error };
  },

  async getPayrollPeriods(params) {
    const { data, error } = await supabase
      .from("periods")
      .select("*")
      .order("period_start_date", { ascending: false });
    return { data: { data: data || [] }, error };
  },
};
