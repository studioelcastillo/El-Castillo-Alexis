import { supabase } from "../../supabaseClient";

const SETTINGS_KEY = "global_settings";

const DEFAULT_SETTINGS = {
  payment: {
    bank_name: "Bancolombia",
    account_type: "AHORROS",
    account_number: "032-123456-78",
    account_holder: "El Castillo Group SAS",
    holder_id: "900.123.456-1",
    email_notifications: "pagos@elcastillo.app",
    instructions: "Incluir el ID de Estudio en la referencia de pago.",
  },
  support: {
    whatsapp_number: "+57 300 123 4567",
    email_support: "soporte@elcastillo.app",
    hours_operation: "Lunes a Viernes 8:00 AM - 6:00 PM",
    help_center_url: "https://ayuda.elcastillo.app",
  },
  company: {
    brand_name: "El Castillo",
    legal_name: "El Castillo Group SAS",
    nit: "900.123.456-1",
    address: "Av. Roosevelt # 24-55",
    city: "Cali",
    country: "Colombia",
  },
  last_updated: new Date().toISOString(),
  updated_by: "Sistema",
};

export default {
  async getSettings() {
    const { data, error } = await supabase
      .from("settings")
      .select("set_value")
      .eq("set_key", SETTINGS_KEY)
      .maybeSingle();

    if (data?.set_value) {
      try {
        const parsed = JSON.parse(data.set_value);
        return { data: { data: { ...DEFAULT_SETTINGS, ...parsed } }, error };
      } catch (parseError) {
        return { data: { data: { ...DEFAULT_SETTINGS } }, error: parseError };
      }
    }

    return { data: { data: { ...DEFAULT_SETTINGS } }, error };
  },

  async updateSettings(params) {
    const newSettings = params?.settings || params?.data || params;
    const user = params?.user || params?.updated_by || "Sistema";
    const currentResponse = await this.getSettings();
    const current = currentResponse?.data?.data || DEFAULT_SETTINGS;

    const updated = {
      ...current,
      ...newSettings,
      payment: { ...current.payment, ...(newSettings?.payment || {}) },
      support: { ...current.support, ...(newSettings?.support || {}) },
      company: { ...current.company, ...(newSettings?.company || {}) },
      last_updated: new Date().toISOString(),
      updated_by: user,
    };

    const { error } = await supabase
      .from("settings")
      .upsert(
        [
          {
            set_key: SETTINGS_KEY,
            set_value: JSON.stringify(updated),
            set_description: "Global configuration settings",
          },
        ],
        { onConflict: "set_key" }
      );

    await supabase.from("logs").insert([
      {
        user_id: null,
        log_action: "UPDATE_SETTINGS",
        log_entity: "settings",
        log_entity_id: SETTINGS_KEY,
        log_old_data: current,
        log_new_data: updated,
        log_ip: null,
      },
    ]);

    return { data: { data: updated, status: error ? "Error" : "Success" }, error };
  },

  async getAuditLogs() {
    const { data, error } = await supabase
      .from("logs")
      .select("log_id, log_action, log_new_data, created_at")
      .eq("log_entity", "settings")
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = (data || []).map((row) => ({
      id: String(row.log_id),
      timestamp: row.created_at,
      user: "Sistema",
      action: row.log_action,
      details: row.log_new_data ? "Actualizacion de configuracion" : "",
    }));

    return { data: { data: rows }, error };
  },
};
