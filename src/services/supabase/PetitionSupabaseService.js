import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

import EmailSupabaseService from "./EmailSupabaseService";

export default {
  async addPetitions(params) {
    const { data, error } = await supabase
      .from("petitions")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async addPetitionState(params) {
    // 1. Actualizar el estado de la petición
    const { data: petition, error } = await supabase
      .from("petitions")
      .update({ ptn_state: params.ptn_state })
      .eq("ptn_id", params.ptn_id)
      .select("*, users!user_id(user_name, user_surname, user_email)")
      .single();

    if (error) return { data: { data: null, status: "Error" }, error };

    // 2. Enviar correo de notificación si el usuario tiene email
    if (petition && petition.users && petition.users.user_email) {
      const subject = `Actualización de tu petición - El Castillo`;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hola, ${petition.users.user_name}</h2>
          <p>Te informamos que tu petición de tipo <strong>${petition.ptn_type}</strong> ha cambiado de estado.</p>
          <p><strong>Nuevo estado:</strong> ${petition.ptn_state}</p>
          <br>
          <p>Si tienes alguna duda, por favor contacta con soporte.</p>
          <hr>
          <p style="font-size: 12px; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
      `;

      await EmailSupabaseService.sendEmail({
        to: petition.users.user_email,
        subject: subject,
        html: html,
      });
    }

    return { data: { data: petition, status: "Success" }, error: null };
  },

  async getPetitions(params) {
    let query = supabase
      .from("petitions")
      .select("*, users!user_id(user_name, user_surname)");

    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getPetition(params) {
    const { data, error } = await supabase
      .from("petitions")
      .select("*, users!user_id(user_name, user_surname)")
      .eq("ptn_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async getAccountCreations(params) {
    const { data, error } = await supabase
      .from("petitions")
      .select("*, users!user_id(user_name, user_surname)")
      .eq("user_id", params.user_id)
      .eq("ptn_type", "ACCOUNT_CREATION");
    return { data: { data: data || [] }, error };
  },

  async checkModelStudio(params) {
    // Logic to check if a model belongs to a studio via petitions or direct relation
    const { data, error } = await supabase
      .from("studios_models")
      .select("*")
      .eq("user_id_model", params.user_id);
    return { data: { data: data || [] }, error };
  },

  async getStudiosModelsByModel(params) {
    const { data, error } = await supabase
      .from("studios_models")
      .select("*, studios(std_name)")
      .eq("user_id_model", params.user_id);
    return { data: { data: data || [] }, error };
  },

  async getPreviousObservations(params) {
    const { data, error } = await supabase
      .from("petitions")
      .select("ptn_observation")
      .ilike("ptn_observation", `%${params.search}%`)
      .limit(10);
    return { data: { data: data || [] }, error };
  },
};
