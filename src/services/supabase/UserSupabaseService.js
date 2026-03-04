import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

const getDefaultPassword = (identification) => {
  const digits = String(identification || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.slice(-5);
};

const mapProfile = (row) => ({
  ...row,
  profile: row.profiles || null,
});

const mapUsersWithStudios = async (rows) => {
  const users = rows || [];
  const userIds = users.map((row) => row.user_id).filter(Boolean);

  if (userIds.length === 0) return users;

  const { data: studioModels } = await supabase
    .from("studios_models")
    .select("stdmod_id, user_id_model, studios(std_name)")
    .in("user_id_model", userIds);

  const { data: ownedStudios } = await supabase
    .from("studios")
    .select("std_name, user_id_owner")
    .in("user_id_owner", userIds);

  const stdmodIds = (studioModels || [])
    .map((row) => row.stdmod_id)
    .filter(Boolean);
  const { data: modelAccounts } = stdmodIds.length
    ? await supabase
        .from("models_accounts")
        .select("modacc_username, stdmod_id")
        .in("stdmod_id", stdmodIds)
    : { data: [] };

  const studiosByUser = new Map();
  (studioModels || []).forEach((row) => {
    if (!row.studios) return;
    const existing = studiosByUser.get(row.user_id_model) || new Set();
    existing.add(row.studios.std_name);
    studiosByUser.set(row.user_id_model, existing);
  });

  (ownedStudios || []).forEach((row) => {
    const existing = studiosByUser.get(row.user_id_owner) || new Set();
    existing.add(row.std_name);
    studiosByUser.set(row.user_id_owner, existing);
  });

  const accountsByUser = new Map();
  const stdmodToUser = new Map();
  (studioModels || []).forEach((row) => {
    if (!row.stdmod_id) return;
    stdmodToUser.set(row.stdmod_id, row.user_id_model);
  });

  (modelAccounts || []).forEach((row) => {
    const userId = stdmodToUser.get(row.stdmod_id);
    if (!userId) return;
    const existing = accountsByUser.get(userId) || new Set();
    if (row.modacc_username) existing.add(row.modacc_username);
    accountsByUser.set(userId, existing);
  });

  return users.map((row) => {
    const studios = studiosByUser.get(row.user_id);
    const accounts = accountsByUser.get(row.user_id);
    return {
      ...row,
      studios: studios ? Array.from(studios).join(";") : null,
      studio_model: accounts ? Array.from(accounts).join(";") : null,
      toggleActive: row.user_active,
    };
  });
};

const mapSelectOption = (row) => ({
  ...row,
  label: `${row.user_name || ""} ${row.user_surname || ""}`.trim(),
  value: row.user_id,
});

export default {
  async getUsersDatatable(params) {
    let query = supabase
      .from("users")
      .select("*, profiles(prof_name)", { count: "exact" });

    if (params.searchterm) {
      query = query.or(
        `user_name.ilike.%${params.searchterm}%,user_surname.ilike.%${params.searchterm}%,user_identification.ilike.%${params.searchterm}%`
      );
    }

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      const studios = queryParams.get("studios");
      const profiles = queryParams.get("profiles");
      const activeUsers = queryParams.get("activeusers");
      const filterValue = (queryParams.get("filter") || "").trim();
      const sortByRaw = queryParams.get("sortby") || "created_at";
      const dir = (queryParams.get("dir") || "DESC").toUpperCase();
      const start = Number(queryParams.get("start") || 0);
      const length = Number(queryParams.get("length") || 0);
      const columns = (queryParams.get("columns") || "")
        .split(",")
        .map((col) => col.replace(/^users\./, ""))
        .filter((col) => col && !col.startsWith("ma."));

      if (activeUsers === "true" || activeUsers === "false") {
        query = query.eq("user_active", activeUsers === "true");
      }

      if (profiles) {
        const list = profiles
          .split(",")
          .map((val) => Number(val))
          .filter((val) => !Number.isNaN(val));
        if (list.length) query = query.in("prof_id", list);
      }

      if (studios) {
        const studioList = studios
          .split(",")
          .map((val) => Number(val))
          .filter((val) => !Number.isNaN(val));
        if (studioList.length) {
          const { data: stdmods } = await supabase
            .from("studios_models")
            .select("user_id_model")
            .in("std_id", studioList);
          const userIds = [
            ...new Set((stdmods || []).map((row) => row.user_id_model)),
          ];
          if (userIds.length) {
            query = query.in("user_id", userIds);
          } else {
            query = query.in("user_id", [0]);
          }
        }
      }

      if (filterValue) {
        const filterColumns = columns.length
          ? columns
          : ["user_name", "user_surname", "user_identification", "user_email"];
        const orFilters = filterColumns
          .map((column) => `${column}.ilike.%${filterValue}%`)
          .join(",");
        query = query.or(orFilters);
      }

      const sortBy = sortByRaw.includes(".")
        ? sortByRaw.split(".").pop()
        : sortByRaw;
      query = query.order(sortBy, { ascending: dir !== "DESC" });

      if (length > 0) {
        query = query.range(start, start + length - 1);
      }
    }

    const { data, error, count } = await query;
    const mapped = await mapUsersWithStudios((data || []).map(mapProfile));
    return { data: { data: mapped, recordsTotal: count || 0 }, error };
  },

  async getUsers(params) {
    let query = supabase.from("users").select("*, profiles(prof_name)");

    if (params.user_id) {
      query = query.eq("user_id", params.id);
    }

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    return { data: { data: (data || []).map(mapProfile) }, error };
  },

  async getUser(params) {
    const { data, error } = await supabase
      .from("users")
      .select(
        "*, profiles(prof_name), city:city_id(*, department:dpto_id(*, country:country_id(*)))"
      )
      .eq("user_id", params.id);

    // El frontend espera un array en data.data
    return { data: { data: (data || []).map(mapProfile) }, error };
  },

  async addUser(params) {
    const { user_email, user_password, ...rest } = params;
    const resolvedPassword =
      user_password || getDefaultPassword(rest.user_identification);

    if (!resolvedPassword) {
      return {
        data: { data: null, status: "Error" },
        error: "Missing user password",
      };
    }

    try {
      // 1. Crear el usuario en Supabase Auth
      // Usamos un cliente temporal sin persistencia para no cerrar la sesión del admin actual
      const tempClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: authData, error: authError } = await tempClient.auth.signUp(
        {
          email: user_email,
          password: resolvedPassword,
        }
      );

      if (authError) throw authError;

      // 2. Insertar en la tabla pública vinculando el auth_user_id
      const publicUser = {
        ...rest,
        user_email,
        user_password: resolvedPassword, // Mantenemos por compatibilidad con el esquema, aunque no es lo ideal
        auth_user_id: authData.user.id,
      };

      const { data, error } = await supabase
        .from("users")
        .insert([publicUser])
        .select()
        .single();

      if (error) throw error;

      return { data: { data: data, status: "Success" }, error: null };
    } catch (err) {
      console.error("Error in addUser:", err);
      return {
        data: { data: null, status: "Error" },
        error: err.message || err,
      };
    }
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
    const { error: uploadError } = await supabase.storage
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
    let query = supabase
      .from("users")
      .select(
        "*, profiles(prof_name), studios_models(stdmod_id, stdmod_contract_number, studios(std_id, std_name))"
      );

    const searchValue = params.searchterm || params.search || "";
    if (searchValue) {
      query = query.or(
        `user_name.ilike.%${searchValue}%,user_surname.ilike.%${searchValue}%,user_identification.ilike.%${searchValue}%`
      );
    }
    if (params.prof_id) {
      query = query.eq("prof_id", params.prof_id);
    }
    if (params.prof_ids && params.prof_ids.length) {
      query = query.in("prof_id", params.prof_ids);
    }

    const { data, error } = await query;
    const mapped = (data || []).map((row) => ({
      ...mapSelectOption(row),
      studio_model: (row.studios_models || []).map((sm) => ({
        ...sm,
        studio: sm.studios || null,
      })),
    }));
    return { data: { data: mapped }, error };
  },

  async getModelsByOwnerStudio(params) {
    return this.getUsersByOwnerStudio(params);
  },

  async getUserStdmods(params) {
    const { data, error } = await supabase
      .from("studios_models")
      .select("*, studios(std_id, std_name)")
      .eq("user_id_model", params.id);

    const mapped = (data || []).map((row) => ({
      ...row,
      studio: row.studios || null,
    }));
    return { data: { data: mapped }, error };
  },

  async activateUser(params) {
    const { data, error } = await supabase
      .from("users")
      .update({ user_active: true })
      .eq("user_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async inactivateUser(params) {
    const { data, error } = await supabase
      .from("users")
      .update({ user_active: false })
      .eq("user_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async delUser(params) {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", params.id);
    return { data: { status: error ? "error" : "success" }, error };
  },

  async changePassword(params) {
    const { id, user_password } = params;

    // 1. Actualizar en la tabla pública users (compatibilidad)
    const { data, error } = await supabase
      .from("users")
      .update({ user_password })
      .eq("user_id", id)
      .select("user_id, auth_user_id")
      .single();

    if (error) {
      return { data: { data: null, status: "error" }, error };
    }

    // 2. Actualizar en Supabase Auth via Edge Function (cambio real de contraseña)
    if (data?.auth_user_id) {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        const response = await fetch(
          `${process.env.SUPABASE_URL}/functions/v1/admin-change-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              auth_user_id: data.auth_user_id,
              new_password: user_password,
            }),
          }
        );

        const result = await response.json();
        if (!response.ok) {
          console.warn("[changePassword] Auth update warning:", result.error);
        }
      } catch (edgeFnErr) {
        console.warn(
          "[changePassword] Edge Function error:",
          edgeFnErr.message
        );
      }
    }

    return { data: { data: data, status: "success" }, error: null };
  },

  async overwriteUser(params) {
    const {
      id,
      additional_models,
      additional_models_todelete,
      token,
      ...updateData
    } = params;
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async getUsersCoincide(params) {
    const user = params.user || {};
    const matches = new Map();
    let unsubmittable = false;

    const selectFields =
      "user_id, user_identification, user_name, user_surname, user_birthdate, user_email";

    if (user.identification) {
      const { data } = await supabase
        .from("users")
        .select(selectFields)
        .eq("user_identification", user.identification);
      (data || []).forEach((row) => matches.set(row.user_id, row));
      if ((data || []).length > 0) unsubmittable = true;
    }

    if (user.email) {
      const { data } = await supabase
        .from("users")
        .select(selectFields)
        .eq("user_email", user.email);
      (data || []).forEach((row) => matches.set(row.user_id, row));
      if ((data || []).length > 0) unsubmittable = true;
    }

    if (user.name && user.surname) {
      let query = supabase
        .from("users")
        .select(selectFields)
        .ilike("user_name", user.name)
        .ilike("user_surname", user.surname);

      if (user.birthdate) {
        query = query.eq("user_birthdate", user.birthdate);
      }

      const { data } = await query;
      (data || []).forEach((row) => matches.set(row.user_id, row));
    }

    if (user.id) {
      matches.delete(user.id);
    }

    return {
      data: {
        data: Array.from(matches.values()),
        unsubmittable,
      },
    };
  },
};
