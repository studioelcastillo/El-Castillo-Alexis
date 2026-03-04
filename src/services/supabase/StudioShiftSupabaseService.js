import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

const fetchStudiosShifts = async (params) => {
  let query = supabase
    .from("studios_shifts")
    .select("*, studio:studios(std_id, std_name)");
  if (params.std_id) query = query.eq("std_id", params.std_id);
  if (params.query) {
    query = applyQueryFilters(query, params.query);
  }
  const { data, error } = await query;
  return { data: { data: data || [] }, error };
};

export default {
  getStudioShifts: fetchStudiosShifts,
  getStudiosShifts: fetchStudiosShifts,

  async getStudiosShiftsDistinct(params) {
    const { data, error } = await supabase
      .from("studios_shifts")
      .select("stdshift_name")
      .neq("stdshift_name", null);

    const shifts = [...new Set((data || []).map((i) => i.stdshift_name))]
      .filter(Boolean)
      .map((name) => ({ stdshift_name: name }));
    return { data: { data: shifts }, error };
  },

  async getStudioShift(params) {
    const { data, error } = await supabase
      .from("studios_shifts")
      .select("*, studio:studios(std_id, std_name)")
      .eq("stdshift_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async addStudioShift(params) {
    const { data, error } = await supabase
      .from("studios_shifts")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editStudioShift(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("studios_shifts")
      .update(updateData)
      .eq("stdshift_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delStudioShift(params) {
    const { error } = await supabase
      .from("studios_shifts")
      .delete()
      .eq("stdshift_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
