import { supabase } from "../../supabaseClient";

const SUBSCRIPTION_KEY = "subscription_data";
const INVOICES_KEY = "subscription_invoices";

const buildDefaultSubscription = () => {
  const today = new Date();
  const next = new Date();
  next.setDate(today.getDate() + 30);
  const days = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    status: "ACTIVE",
    active_users_count: 1,
    current_tier_index: 0,
    next_billing_date: next.toISOString().split("T")[0],
    days_until_due: days,
    plan_name: "Plan Fortaleza",
    autopay_enabled: true,
    last_payment_method: "CARD",
  };
};

export default {
  async getSubscription() {
    const { data, error } = await supabase
      .from("settings")
      .select("set_value")
      .eq("set_key", SUBSCRIPTION_KEY)
      .maybeSingle();

    if (data?.set_value) {
      try {
        const parsed = JSON.parse(data.set_value);
        return { data: { data: { ...buildDefaultSubscription(), ...parsed } }, error };
      } catch (parseError) {
        return { data: { data: buildDefaultSubscription() }, error: parseError };
      }
    }

    return { data: { data: buildDefaultSubscription() }, error };
  },

  async getInvoices() {
    const { data, error } = await supabase
      .from("settings")
      .select("set_value")
      .eq("set_key", INVOICES_KEY)
      .maybeSingle();

    if (data?.set_value) {
      try {
        return { data: { data: JSON.parse(data.set_value) }, error };
      } catch (parseError) {
        return { data: { data: [] }, error: parseError };
      }
    }

    return { data: { data: [] }, error };
  },

  async saveSubscription(params) {
    const subscription = params?.subscription || params?.data || params;
    const { error } = await supabase
      .from("settings")
      .upsert(
        [
          {
            set_key: SUBSCRIPTION_KEY,
            set_value: JSON.stringify(subscription),
            set_description: "Subscription data",
          },
        ],
        { onConflict: "set_key" }
      );

    return { data: { data: subscription, status: error ? "Error" : "Success" }, error };
  },

  async saveInvoices(params) {
    const invoices = params?.invoices || params?.data || params;
    const { error } = await supabase
      .from("settings")
      .upsert(
        [
          {
            set_key: INVOICES_KEY,
            set_value: JSON.stringify(invoices),
            set_description: "Subscription invoices",
          },
        ],
        { onConflict: "set_key" }
      );

    return { data: { data: invoices, status: error ? "Error" : "Success" }, error };
  },
};
