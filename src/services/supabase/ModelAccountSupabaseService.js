import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getModelsAccounts(params) {
    let query = supabase
      .from("models_accounts")
      .select(
        "*, studios_models!inner(stdmod_id, std_id, user_id_model, studios(std_name), users(user_id, user_name, user_surname))"
      );

    if (params.user_id) {
      query = query.eq("studios_models.user_id_model", params.user_id);
    }

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      const userId = queryParams.get("user_id");
      if (userId) {
        query = query.eq("studios_models.user_id_model", userId);
        queryParams.delete("user_id");
      }

      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    const mapped = (data || []).map((row) => ({
      ...row,
      studio_model: row.studios_models || null,
    }));
    return { data: { data: mapped }, error };
  },

  async getModelsAccountsByModel(params) {
    const { data, error } = await supabase
      .from("models_accounts")
      .select(
        "*, studios_models!inner(stdmod_id, std_id, user_id_model, studios(std_name), users(user_id, user_name, user_surname))"
      )
      .eq("studios_models.user_id_model", params.id);
    const mapped = (data || []).map((row) => ({
      ...row,
      studio_model: row.studios_models || null,
    }));
    return { data: { data: mapped }, error };
  },

  async getModelAccount(params) {
    const { data, error } = await supabase
      .from("models_accounts")
      .select(
        "*, studios_models(stdmod_id, std_id, user_id_model, studios(std_name), users(user_id, user_name, user_surname))"
      )
      .eq("modacc_id", params.id)
      .single();
    const mapped = data
      ? [{
          ...data,
          studio_model: data.studios_models || null,
        }]
      : [];
    return { data: { data: mapped }, error };
  },

  async addModelAccount(params) {
    const { data, error } = await supabase
      .from("models_accounts")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editModelAccount(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("models_accounts")
      .update(updateData)
      .eq("modacc_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delModelAccount(params) {
    const { error } = await supabase
      .from("models_accounts")
      .delete()
      .eq("modacc_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async activateModelAccount(params) {
    const { data, error } = await supabase
      .from("models_accounts")
      .update({ modacc_active: true })
      .eq("modacc_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async inactivateModelAccount(params) {
    const { data, error } = await supabase
      .from("models_accounts")
      .update({ modacc_active: false })
      .eq("modacc_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async inactivateMassiveModelAccount(params) {
    const { data, error } = await supabase
      .from("models_accounts")
      .update({ modacc_active: false })
      .in("modacc_id", params.ids);
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async changeAccountsContract(params) {
    const { stdmod_id, modacc_ids = [] } = params;

    if (!stdmod_id || modacc_ids.length === 0) {
      return { data: { data: [], status: "Success" }, error: null };
    }

    const { data, error } = await supabase
      .from("models_accounts")
      .update({ stdmod_id })
      .in("modacc_id", modacc_ids);

    return { data: { data: data || [], status: error ? "Error" : "Success" }, error };
  },

  async getPlatforms(params) {
    // This usually returns a list of unique platforms from accounts
    const { data, error } = await supabase
      .from("models_accounts")
      .select("modacc_app")
      .neq("modacc_app", null);

    // Process unique values
    const platforms = [...new Set(data?.map((i) => i.modacc_app) || [])];
    return { data: { data: platforms }, error };
  },
};
