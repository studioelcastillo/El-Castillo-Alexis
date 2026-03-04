import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

const mapProfile = (row) => ({
  ...row,
  profile: row.profiles || null,
});

export default {
  async getUsers2(params) {
    let query = supabase.from("users").select("*, profiles(prof_name)");

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    return { data: { data: (data || []).map(mapProfile) }, error };
  },

  async addUser2(params) {
    const { data, error } = await supabase
      .from("users")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async getUser2(params) {
    const { data, error } = await supabase
      .from("users")
      .select("*, profiles(prof_name)")
      .eq("user_id", params.id)
      .single();
    return { data: { data: data ? [mapProfile(data)] : [] }, error };
  },

  async editUser2(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async delUser2(params) {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", params.id);
    return { data: { status: error ? "error" : "success" }, error };
  },

  async activateUser2(params) {
    const { data, error } = await supabase
      .from("users")
      .update({ user_active: true })
      .eq("user_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async inactivateUser2(params) {
    const { data, error } = await supabase
      .from("users")
      .update({ user_active: false })
      .eq("user_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },
};
