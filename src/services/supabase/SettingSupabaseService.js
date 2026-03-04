import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

export default {
  async getSettings(params) {
    let query = supabase.from("settings").select("*");
    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async addSetting(params) {
    const { data, error } = await supabase
      .from("settings")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async getSetting(params) {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("set_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async editSetting(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("settings")
      .update(updateData)
      .eq("set_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delSetting(params) {
    const { error } = await supabase
      .from("settings")
      .delete()
      .eq("set_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async activateSetting(params) {
    const { data, error } = await supabase
      .from("settings")
      .update({ set_active: true })
      .eq("set_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async inactivateSetting(params) {
    const { data, error } = await supabase
      .from("settings")
      .update({ set_active: false })
      .eq("set_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },
};
