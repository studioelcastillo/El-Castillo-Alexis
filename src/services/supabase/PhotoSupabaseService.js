import { supabase } from "../../supabaseClient";

const BUCKET = "el-castillo";

const toPublicUrl = (path) =>
  path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : "";

const mapAsset = (row) => ({
  id: String(row.photo_asset_id),
  request_id: String(row.photo_req_id),
  drive_file_id: row.drive_file_id || "",
  drive_url: row.file_url ? toPublicUrl(row.file_url) : "",
  preview_url: row.preview_url ? toPublicUrl(row.preview_url) : "",
  type: row.asset_type || "PHOTO",
  created_at: row.created_at || new Date().toISOString(),
});

const mapRequest = (row) => ({
  id: String(row.photo_req_id),
  studio_id: String(row.std_id || ""),
  requester_id: row.requester_id,
  requester_name: row.requester_name || "",
  type: row.photo_type,
  objective: row.objective || "",
  location: row.location || "",
  proposed_date: row.proposed_date || "",
  proposed_time: row.proposed_time || "",
  duration_minutes: row.duration_minutes || 60,
  confirmed_date: row.confirmed_date || undefined,
  style_references: row.style_references || "",
  requires_makeup: row.requires_makeup === true,
  makeup_artist_id: row.makeup_artist_id || undefined,
  makeup_artist_name: row.makeup_artist_name || undefined,
  photographer_id: row.photographer_id || undefined,
  status: row.status || "SENT",
  priority: row.priority || "NORMAL",
  assets: (row.photo_assets || []).map(mapAsset),
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
  history_log: row.history_log || [],
});

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export default {
  async getRequests(params) {
    const filters = params || {};
    let query = supabase
      .from("photo_requests")
      .select("*, photo_assets(*)")
      .order("created_at", { ascending: false });

    if (filters.studioId) {
      query = query.eq("std_id", Number(filters.studioId));
    }
    if (filters.role === "MODELO" && filters.userId) {
      query = query.eq("requester_id", filters.userId);
    }

    const { data, error } = await query;
    return { data: { data: (data || []).map(mapRequest) }, error };
  },

  async createRequest(params) {
    const request = params || {};
    const payload = {
      std_id: Number(request.studio_id) || 1,
      requester_id: request.requester_id,
      requester_name: request.requester_name,
      photo_type: request.type || "FOTO",
      objective: request.objective || "CONTENIDO",
      location: request.location || "Sede Principal",
      proposed_date: request.proposed_date,
      proposed_time: request.proposed_time,
      duration_minutes: request.duration_minutes || 60,
      style_references: request.style_references || "",
      requires_makeup: request.requires_makeup || false,
      makeup_artist_id: request.makeup_artist_id || null,
      makeup_artist_name: request.makeup_artist_name || null,
      status: "SENT",
      priority: request.priority || "NORMAL",
      history_log: [
        {
          user: request.requester_name || "Usuario",
          action: "Solicitud Creada",
          date: new Date().toISOString(),
        },
      ],
    };

    const { data: row, error } = await supabase
      .from("photo_requests")
      .insert([payload])
      .select("*")
      .single();

    const mapped = row ? mapRequest({ ...row, photo_assets: [] }) : null;
    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async updateStatus(params) {
    const id = params?.id || params?.photo_req_id || params?.request_id;
    const status = params?.status;
    const user = params?.user || "Sistema";
    const notes = params?.notes;
    const rescheduleData = params?.rescheduleData;

    const { data: current } = await supabase
      .from("photo_requests")
      .select("*")
      .eq("photo_req_id", id)
      .single();

    if (!current) {
      return { data: { status: "Error", message: "Request not found" }, error: new Error("Request not found") };
    }

    const history = current.history_log || [];
    history.push({
      user,
      action: `Cambio estado a ${status}${notes ? ` (${notes})` : ""}`,
      date: new Date().toISOString(),
    });

    const payload = {
      status,
      history_log: history,
      updated_at: new Date().toISOString(),
    };

    if (status === "CONFIRMED" || status === "ACCEPTED") {
      if (!current.confirmed_date) {
        payload.confirmed_date = `${current.proposed_date}T${current.proposed_time || "00:00"}:00`;
      }
    }

    if (status === "RESCHEDULE_PROPOSED" && rescheduleData) {
      payload.proposed_date = rescheduleData.date;
      payload.proposed_time = rescheduleData.time;
    }

    const { data: row, error } = await supabase
      .from("photo_requests")
      .update(payload)
      .eq("photo_req_id", id)
      .select("*, photo_assets(*)")
      .single();

    return { data: { data: row ? mapRequest(row) : null, status: error ? "Error" : "Success" }, error };
  },

  async uploadAsset(params) {
    const requestId = params?.requestId || params?.photo_req_id || params?.id;
    const file = params?.file || params?.files;
    if (!file) {
      return { data: { status: "Error", message: "Missing file" }, error: new Error("Missing file") };
    }

    const filePath = `photo_assets/${requestId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { data: { status: "Error" }, error: uploadError };
    }

    const { data: row, error } = await supabase
      .from("photo_assets")
      .insert([
        {
          photo_req_id: requestId,
          asset_type: file.type && file.type.startsWith("video") ? "VIDEO" : "PHOTO",
          file_url: filePath,
          preview_url: filePath,
          drive_file_id: null,
        },
      ])
      .select("*")
      .single();

    return { data: { data: row ? mapAsset(row) : null, status: error ? "Error" : "Success" }, error };
  },

  async getCalendarEvents() {
    const { data: requests, error } = await supabase
      .from("photo_requests")
      .select("*")
      .in("status", ["CONFIRMED", "IN_PROGRESS", "DELIVERED", "ACCEPTED"]);

    const events = (requests || []).map((r) => {
      const start = r.confirmed_date || `${r.proposed_date}T${r.proposed_time || "00:00"}:00`;
      const endDate = new Date(start);
      endDate.setMinutes(endDate.getMinutes() + (r.duration_minutes || 60));
      return {
        id: String(r.photo_req_id),
        title: `${r.requester_name || "Modelo"} - ${r.photo_type}`,
        start,
        end: endDate.toISOString(),
        type: "SHOOT",
        status: r.status,
        resourceId: r.photographer_id || undefined,
      };
    });

    const { data: blocks } = await supabase
      .from("photo_calendar_events")
      .select("*")
      .eq("event_type", "BLOCK");

    (blocks || []).forEach((b) => {
      events.push({
        id: `block_${b.photo_event_id}`,
        title: b.title,
        start: b.start_at,
        end: b.end_at,
        type: "BLOCK",
        status: b.event_status || undefined,
        resourceId: b.resource_id || undefined,
      });
    });

    return { data: { data: events }, error };
  },

  async submitRating(params) {
    const rating = params || {};
    const { data: row, error } = await supabase
      .from("photo_ratings")
      .insert([
        {
          photo_req_id: rating.request_id,
          from_user_id: rating.from_user_id,
          to_user_id: rating.to_user_id,
          role_target: rating.role_target,
          score: rating.score,
          aspects: rating.aspects || {},
          comment: rating.comment || null,
        },
      ])
      .select("*")
      .single();

    await supabase
      .from("photo_requests")
      .update({ status: "RATED", updated_at: new Date().toISOString() })
      .eq("photo_req_id", rating.request_id);

    const mapped = row
      ? {
          id: String(row.photo_rating_id),
          request_id: String(row.photo_req_id),
          from_user_id: row.from_user_id,
          to_user_id: row.to_user_id,
          role_target: row.role_target,
          score: row.score,
          aspects: row.aspects || {},
          comment: row.comment || undefined,
          created_at: row.created_at || new Date().toISOString(),
        }
      : null;

    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async getDashboardStats() {
    const { data: requests, error: reqError } = await supabase.from("photo_requests").select("*");
    const { data: ratings, error: ratingError } = await supabase.from("photo_ratings").select("*");

    const total_requests = (requests || []).length;

    const confirmationTimes = (requests || [])
      .filter((r) => r.confirmed_date && r.created_at)
      .map((r) => (new Date(r.confirmed_date).getTime() - new Date(r.created_at).getTime()) / 3600000);

    const avg_confirmation_time_hours = confirmationTimes.length
      ? confirmationTimes.reduce((a, b) => a + b, 0) / confirmationTimes.length
      : 0;

    const deliveryTimes = (requests || [])
      .filter((r) => r.status === "DELIVERED" && r.created_at && r.updated_at)
      .map((r) => (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 3600000);

    const avg_delivery_time_hours = deliveryTimes.length
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0;

    const ratingPhotographer = (ratings || []).filter((r) => r.role_target === "PHOTOGRAPHER");
    const ratingMakeup = (ratings || []).filter((r) => r.role_target === "MAKEUP");

    const rating_photographer_avg = ratingPhotographer.length
      ? ratingPhotographer.reduce((a, b) => a + toNumber(b.score), 0) / ratingPhotographer.length
      : 0;
    const rating_makeup_avg = ratingMakeup.length
      ? ratingMakeup.reduce((a, b) => a + toNumber(b.score), 0) / ratingMakeup.length
      : 0;

    const reschedule_rate = total_requests
      ? ((requests || []).filter((r) => r.status === "RESCHEDULE_PROPOSED").length / total_requests) * 100
      : 0;

    const status_distribution = Array.from(
      (requests || []).reduce((map, row) => {
        const key = row.status || "UNKNOWN";
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map())
    ).map(([name, value]) => ({ name, value }));

    const stats = {
      total_requests,
      avg_confirmation_time_hours: Number(avg_confirmation_time_hours.toFixed(2)),
      avg_delivery_time_hours: Number(avg_delivery_time_hours.toFixed(2)),
      rating_photographer_avg: Number(rating_photographer_avg.toFixed(2)),
      rating_makeup_avg: Number(rating_makeup_avg.toFixed(2)),
      reschedule_rate: Number(reschedule_rate.toFixed(2)),
      status_distribution,
      top_photographers: [],
    };

    return { data: { data: stats }, error: reqError || ratingError || null };
  },
};
