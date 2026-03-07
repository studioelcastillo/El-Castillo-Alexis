import { getCurrentStudioId } from './tenant';
import { getTenantJsonSetting, upsertTenantSetting } from './tenantSettings';

const LICENSE_CLIENTS_KEY = 'license_clients';
const LICENSE_REVENUE_KEY = 'license_revenue_data';

type LicenseClient = {
  id: string;
  studioName: string;
  adminName: string;
  email: string;
  totalLicenses: number;
  subStudiosCount: number;
  plan: string;
  nextBillingDate: string;
  daysUntilDue: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  paymentMethod: string;
  monthlyValue: number;
  isExempt?: boolean;
};

type RevenuePoint = {
  month: string;
  revenue: number;
  licenses: number;
};

const toNumber = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : null);

const normalizeDate = (value: any) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const computeStatus = (nextBillingDate: string | null, isExempt: boolean) => {
  if (isExempt) return { status: 'ACTIVE' as const, daysUntilDue: 9999 };
  if (!nextBillingDate) return { status: 'ACTIVE' as const, daysUntilDue: 0 };
  const today = new Date();
  const target = new Date(nextBillingDate);
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { status: 'EXPIRED' as const, daysUntilDue: diffDays };
  if (diffDays <= 5) return { status: 'EXPIRING_SOON' as const, daysUntilDue: diffDays };
  return { status: 'ACTIVE' as const, daysUntilDue: diffDays };
};

const normalizeClient = (raw: any): LicenseClient | null => {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id ?? raw.client_id ?? raw.std_id ?? '').trim();
  const studioName = String(raw.studioName ?? raw.studio_name ?? raw.std_name ?? '').trim();
  const adminName = String(raw.adminName ?? raw.admin_name ?? raw.owner_name ?? raw.manager_name ?? raw.std_manager_name ?? '').trim();
  const email = String(raw.email ?? raw.admin_email ?? raw.owner_email ?? '').trim();
  const plan = String(raw.plan ?? raw.plan_name ?? '').trim();
  const totalLicenses = toNumber(raw.totalLicenses ?? raw.total_licenses ?? raw.licenses);
  const subStudiosCount = toNumber(raw.subStudiosCount ?? raw.sub_studios_count ?? raw.sub_studios);
  const monthlyValue = toNumber(raw.monthlyValue ?? raw.monthly_value ?? raw.plan_value);
  const paymentMethod = String(raw.paymentMethod ?? raw.payment_method ?? '').trim();
  const isExempt = raw.isExempt ?? raw.is_exempt ?? false;
  const nextBillingDate = normalizeDate(raw.nextBillingDate ?? raw.next_billing_date);

  if (!id || !studioName || !plan || totalLicenses === null || monthlyValue === null) {
    return null;
  }

  const statusInfo = computeStatus(nextBillingDate, Boolean(isExempt));

  return {
    id,
    studioName,
    adminName,
    email,
    totalLicenses,
    subStudiosCount: subStudiosCount ?? 0,
    plan,
    nextBillingDate: nextBillingDate || '',
    daysUntilDue: statusInfo.daysUntilDue,
    status: raw.status ?? statusInfo.status,
    paymentMethod,
    monthlyValue,
    isExempt: Boolean(isExempt),
  };
};

const normalizeRevenue = (raw: any): RevenuePoint | null => {
  if (!raw || typeof raw !== 'object') return null;
  const month = String(raw.month ?? raw.label ?? '').trim();
  const revenue = toNumber(raw.revenue ?? raw.amount ?? raw.total);
  const licenses = toNumber(raw.licenses ?? raw.license_count ?? raw.count);
  if (!month || revenue === null || licenses === null) return null;
  return { month, revenue, licenses };
};

const LicenseService = {
  async getOverview(): Promise<{ clients: LicenseClient[]; revenueData: RevenuePoint[] }> {
    const studioId = getCurrentStudioId();
    const [clientsRaw, revenueRaw] = await Promise.all([
      getTenantJsonSetting<any[]>(LICENSE_CLIENTS_KEY, [], studioId),
      getTenantJsonSetting<any[]>(LICENSE_REVENUE_KEY, [], studioId),
    ]);

    const clients = Array.isArray(clientsRaw)
      ? clientsRaw.map(normalizeClient).filter(Boolean) as LicenseClient[]
      : [];
    const revenueData = Array.isArray(revenueRaw)
      ? revenueRaw.map(normalizeRevenue).filter(Boolean) as RevenuePoint[]
      : [];

    return { clients, revenueData };
  },

  async saveClients(clients: LicenseClient[]) {
    await upsertTenantSetting(LICENSE_CLIENTS_KEY, clients, 'License control clients', getCurrentStudioId());
  },

  async saveRevenueData(revenueData: RevenuePoint[]) {
    await upsertTenantSetting(LICENSE_REVENUE_KEY, revenueData, 'License control revenue data', getCurrentStudioId());
  },
};

export default LicenseService;
