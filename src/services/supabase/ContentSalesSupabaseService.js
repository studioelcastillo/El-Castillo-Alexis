import { supabase } from "../../supabaseClient";

const TODAY = new Date().toISOString().split("T")[0];

export default {
  async getEligibleModels(params) {
    const studioId = params?.studioId || params?.std_id || params?.studio_id || params;
    const { data, error } = await supabase
      .from("content_tasks")
      .select("*")
      .eq("std_id", Number(studioId));

    const rows = (data || [])
      .filter((row) => row.completed_date !== TODAY)
      .map((row) => ({
        id: String(row.content_task_id),
        studio_id: String(row.std_id),
        model_user_id: row.model_user_id,
        model_name: row.model_name || "",
        model_avatar: row.model_avatar || undefined,
        status: row.status || "PENDING",
        streamate_hours: row.streamate_hours || 0,
        platforms: row.platforms || [],
        scheduled_at: row.scheduled_at || undefined,
        created_at: row.created_at || new Date().toISOString(),
        assigned_to_user_id: row.assigned_to_user_id || undefined,
        assigned_name: row.assigned_name || undefined,
        completed_at: row.completed_at || undefined,
        completed_date: row.completed_date || undefined,
      }));

    return { data: { data: rows }, error };
  },

  async getAssets(params) {
    const status = params?.status || params;
    let query = supabase.from("content_assets").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;

    const rows = (data || []).map((row) => ({
      id: String(row.content_asset_id),
      studio_id: String(row.std_id || ""),
      model_user_id: row.model_user_id,
      model_name: row.model_name || "",
      type: row.asset_type || "PHOTO",
      preview_url: row.preview_url || "",
      file_url: row.file_url || "",
      status: row.status || "PENDING_REVIEW",
      tags_json: row.tags_json || [],
      created_at: row.created_at || new Date().toISOString(),
    }));

    return { data: { data: rows }, error };
  },

  async updateAssetStatus(params) {
    const id = params?.id || params?.content_asset_id || params;
    const status = params?.status || params?.asset_status;
    const { error } = await supabase
      .from("content_assets")
      .update({ status })
      .eq("content_asset_id", id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async createTask(params) {
    const data = params || {};
    const payload = {
      std_id: Number(data.studio_id) || 1,
      model_user_id: data.model_user_id,
      model_name: data.model_name,
      model_avatar: data.model_avatar || null,
      status: "SCHEDULED",
      streamate_hours: data.streamate_hours || 0,
      platforms: data.platforms || [],
      scheduled_at: data.scheduled_at || null,
    };

    const { data: row, error } = await supabase
      .from("content_tasks")
      .insert([payload])
      .select("*")
      .single();

    const mapped = row
      ? {
          id: String(row.content_task_id),
          studio_id: String(row.std_id || ""),
          model_user_id: row.model_user_id,
          model_name: row.model_name || "",
          model_avatar: row.model_avatar || undefined,
          status: row.status || "SCHEDULED",
          streamate_hours: row.streamate_hours || 0,
          platforms: row.platforms || [],
          scheduled_at: row.scheduled_at || undefined,
          created_at: row.created_at || new Date().toISOString(),
          assigned_to_user_id: row.assigned_to_user_id || undefined,
          assigned_name: row.assigned_name || undefined,
        }
      : null;

    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async assignTask(params) {
    const taskId = params?.taskId || params?.content_task_id || params?.id;
    const userId = params?.userId || params?.assigned_to_user_id;
    const userName = params?.userName || params?.assigned_name;
    const { error } = await supabase
      .from("content_tasks")
      .update({ assigned_to_user_id: userId, assigned_name: userName })
      .eq("content_task_id", taskId);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async markAsDone(params) {
    const taskId = params?.taskId || params?.content_task_id || params?.id;
    const { error } = await supabase
      .from("content_tasks")
      .update({
        status: "DONE",
        completed_at: new Date().toISOString(),
        completed_date: TODAY,
      })
      .eq("content_task_id", taskId);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async getPlatforms() {
    const { data, error } = await supabase
      .from("content_platforms")
      .select("*")
      .eq("is_active", true)
      .order("platform_name", { ascending: true });

    const rows = (data || []).map((row) => ({
      id: String(row.content_platform_id),
      studio_id: String(row.std_id || ""),
      name: row.platform_name,
      icon: row.icon || "Instagram",
      is_active: row.is_active !== false,
      color: row.color || "text-slate-500",
    }));

    return { data: { data: rows }, error };
  },
};
