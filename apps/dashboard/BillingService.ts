import { supabase } from './supabaseClient';
import { SubscriptionData, InvoiceRecord } from './types';

const SUBSCRIPTION_KEY = 'subscription_data';
const INVOICES_KEY = 'subscription_invoices';

const buildDefaultSubscription = (): SubscriptionData => {
  const today = new Date();
  const next = new Date();
  next.setDate(today.getDate() + 30);
  const days = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    status: 'ACTIVE',
    active_users_count: 1,
    current_tier_index: 0,
    next_billing_date: next.toISOString().split('T')[0],
    days_until_due: days,
    plan_name: 'Plan Fortaleza',
    autopay_enabled: true,
    last_payment_method: 'CARD',
  };
};

const BillingService = {
  async getSubscription(): Promise<SubscriptionData> {
    const { data } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', SUBSCRIPTION_KEY)
      .maybeSingle();

    if (data?.set_value) {
      try {
        const parsed = JSON.parse(data.set_value);
        return { ...buildDefaultSubscription(), ...parsed } as SubscriptionData;
      } catch {
        return buildDefaultSubscription();
      }
    }

    return buildDefaultSubscription();
  },

  async getInvoices(): Promise<InvoiceRecord[]> {
    const { data } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', INVOICES_KEY)
      .maybeSingle();

    if (data?.set_value) {
      try {
        return JSON.parse(data.set_value) as InvoiceRecord[];
      } catch {
        return [];
      }
    }

    return [];
  },

  async saveSubscription(subscription: SubscriptionData) {
    await supabase
      .from('settings')
      .upsert(
        [
          {
            set_key: SUBSCRIPTION_KEY,
            set_value: JSON.stringify(subscription),
            set_description: 'Subscription data',
          },
        ],
        { onConflict: 'set_key' }
      );
  },

  async saveInvoices(invoices: InvoiceRecord[]) {
    await supabase
      .from('settings')
      .upsert(
        [
          {
            set_key: INVOICES_KEY,
            set_value: JSON.stringify(invoices),
            set_description: 'Subscription invoices',
          },
        ],
        { onConflict: 'set_key' }
      );
  },
};

export default BillingService;
