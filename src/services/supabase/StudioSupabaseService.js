import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

export default {
  async getStudios(params) {
    let query = supabase
      .from("studios")
      .select("*, users!user_id_owner(user_name, user_surname)");

    if (params.id) query = query.eq("user_id_owner", params.id);
    if (params.searchterm) {
      query = query.ilike("std_name", `%${params.searchterm}%`);
    }
    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    const mapped = (data || []).map((row) => ({
      ...row,
      user_owner: row.users || null,
    }));
    return { data: { data: mapped }, error };
  },

  async getStudio(params) {
    const { data, error } = await supabase
      .from("studios")
      .select("*, users!user_id_owner(user_name, user_surname)")
      .eq("std_id", params.id)
      .single();

    const mapped = data
      ? [{
          ...data,
          user_owner: data.users || null,
        }]
      : [];
    return { data: { data: mapped }, error };
  },

  async addStudio(params) {
    const { data, error } = await supabase
      .from("studios")
      .insert([params])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editStudio(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("studios")
      .update(updateData)
      .eq("std_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delStudio(params) {
    const { error } = await supabase
      .from("studios")
      .delete()
      .eq("std_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async uploadImage({ id, data }) {
    const file = data.get("files");
    if (!file) return { error: "No file provided" };

    const path = `studios/${id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("el-castillo")
      .upload(path, file, { upsert: true });

    if (uploadError) return { error: uploadError };

    const { data: urlData } = supabase.storage
      .from("el-castillo")
      .getPublicUrl(path);

    const { data: updateData, error: updateError } = await supabase
      .from("studios")
      .update({ std_photo_url: urlData.publicUrl })
      .eq("std_id", id)
      .select()
      .single();

    return {
      data: { data: updateData, status: updateError ? "Error" : "Success" },
      error: updateError,
    };
  },

  async activateStudio(params) {
    const { data, error } = await supabase
      .from("studios")
      .update({ std_active: true })
      .eq("std_id", params.id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async inactivateStudio(params) {
    const { data, error } = await supabase
      .from("studios")
      .update({ std_active: false })
      .eq("std_id", params.id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },
};
