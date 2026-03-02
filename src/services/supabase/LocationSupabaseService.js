import { supabase } from "../../boot/supabase";

export default {
  async getCountries(params) {
    const { data, error } = await supabase
      .from("locations")
      .select("loc_country")
      .order("loc_country", { ascending: true });

    // Simular jerarquía: obtener únicos y mapear a {label, value}
    if (data) {
      const uniqueCountries = [
        ...new Set(data.map((item) => item.loc_country)),
      ];
      return {
        data: {
          data: uniqueCountries.map((c) => ({ label: c, value: c })),
        },
      };
    }
    return { data: { data: [] }, error };
  },

  async getDepartments(params) {
    const { data, error } = await supabase
      .from("locations")
      .select("loc_department")
      .eq("loc_country", params.country_id)
      .order("loc_department", { ascending: true });

    if (data) {
      const uniqueDepts = [...new Set(data.map((item) => item.loc_department))];
      return {
        data: {
          data: uniqueDepts.map((d) => ({ label: d, value: d })),
        },
      };
    }
    return { data: { data: [] }, error };
  },

  async getCities(params) {
    const { data, error } = await supabase
      .from("locations")
      .select("loc_id, loc_city")
      .eq("loc_department", params.dpto_id)
      .order("loc_city", { ascending: true });

    if (data) {
      return {
        data: {
          data: data.map((c) => ({ label: c.loc_city, value: c.loc_id })),
        },
      };
    }
    return { data: { data: [] }, error };
  },
};
