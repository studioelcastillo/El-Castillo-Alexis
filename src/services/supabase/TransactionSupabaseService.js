import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getTransactions(params) {
    let query = supabase
      .from("transactions")
      .select(
        `*,
        transaction_type:transactions_types(transtype_id, transtype_name, transtype_group, transtype_behavior, transtype_value),
        product:products(prod_id, prod_name, prod_sale_price, cate_id, category:categories(cate_id, cate_name)),
        period:periods(period_id, period_start_date, period_end_date, period_state),
        studio_model:studios_models(stdmod_id, std_id, studios(std_name))`
      );

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
    const mapped = (data || []).map((row) => ({
      ...row,
      period_state: row.period?.period_state || null,
      std_name: row.studio_model?.studios?.std_name || null,
    }));
    return { data: { data: mapped }, error };
  },

  async getTransaction(params) {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        `*,
        transaction_type:transactions_types(transtype_id, transtype_name, transtype_group, transtype_behavior, transtype_value),
        product:products(prod_id, prod_name, prod_sale_price, cate_id, category:categories(cate_id, cate_name)),
        period:periods(period_id, period_start_date, period_end_date, period_state),
        studio_model:studios_models(stdmod_id, std_id, studios(std_name))`
      )
      .eq("trans_id", params.id)
      .single();

    const mapped = data
      ? [{
          ...data,
          period_state: data.period?.period_state || null,
          std_name: data.studio_model?.studios?.std_name || null,
        }]
      : [];
    return { data: { data: mapped }, error };
  },

  async addTransaction(params) {
    const { data, error } = await supabase
      .from("transactions")
      .insert([params])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editTransaction(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("trans_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delTransaction(params) {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("trans_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
