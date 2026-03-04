import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

export default {
  async getStudiosAccounts(params) {
    let query = supabase
      .from("studios_accounts")
      .select("*, studio:studios(std_id, std_name)");
    if (params.std_id) query = query.eq("std_id", params.std_id);
    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getStudioAccount(params) {
    const { data, error } = await supabase
      .from("studios_accounts")
      .select("*, studio:studios(std_id, std_name)")
      .eq("stdacc_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async addStudioAccount(params) {
    const { data, error } = await supabase
      .from("studios_accounts")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editStudioAccount(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("studios_accounts")
      .update(updateData)
      .eq("stdacc_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delStudioAccount(params) {
    const { error } = await supabase
      .from("studios_accounts")
      .delete()
      .eq("stdacc_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async activateStudioAccount(params) {
    const { data, error } = await supabase
      .from("studios_accounts")
      .update({ stdacc_active: true })
      .eq("stdacc_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async inactivateStudioAccount(params) {
    const { data, error } = await supabase
      .from("studios_accounts")
      .update({ stdacc_active: false })
      .eq("stdacc_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },
};
