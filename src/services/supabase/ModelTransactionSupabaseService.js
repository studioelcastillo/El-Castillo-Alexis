import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getModelsTransactions(params) {
    let query = supabase.from("models_transactions").select(`
      *,
      transaction_type:transactions_types(transtype_id, transtype_name, transtype_group, transtype_behavior, transtype_value),
      product:products(prod_id, prod_name, prod_sale_price, cate_id, category:categories(cate_id, cate_name)),
      studio_model:studios_models(stdmod_id)
    `);
    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      const parentField = queryParams.get("parentfield");
      const parentId = queryParams.get("parentid");
      if (parentField && parentId) {
        query = query.eq(parentField, parentId);
        queryParams.delete("parentfield");
        queryParams.delete("parentid");
      }

      const transtypeGroup = queryParams.get("transtype_group");
      if (transtypeGroup) {
        query = query.eq("transactions_types.transtype_group", transtypeGroup);
        queryParams.delete("transtype_group");
      }

      query = applyQueryFilters(query, queryParams);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getModelTransaction(params) {
    const { data, error } = await supabase
      .from("models_transactions")
      .select(`
        *,
        transaction_type:transactions_types(transtype_id, transtype_name, transtype_group, transtype_behavior, transtype_value),
        product:products(prod_id, prod_name, prod_sale_price, cate_id, category:categories(cate_id, cate_name)),
        studio_model:studios_models(stdmod_id)
      `)
      .eq("modtrans_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async addModelTransaction(params) {
    const { data, error } = await supabase
      .from("models_transactions")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editModelTransaction(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("models_transactions")
      .update(updateData)
      .eq("modtrans_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delModelTransaction(params) {
    const { error } = await supabase
      .from("models_transactions")
      .delete()
      .eq("modtrans_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
