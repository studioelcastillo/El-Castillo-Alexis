import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getCategories(params) {
    let query = supabase.from("categories").select("*");

    if (params.searchterm) {
      query = query.ilike("cate_name", `%${params.searchterm}%`);
    }

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getCategory(params) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("cate_id", params.id)
      .single();

    return { data: { data: data ? [data] : [] }, error };
  },

  async addCategory(params) {
    const { data, error } = await supabase
      .from("categories")
      .insert([params])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editCategory(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("cate_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delCategory(params) {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("cate_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
