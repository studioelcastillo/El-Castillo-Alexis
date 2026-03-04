import { supabase } from "../../supabaseClient";

export default {
  async getProfiles(params) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("prof_name", { ascending: true });

    return { data: { data: data || [] }, error };
  },
};
