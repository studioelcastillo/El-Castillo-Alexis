import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

export default {
  async getTransactionsTypes(params) {
    let query = supabase.from("transactions_types").select("*");
    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async addTransactionType(params) {
    const { data, error } = await supabase
      .from("transactions_types")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async getTransactionType(params) {
    const { data, error } = await supabase
      .from("transactions_types")
      .select("*")
      .eq("transtype_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async editTransactionType(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("transactions_types")
      .update(updateData)
      .eq("transtype_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delTransactionType(params) {
    const { error } = await supabase
      .from("transactions_types")
      .delete()
      .eq("transtype_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
