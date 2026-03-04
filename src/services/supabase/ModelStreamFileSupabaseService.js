import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

export default {
  async getModelsStreamsFiles(params) {
    let query = supabase.from("models_streams_files").select("*");
    if (params.modstr_id) query = query.eq("modstr_id", params.modstr_id);
    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    return { data: { data: data || [] }, error };
  },

  async addModelStreamFile(params) {
    const { data, error } = await supabase
      .from("models_streams_files")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async getModelStreamFile(params) {
    const { data, error } = await supabase
      .from("models_streams_files")
      .select("*")
      .eq("modstrfile_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async editModelStreamFile(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("models_streams_files")
      .update(updateData)
      .eq("modstrfile_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delModelStreamFile(params) {
    const { error } = await supabase
      .from("models_streams_files")
      .delete()
      .eq("modstrfile_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
