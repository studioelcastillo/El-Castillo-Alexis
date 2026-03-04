import { supabase } from "../../supabaseClient";

export default {
  async uploadFile({ bucket = "el-castillo", path, file }) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  },

  async deleteFile({ bucket = "el-castillo", path }) {
    const { data, error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
    return data;
  },

  getPublicUrl({ bucket = "el-castillo", path }) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};
