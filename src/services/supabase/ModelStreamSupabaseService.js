import { supabase } from "../../supabaseClient";
import { api } from "../../boot/axios";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getModelsStreams(params) {
    let query = supabase.from("models_streams").select(
      `*,
        model_account:models_accounts(
          modacc_id,
          modacc_username,
          modacc_app,
          modacc_payment_username,
          studio_model:studios_models(
            stdmod_id,
            user_model:users(user_id, user_name, user_surname)
          )
        ),
        studio:studios(std_id, std_name)`
    );

    if (params.user_id) query = query.eq("user_id", params.user_id);
    if (params.std_id) query = query.eq("std_id", params.std_id);
    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getModelsStreamsByModel(params) {
    const { data, error } = await supabase
      .from("models_streams")
      .select(
        `*,
        model_account:models_accounts(
          modacc_id,
          modacc_username,
          modacc_app,
          modacc_payment_username,
          studio_model:studios_models(
            stdmod_id,
            user_model:users(user_id, user_name, user_surname)
          )
        ),
        studio:studios(std_id, std_name)`
      )
      .eq("user_id", params.id)
      .order("modstr_date", { ascending: false });

    return { data: { data: data || [] }, error };
  },

  async getModelStream(params) {
    const { data, error } = await supabase
      .from("models_streams")
      .select(
        `*,
        model_account:models_accounts(
          modacc_id,
          modacc_username,
          modacc_app,
          modacc_payment_username,
          studio_model:studios_models(
            stdmod_id,
            user_model:users(user_id, user_name, user_surname)
          )
        ),
        studio:studios(std_id, std_name)`
      )
      .eq("modstr_id", params.id)
      .single();

    return { data: { data: data ? [data] : [] }, error };
  },

  async addModelStream(params) {
    const { data, error } = await supabase
      .from("models_streams")
      .insert([params])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editModelStream(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("models_streams")
      .update(updateData)
      .eq("modstr_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delModelStream(params) {
    const { error } = await supabase
      .from("models_streams")
      .delete()
      .eq("modstr_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async populateStreams(params) {
    console.warn(
      "populateStreams is currently under migration to Edge Functions."
    );
    return { data: { status: "fail", message: "Servicio en migración" } };
    /*
    return api.post("api/models_streams/populate", params, {
      headers: {
        Authorization: `Bearer ${params.token}`,
      },
    });
    */
  },

  async importModelStream(params) {
    console.warn(
      "importModelStream is currently under migration to Edge Functions."
    );
    return { data: { status: "fail", message: "Servicio en migración" } };
    /*
    return api.post("api/models_streams/import", params.data, {
      headers: {
        Authorization: `Bearer ${params.token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    */
  },
};
