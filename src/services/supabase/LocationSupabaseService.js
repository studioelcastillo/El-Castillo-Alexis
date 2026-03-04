import { supabase } from "../../supabaseClient";

const mapLocationHierarchy = (rows) => {
  const countriesMap = new Map();

  (rows || []).forEach((row) => {
    const countryName = row.loc_country || null;
    if (!countryName) return;

    if (!countriesMap.has(countryName)) {
      countriesMap.set(countryName, {
        country_id: countryName,
        country_name: countryName,
        departments: [],
      });
    }

    const country = countriesMap.get(countryName);
    const departmentName = row.loc_department || null;
    if (!departmentName) return;

    let department = country.departments.find(
      (dep) => dep.dpto_id === departmentName
    );

    if (!department) {
      department = {
        dpto_id: departmentName,
        dpto_name: departmentName,
        cities: [],
      };
      country.departments.push(department);
    }

    const cityName = row.loc_city || null;
    if (!cityName) return;

    department.cities.push({
      city_id: row.loc_id,
      city_name: cityName,
    });
  });

  return Array.from(countriesMap.values());
};

export default {
  async getLocations() {
    const { data, error } = await supabase
      .from("locations")
      .select("loc_id, loc_country, loc_department, loc_city")
      .order("loc_country", { ascending: true })
      .order("loc_department", { ascending: true })
      .order("loc_city", { ascending: true });

    return { data: { data: mapLocationHierarchy(data) }, error };
  },

  async getCountries() {
    const { data, error } = await supabase
      .from("locations")
      .select("loc_country")
      .order("loc_country", { ascending: true });

    if (data) {
      const uniqueCountries = [
        ...new Set(data.map((item) => item.loc_country).filter(Boolean)),
      ];
      return {
        data: {
          data: uniqueCountries.map((c) => ({
            country_id: c,
            country_name: c,
          })),
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
      const uniqueDepts = [
        ...new Set(data.map((item) => item.loc_department).filter(Boolean)),
      ];
      return {
        data: {
          data: uniqueDepts.map((d) => ({ dpto_id: d, dpto_name: d })),
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
          data: data
            .filter((row) => row.loc_city)
            .map((c) => ({ city_id: c.loc_id, city_name: c.loc_city })),
        },
      };
    }
    return { data: { data: [] }, error };
  },

  async addCountry(params) {
    const { data, error } = await supabase
      .from("locations")
      .insert([{ loc_country: params.country_name }])
      .select()
      .single();

    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async editCountry(params) {
    const { id, country_name } = params;
    const { data, error } = await supabase
      .from("locations")
      .update({ loc_country: country_name })
      .eq("loc_country", id)
      .select();

    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async addDepartment(params) {
    const { data, error } = await supabase
      .from("locations")
      .insert([
        {
          loc_country: params.country_id,
          loc_department: params.dpto_name,
        },
      ])
      .select()
      .single();

    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async editDepartment(params) {
    const { id, dpto_name } = params;
    const { data, error } = await supabase
      .from("locations")
      .update({ loc_department: dpto_name })
      .eq("loc_department", id)
      .select();

    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async addCity(params) {
    let country = null;
    const { data: countryData } = await supabase
      .from("locations")
      .select("loc_country")
      .eq("loc_department", params.dpto_id)
      .limit(1)
      .maybeSingle();

    if (countryData) {
      country = countryData.loc_country;
    }

    const { data, error } = await supabase
      .from("locations")
      .insert([
        {
          loc_country: country,
          loc_department: params.dpto_id,
          loc_city: params.city_name,
        },
      ])
      .select()
      .single();

    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async editCity(params) {
    const { id, city_name } = params;
    const { data, error } = await supabase
      .from("locations")
      .update({ loc_city: city_name })
      .eq("loc_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async delCountry(params) {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("loc_country", params.id);

    return { data: { status: error ? "error" : "success" }, error };
  },

  async delDepartment(params) {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("loc_department", params.id);

    return { data: { status: error ? "error" : "success" }, error };
  },

  async delCity(params) {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("loc_id", params.id);

    return { data: { status: error ? "error" : "success" }, error };
  },
};
