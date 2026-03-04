import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

const fetchStudiosRooms = async (params) => {
  let query = supabase
    .from("studios_rooms")
    .select("*, studio:studios(std_id, std_name)");
  if (params.std_id) query = query.eq("std_id", params.std_id);
  if (params.query) {
    query = applyQueryFilters(query, params.query);
  }
  const { data, error } = await query;
  return { data: { data: data || [] }, error };
};

export default {
  getStudioRooms: fetchStudiosRooms,
  getStudiosRooms: fetchStudiosRooms,

  async getStudioRoom(params) {
    const { data, error } = await supabase
      .from("studios_rooms")
      .select("*, studio:studios(std_id, std_name)")
      .eq("stdroom_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async addStudioRoom(params) {
    const { data, error } = await supabase
      .from("studios_rooms")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editStudioRoom(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("studios_rooms")
      .update(updateData)
      .eq("stdroom_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delStudioRoom(params) {
    const { error } = await supabase
      .from("studios_rooms")
      .delete()
      .eq("stdroom_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
