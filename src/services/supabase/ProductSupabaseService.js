import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getProducts(params) {
    let query = supabase.from("products").select(`
      *,
      category:categories(cate_id, cate_name),
      transaction_type:transactions_types(transtype_id, transtype_name, transtype_group, transtype_behavior, transtype_value)
    `);

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      const transtypeGroup = queryParams.get("transtype_group");
      if (transtypeGroup) {
        query = query.eq("transactions_types.transtype_group", transtypeGroup);
        queryParams.delete("transtype_group");
      }

      const transtypeName = queryParams.get("transtype_name");
      if (transtypeName) {
        query = query.ilike("transactions_types.transtype_name", `%${transtypeName}%`);
        queryParams.delete("transtype_name");
      }

      const categoryName = queryParams.get("cate_name");
      if (categoryName) {
        query = query.ilike("categories.cate_name", `%${categoryName}%`);
        queryParams.delete("cate_name");
      }

      query = applyQueryFilters(query, queryParams);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async addProduct(params) {
    const { data, error } = await supabase
      .from("products")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async getProduct(params) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("prod_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async editProduct(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("prod_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delProduct(params) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("prod_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
