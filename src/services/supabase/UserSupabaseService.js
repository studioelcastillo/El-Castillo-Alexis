import { supabase } from "../../boot/supabase";

export default {
  async getUsersDatatable(params) {
    let query = supabase.from("users").select("*, profiles(prof_name)");

    if (params.searchterm) {
      query = query.or(
        `user_name.ilike.%${params.searchterm}%,user_surname.ilike.%${params.searchterm}%,user_identification.ilike.%${params.searchterm}%`
      );
    }

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getUsers(params) {
    let query = supabase.from("users").select("*, profiles(prof_name)");

    if (params.user_id) {
      query = query.eq("user_id", params.id);
    }

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getUser(params) {
    const { data, error } = await supabase
      .from("users")
      .select(
        "*, profiles(prof_name), city:city_id(*, department:dpto_id(*, country:country_id(*)))"
      )
      .eq("user_id", params.id);

    // El frontend espera un array en data.data
    return { data: { data: data || [] }, error };
  },

  async addUser(params) {
    // Nota: El registro en auth.users debería hacerse por separado o mediante un trigger si es necesario.
    // Por ahora, insertamos directamente en la tabla pública para mantener la compatibilidad del formulario.
    const { data, error } = await supabase
      .from("users")
      .insert([params])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editUser(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editMyProfile(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async uploadImage({ id, data, token }) {
    // El objeto 'data' es FormData. Necesitamos el archivo.
    const file = data.get("files");
    if (!file) return { error: "No file provided" };

    const path = `users/${id}/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("el-castillo")
      .upload(path, file, { upsert: true });

    if (uploadError) return { error: uploadError };

    const { data: urlData } = supabase.storage
      .from("el-castillo")
      .getPublicUrl(path);

    return supabase
      .from("users")
      .update({ user_photo_url: urlData.publicUrl })
      .eq("user_id", id);
  },

  async getUsersByOwnerStudio(params) {
    let query = supabase.from("users").select("*, profiles(prof_name)");

    if (params.searchterm) {
      query = query.or(
        `user_name.ilike.%${params.searchterm}%,user_surname.ilike.%${params.searchterm}%`
      );
    }
    if (params.prof_id) {
      query = query.eq("prof_id", params.prof_id);
    }

    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async getUsersCoincide(params) {
    // Simulado para evitar errores en el formulario
    return { data: { data: [] } };
  },
};
