import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

export default {
  async getBanksAccounts(params) {
    let query = supabase.from("bank_accounts").select("*");
    if (params.user_id) query = query.eq("user_id", params.user_id);
    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getBankAccount(params) {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("bacc_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async addBankAccount(params) {
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editBankAccount(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("bank_accounts")
      .update(updateData)
      .eq("bacc_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delBankAccount(params) {
    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("bacc_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
