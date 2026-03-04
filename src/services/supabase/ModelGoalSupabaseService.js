import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getModelsGoals(params) {
    let query = supabase
      .from("models_goals")
      .select(
        "*, studios_models!inner(stdmod_id, std_id, user_id_model, studios(std_name), users(user_id, user_name, user_surname, user_identification))"
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
      const stdId = queryParams.get("std_id");
      if (stdId) {
        query = query.eq("studios_models.std_id", stdId);
        queryParams.delete("std_id");
      }
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    const mapped = (data || []).map((row) => ({
      ...row,
      studio_model: row.studios_models || null,
      period_state: "ABIERTO",
    }));
    return { data: { data: mapped }, error };
  },

  async getModelGoal(params) {
    const { data, error } = await supabase
      .from("models_goals")
      .select(
        "*, studios_models!inner(stdmod_id, std_id, user_id_model, studios(std_name), users(user_id, user_name, user_surname, user_identification))"
      )
      .eq("modgoal_id", params.id)
      .single();
    const mapped = data
      ? [{
          ...data,
          studio_model: data.studios_models || null,
          period_state: "ABIERTO",
        }]
      : [];
    return { data: { data: mapped }, error };
  },

  async addModelGoal(params) {
    const { data, error } = await supabase
      .from("models_goals")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editModelGoal(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("models_goals")
      .update(updateData)
      .eq("modgoal_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delModelGoal(params) {
    const { error } = await supabase
      .from("models_goals")
      .delete()
      .eq("modgoal_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
