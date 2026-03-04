import { supabase } from "../../supabaseClient";
import { normalizeQueryString } from "./queryUtils";

const mapSortColumn = (sortBy) => {
  if (!sortBy) return "lhist_id";
  if (sortBy === "lgnhist_id") return "lhist_id";
  if (sortBy === "lgnhist_login" || sortBy === "lgnhist_logout") return "created_at";
  return sortBy;
};

export default {
  async getHistory(params = {}) {
    const filters = normalizeQueryString(params.filters);
    const start = Number(filters.get("start") || 0);
    const length = Number(filters.get("length") || 0);
    const filterValue = (filters.get("filter") || "").trim();
    const sortBy = mapSortColumn(filters.get("sortby"));
    const dir = (filters.get("dir") || "DESC").toUpperCase();

    let query = supabase
      .from("login_history")
      .select("*, users(user_name, user_surname)", { count: "exact" });

    if (params.user_id) query = query.eq("user_id", params.user_id);

    if (filterValue) {
      query = query.or(
        `lhist_id.ilike.%${filterValue}%,lhist_ip.ilike.%${filterValue}%,lhist_device.ilike.%${filterValue}%,users.user_name.ilike.%${filterValue}%,users.user_surname.ilike.%${filterValue}%`
      );
    }

    query = query.order(sortBy, { ascending: dir !== "DESC" });

    if (length > 0) {
      query = query.range(start, start + length - 1);
    }

    const { data, error, count } = await query;
    const mapped = (data || []).map((row) => ({
      ...row,
      lgnhist_id: row.lhist_id,
      lgnhist_login: row.created_at,
      lgnhist_logout: row.lhist_logout || null,
      user_name: row.users ? row.users.user_name : null,
      user_surname: row.users ? row.users.user_surname : null,
    }));

    return { data: { data: mapped, recordsTotal: count || 0 }, error };
  },
};
