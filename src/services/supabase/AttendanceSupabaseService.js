import { supabase } from "../../supabaseClient";

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export default {
  async getDailyAttendance(params) {
    const date = params?.date || params;
    const { data, error } = await supabase
      .from("attendance_daily")
      .select("*")
      .eq("att_date", date)
      .order("full_name", { ascending: true });

    const rows = (data || []).map((row) => ({
      id: String(row.att_day_id),
      user_id: row.user_id,
      full_name: row.full_name || "Usuario",
      role: row.role_name || "MODELO",
      date: row.att_date,
      shift_name: row.shift_name || "",
      check_in: row.check_in || undefined,
      check_out: row.check_out || undefined,
      worked_minutes: row.worked_minutes || 0,
      expected_minutes: row.expected_minutes || 0,
      late_minutes: row.late_minutes || 0,
      early_leave_minutes: row.early_leave_minutes || 0,
      overtime_minutes: row.overtime_minutes || 0,
      debt_minutes: row.debt_minutes || 0,
      status: row.status || "PRESENT",
    }));

    return { data: { data: rows }, error };
  },

  async getOnSitePresence() {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("attendance_daily")
      .select("user_id, full_name, role_name, check_in, check_out")
      .eq("att_date", today)
      .is("check_out", null);

    const userIds = (data || []).map((row) => row.user_id).filter(Boolean);
    const { data: users } = userIds.length
      ? await supabase
          .from("users")
          .select("user_id, user_photo_url, std_id")
          .in("user_id", userIds)
      : { data: [] };

    const studioIds = [...new Set((users || []).map((u) => u.std_id).filter(Boolean))];
    const { data: studios } = studioIds.length
      ? await supabase
          .from("studios")
          .select("std_id, std_name")
          .in("std_id", studioIds)
      : { data: [] };

    const studioMap = new Map((studios || []).map((row) => [row.std_id, row.std_name]));
    const userMap = new Map((users || []).map((row) => [row.user_id, row]));

    const rows = (data || []).map((row) => {
      const user = userMap.get(row.user_id);
      return {
        user_id: row.user_id,
        full_name: row.full_name || "Usuario",
        role: row.role_name || "MODELO",
        check_in_time: row.check_in ? new Date(row.check_in).toLocaleTimeString() : "--",
        location: user?.std_id ? studioMap.get(user.std_id) || "Sede" : "Sede",
        photo_url: user?.user_photo_url || undefined,
      };
    });

    return { data: { data: rows }, error };
  },

  async getDevices() {
    const { data, error } = await supabase
      .from("attendance_devices")
      .select("*")
      .order("device_alias", { ascending: true });

    const rows = (data || []).map((row) => ({
      id: String(row.att_device_id),
      studio_id: String(row.std_id || ""),
      sn: row.device_sn,
      alias: row.device_alias || row.device_sn,
      ip_address: row.device_ip || undefined,
      area_name: row.device_area_name || undefined,
      last_sync_at: row.last_sync_at || undefined,
      status: row.device_status || "OFFLINE",
    }));

    return { data: { data: rows }, error };
  },

  async getValuationSettings() {
    const { data, error } = await supabase
      .from("settings")
      .select("set_value")
      .eq("set_key", "attendance_valuation")
      .maybeSingle();

    if (data?.set_value) {
      try {
        const parsed = JSON.parse(data.set_value);
        return {
          data: {
            data: {
              minute_debt_price: toNumber(parsed.minute_debt_price),
              hour_debt_price: toNumber(parsed.hour_debt_price),
              overtime_hour_price: toNumber(parsed.overtime_hour_price),
              currency: parsed.currency || "COP",
            },
          },
          error,
        };
      } catch (parseError) {
        return { data: { data: null }, error: parseError };
      }
    }

    return {
      data: {
        data: {
          minute_debt_price: 200,
          hour_debt_price: 12000,
          overtime_hour_price: 15000,
          currency: "COP",
        },
      },
      error,
    };
  },

  async syncTransactions() {
    return { data: { data: { success: true, count: 0 } }, error: null };
  },
};
