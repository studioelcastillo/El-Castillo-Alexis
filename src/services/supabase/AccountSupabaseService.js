import { supabase } from "../../supabaseClient";

export default {
  async getAccounts(params) {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("accacc_name", { ascending: true });
    const mapped = (data || []).map((row) => ({
      ...row,
      accacc_entity: row.accacc_name,
    }));
    return { data: { data: mapped }, error };
  },

  async editAccount(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("accounts")
      .update(updateData)
      .eq("accacc_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },
};
