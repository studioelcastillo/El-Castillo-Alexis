import { SubscriptionData, InvoiceRecord } from './types';
import { getCurrentStudioId } from './tenant';
import { getTenantJsonSetting, upsertTenantSetting } from './tenantSettings';

const SUBSCRIPTION_KEY = 'subscription_data';
const INVOICES_KEY = 'subscription_invoices';

const BillingService = {
  async getSubscription(): Promise<SubscriptionData | null> {
    return getTenantJsonSetting<SubscriptionData | null>(SUBSCRIPTION_KEY, null, getCurrentStudioId());
  },

  async getInvoices(): Promise<InvoiceRecord[]> {
    return getTenantJsonSetting<InvoiceRecord[]>(INVOICES_KEY, [], getCurrentStudioId());
  },

  async saveSubscription(subscription: SubscriptionData) {
    await upsertTenantSetting(SUBSCRIPTION_KEY, subscription, 'Subscription data', getCurrentStudioId());
  },

  async saveInvoices(invoices: InvoiceRecord[]) {
    await upsertTenantSetting(INVOICES_KEY, invoices, 'Subscription invoices', getCurrentStudioId());
  },
};

export default BillingService;
