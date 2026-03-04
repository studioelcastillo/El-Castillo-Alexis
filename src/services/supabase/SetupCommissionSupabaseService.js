import { supabase } from "../../supabaseClient";
import { normalizeQueryString } from "./queryUtils";

const buildSegments = (items) => {
  const palette = ["#21ba45", "#31ccec", "#e67828", "#7c4dff", "#ff5722", "#00bcd4"];
  const sorted = [...(items || [])].sort(
    (a, b) => (a.setcommitem_limit || 0) - (b.setcommitem_limit || 0)
  );
  let prevLimit = 0;
  return sorted.map((item, index) => {
    const limit = Number(item.setcommitem_limit) || 0;
    const value = Number(item.setcommitem_value) || 0;
    const percentage = Math.max(limit - prevLimit, 0) || limit || 1;
    prevLimit = Math.max(limit, prevLimit);
    return {
      percentage,
      color: palette[index % palette.length],
      label: `${value}`,
      labelLimitter: `${limit}`,
    };
  });
};

export default {
  async getSetupCommissionOptions(params) {
    const { data, error } = await supabase
      .from("setup_commissions")
      .select("setcomm_id, setcomm_title, studios(std_name)")
      .order("setcomm_title", { ascending: true });

    const mapped = (data || []).map((row) => ({
      label: `${row.setcomm_title}${row.studios?.std_name ? ` (${row.studios.std_name})` : ""}`,
      value: row.setcomm_id,
    }));
    return { data: { data: mapped }, error };
  },

  async getCommissions(params) {
    let query = supabase
      .from("setup_commissions")
      .select("*, studios(std_id, std_name), setup_commissions_item(*)");

    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      const studios = queryParams.get("studios");
      if (studios) {
        const list = studios
          .split(",")
          .map((val) => Number(val))
          .filter((val) => !Number.isNaN(val));
        if (list.length) query = query.in("std_id", list);
      }
    }

    const { data, error } = await query;
    const mapped = (data || []).map((row) => ({
      ...row,
      studio: row.studios || null,
      items: row.setup_commissions_item || [],
    }));
    return { data: { data: mapped }, error };
  },

  async addCommission(params) {
    const { data, error } = await supabase
      .from("setup_commissions")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async addCommissionItem(params) {
    const { data, error } = await supabase
      .from("setup_commissions_item")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async getCommission(params) {
    const { data, error } = await supabase
      .from("setup_commissions")
      .select("*, studios(std_id, std_name), setup_commissions_item(*)")
      .eq("setcomm_id", params.id)
      .single();

    const items = data ? data.setup_commissions_item || [] : [];
    const mapped = data
      ? {
          ...data,
          studio: data.studios || null,
          items,
        }
      : null;

    return { data: { data: mapped || {}, items: buildSegments(items) }, error };
  },

  async editCommission(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("setup_commissions")
      .update(updateData)
      .eq("setcomm_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async editCommissionItem(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("setup_commissions_item")
      .update(updateData)
      .eq("setcommitem_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async delCommission(params) {
    const { error } = await supabase
      .from("setup_commissions")
      .delete()
      .eq("setcomm_id", params.id);
    return { data: { status: error ? "error" : "success" }, error };
  },

  async deleteCommissionItem(params) {
    const { error } = await supabase
      .from("setup_commissions_item")
      .delete()
      .eq("setcommitem_id", params.id);
    return { data: { status: error ? "error" : "success" }, error };
  },
};
