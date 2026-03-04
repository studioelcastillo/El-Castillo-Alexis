import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

const mapUserPermission = (row) => ({
  ...row,
  user2: row.users || null,
});

export default {
  async getUsersPermissions2(params) {
    let query = supabase
      .from("users_permissions2")
      .select("*, users(user_name)");

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    return { data: { data: (data || []).map(mapUserPermission) }, error };
  },

  async addUserPermission2(params) {
    const { data, error } = await supabase
      .from("users_permissions2")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async getUserPermission2(params) {
    const { data, error } = await supabase
      .from("users_permissions2")
      .select("*, users(user_name)")
      .eq("userperm_id", params.id)
      .single();
    return { data: { data: data ? [mapUserPermission(data)] : [] }, error };
  },

  async editUserPermission2(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("users_permissions2")
      .update(updateData)
      .eq("userperm_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async delUserPermission2(params) {
    const { error } = await supabase
      .from("users_permissions2")
      .delete()
      .eq("userperm_id", params.id);
    return { data: { status: error ? "error" : "success" }, error };
  },
};
