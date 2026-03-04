import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

export default {
  async getExchangesRates(params) {
    let query = supabase.from("exchange_rates").select("*");

    if (params.searchterm) {
      // Assuming search by date or similar if applicable
    }

    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getExchangeRate(params) {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("exrate_id", params.id)
      .single();

    return { data: { data: data ? [data] : [] }, error };
  },

  async addExchangeRate(params) {
    const { data, error } = await supabase
      .from("exchange_rates")
      .insert([params])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editExchangeRate(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("exchange_rates")
      .update(updateData)
      .eq("exrate_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delExchangeRate(params) {
    const { error } = await supabase
      .from("exchange_rates")
      .delete()
      .eq("exrate_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async getLatest() {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("exrate_date", { ascending: false })
      .limit(1)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },
};
