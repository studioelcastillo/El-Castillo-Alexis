import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getStudiosModels(params) {
    let query = supabase
      .from("studios_models")
      .select(
        "*, users!user_id_model(user_id, user_name, user_name2, user_surname, user_surname2, user_identification, user_email), studios(std_id, std_name), studios_rooms(stdroom_id, stdroom_name), studios_shifts(stdshift_id, stdshift_name)"
      );

    if (params.std_id) query = query.eq("std_id", params.std_id);
    if (params.user_id) query = query.eq("user_id_model", params.user_id);
    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      const parentField = queryParams.get("parentfield");
      const parentId = queryParams.get("parentid");
      if (parentField && parentId) {
        query = query.eq(parentField, parentId);
        queryParams.delete("parentfield");
        queryParams.delete("parentid");
      }
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    const mapped = (data || []).map((row) => ({
      ...row,
      user_model: row.users || null,
      studio: row.studios || null,
      studio_room: row.studios_rooms || null,
      studio_shift: row.studios_shifts || null,
    }));
    return { data: { data: mapped }, error };
  },

  async getStudioModel(params) {
    const { data, error } = await supabase
      .from("studios_models")
      .select(
        "*, users!user_id_model(user_id, user_name, user_name2, user_surname, user_surname2, user_identification, user_email), studios(std_id, std_name), studios_rooms(stdroom_id, stdroom_name), studios_shifts(stdshift_id, stdshift_name)"
      )
      .eq("stdmod_id", params.id)
      .single();
    const mapped = data
      ? [{
          ...data,
          user_model: data.users || null,
          studio: data.studios || null,
          studio_room: data.studios_rooms || null,
          studio_shift: data.studios_shifts || null,
        }]
      : [];
    return { data: { data: mapped }, error };
  },

  async addStudioModel(params) {
    const { data, error } = await supabase
      .from("studios_models")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editStudioModel(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("studios_models")
      .update(updateData)
      .eq("stdmod_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delStudioModel(params) {
    const { error } = await supabase
      .from("studios_models")
      .delete()
      .eq("stdmod_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async activateStudioModel(params) {
    const { data, error } = await supabase
      .from("studios_models")
      .update({ stdmod_active: true })
      .eq("stdmod_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async inactivateStudioModel(params) {
    const { data, error } = await supabase
      .from("studios_models")
      .update({ stdmod_active: false })
      .eq("stdmod_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async getStudiosModelsFromModelByStudioModel(params) {
    const { data, error } = await supabase
      .from("studios_models")
      .select("*, studios(std_id, std_name), studios_rooms(stdroom_id, stdroom_name)")
      .eq("stdmod_id", params.id);
    const mapped = (data || []).map((row) => ({
      ...row,
      studio: row.studios || null,
      studio_room: row.studios_rooms || null,
    }));
    return { data: { data: mapped }, error };
  },
};
