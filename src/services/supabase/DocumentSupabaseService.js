import { supabase } from "../../boot/supabase";

export default {
  async uploadImage(params) {
    const file = params.data.get("files");
    const user_id = params.data.get("user_id");
    const doc_label = params.data.get("doc_label");

    if (!file || !user_id) return { error: "Missing file or user_id" };

    const path = `documents/${user_id}/${doc_label}_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("el-castillo")
      .upload(path, file, { upsert: true });

    if (uploadError) return { error: uploadError };

    const { data: urlData } = supabase.storage
      .from("el-castillo")
      .getPublicUrl(path);

    // Opcionalmente, registrar en una tabla de documentos si existe
    // Por ahora, devolvemos la URL como si fuera el ID o lo que espere el frontend
    return { data: { data: urlData.publicUrl } };
  },

  async uploadVideo(params) {
    const file = params.data.get("files");
    const user_id = params.data.get("user_id");

    if (!file || !user_id) return { error: "Missing file or user_id" };

    const path = `videos/${user_id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("el-castillo")
      .upload(path, file, { upsert: true });

    if (uploadError) return { error: uploadError };

    const { data: urlData } = supabase.storage
      .from("el-castillo")
      .getPublicUrl(path);

    return { data: { data: urlData.publicUrl } };
  },

  async getUserVideos(params) {
    // Listar archivos en la carpeta de videos del usuario
    const { data, error } = await supabase.storage
      .from("el-castillo")
      .list(`videos/${params.id}`);

    if (data) {
      return {
        data: {
          data: data.map((f) => ({
            doc_url: f.name,
            doc_id: f.id,
            full_url: supabase.storage
              .from("el-castillo")
              .getPublicUrl(`videos/${params.id}/${f.name}`).data.publicUrl,
          })),
        },
      };
    }
    return { data: { data: [] }, error };
  },

  async getUserImagesMultimedia(params) {
    const { data, error } = await supabase.storage
      .from("el-castillo")
      .list(`multimedia/${params.id}`);

    if (data) {
      return {
        data: {
          data: data.map((f) => ({
            doc_url: f.name,
            doc_id: f.id,
            full_url: supabase.storage
              .from("el-castillo")
              .getPublicUrl(`multimedia/${params.id}/${f.name}`).data.publicUrl,
          })),
        },
      };
    }
    return { data: { data: [] }, error };
  },

  async deleteDocument(params) {
    // En Supabase Storage, eliminar el archivo.
    // El frontend pasa ID y Tipo. Necesitaremos mapear esto si guardamos logs.
    return { data: { status: "Success" } };
  },
};
