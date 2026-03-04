import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

export default {
  async getModelsStreamsCustomers(params) {
    let query = supabase.from("models_streams_customers").select("*");
    if (params.modstr_id) query = query.eq("modstr_id", params.modstr_id);
    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async addModelStreamCustomer(params) {
    const { data, error } = await supabase
      .from("models_streams_customers")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async getModelStreamCustomer(params) {
    const { data, error } = await supabase
      .from("models_streams_customers")
      .select("*")
      .eq("modstrcus_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async editModelStreamCustomer(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("models_streams_customers")
      .update(updateData)
      .eq("modstrcus_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delModelStreamCustomer(params) {
    const { error } = await supabase
      .from("models_streams_customers")
      .delete()
      .eq("modstrcus_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
