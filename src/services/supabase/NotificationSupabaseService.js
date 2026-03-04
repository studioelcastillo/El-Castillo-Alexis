import { supabase } from "../../supabaseClient";
import { normalizeQueryString } from "./queryUtils";

const applyNotificationFilters = (query, filterParams) => {
  if (filterParams.has("noti_type")) {
    const typeValue = filterParams.get("noti_type");
    if (typeValue === "null") {
      query = query.is("noti_type", null);
    } else if (typeValue) {
      query = query.eq("noti_type", typeValue);
    }
  }
  return query;
};

export default {
  async getNotifications(params = {}) {
    const filters = normalizeQueryString(params.filters);
    const start = Number(filters.get("start") || 0);
    const length = Number(filters.get("length") || 0);

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.user_id) query = query.eq("user_id_to_notify", params.user_id);
    query = applyNotificationFilters(query, filters);

    if (length > 0) {
      query = query.range(start, start + length - 1);
    }

    const { data, error, count } = await query;

    let unreadQuery = supabase
      .from("notifications")
      .select("noti_id", { count: "exact", head: true })
      .eq("noti_read", false);
    if (params.user_id) unreadQuery = unreadQuery.eq("user_id_to_notify", params.user_id);
    unreadQuery = applyNotificationFilters(unreadQuery, filters);
    const { count: noReadCount } = await unreadQuery;

    return {
      data: {
        data: data || [],
        recordsTotal: count || 0,
        NoRead: noReadCount || 0,
      },
      error,
    };
  },

  async getNotificationsData(params = {}) {
    let query = supabase
      .from("notifications")
      .select("noti_type, noti_read");

    if (params.user_id) query = query.eq("user_id_to_notify", params.user_id);

    const { data, error } = await query;
    const typesMap = new Map();
    const noReadMap = new Map();

    (data || []).forEach((row) => {
      const typeKey = row.noti_type === null ? null : row.noti_type;
      if (!typesMap.has(typeKey)) {
        typesMap.set(typeKey, { noti_type: typeKey });
      }
      if (!row.noti_read) {
        noReadMap.set(typeKey, (noReadMap.get(typeKey) || 0) + 1);
      }
    });

    const types = Array.from(typesMap.values());
    const NoRead = Array.from(noReadMap.entries()).map(([noti_type, count]) => ({
      noti_type,
      noRead: count,
    }));

    return { data: { types, NoRead }, error };
  },

  async getNotification(params) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("noti_id", params.id)
      .single();
    return { data: { data: data ? [data] : [] }, error };
  },

  async addNotification(params) {
    const { data, error } = await supabase
      .from("notifications")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editNotification(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("noti_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delNotification(params) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("noti_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async markAsRead(params) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ noti_read: true })
      .eq("noti_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async readNotification(params) {
    return this.markAsRead(params);
  },
};
