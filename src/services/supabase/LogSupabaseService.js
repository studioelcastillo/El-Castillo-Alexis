import { supabase } from "../../supabaseClient";
import { normalizeQueryString } from "./queryUtils";

const mapLogRow = (row) => ({
  ...row,
  log_table: row.log_entity,
  log_table_id: row.log_entity_id,
});

const mapSortColumn = (sortBy) => {
  if (!sortBy) return "log_id";
  if (sortBy === "log_table") return "log_entity";
  if (sortBy === "log_table_id") return "log_entity_id";
  return sortBy;
};

const mapFilterColumns = (columns) => {
  const mapped = [];
  (columns || []).forEach((column) => {
    if (column === "log_table") mapped.push("log_entity");
    else if (column === "log_table_id") mapped.push("log_entity_id");
    else mapped.push(column);
  });
  return mapped;
};

export default {
  async getLogs(params = {}) {
    const filters = normalizeQueryString(params.filters);
    const start = Number(filters.get("start") || 0);
    const length = Number(filters.get("length") || 0);
    const filterValue = (filters.get("filter") || "").trim();
    const sortBy = mapSortColumn(filters.get("sortby"));
    const dir = (filters.get("dir") || "DESC").toUpperCase();
    const columns = (filters.get("columns") || "").split(",").filter(Boolean);

    let query = supabase
      .from("logs")
      .select("*", { count: "exact" });

    if (filterValue) {
      const filterColumns = mapFilterColumns(columns);
      const orFilters = (filterColumns.length ? filterColumns : ["log_id", "log_entity", "log_entity_id", "log_action", "created_at"]) 
        .map((column) => `${column}.ilike.%${filterValue}%`)
        .join(",");
      query = query.or(orFilters);
    }

    query = query.order(sortBy, { ascending: dir !== "DESC" });

    if (length > 0) {
      query = query.range(start, start + length - 1);
    }

    const { data, error, count } = await query;
    const mapped = (data || []).map(mapLogRow);

    return {
      data: { data: mapped, recordsTotal: count || 0 },
      recordsTotal: count || 0,
      error,
    };
  },

  async getLogsWithFilers(params) {
    return this.getLogs(params);
  },

  async getLog(params) {
    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .eq("log_id", params.id)
      .single();
    return { data: { data: data ? [mapLogRow(data)] : [] }, error };
  },
};
