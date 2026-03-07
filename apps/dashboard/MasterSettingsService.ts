import { GlobalSettings, AuditLog } from './types';
import { getCurrentStudioId } from './tenant';
import { getTenantJsonSetting, upsertTenantSetting } from './tenantSettings';

const SETTINGS_KEY = 'global_settings';
const AUDIT_KEY = 'global_settings_audit';

const defaultSettings: GlobalSettings = {
  payment: {
    bank_name: '',
    account_type: '',
    account_number: '',
    account_holder: '',
    holder_id: '',
    email_notifications: '',
    instructions: '',
  },
  support: {
    whatsapp_number: '',
    email_support: '',
    hours_operation: '',
    help_center_url: '',
  },
  company: {
    brand_name: '',
    legal_name: '',
    nit: '',
    address: '',
    city: '',
    country: '',
  },
  last_updated: undefined,
  updated_by: undefined,
};

const MasterSettingsService = {
  async getSettings(): Promise<GlobalSettings> {
    const data = await getTenantJsonSetting<Partial<GlobalSettings>>(SETTINGS_KEY, {}, getCurrentStudioId());
    return { ...defaultSettings, ...data } as GlobalSettings;
  },

  async updateSettings(newSettings: Partial<GlobalSettings>, user: string): Promise<GlobalSettings> {
    const current = await MasterSettingsService.getSettings();
    const updated: GlobalSettings = {
      ...current,
      ...newSettings,
      last_updated: new Date().toISOString(),
      updated_by: user,
    };

    await upsertTenantSetting(SETTINGS_KEY, updated, 'Global settings', getCurrentStudioId());

    const auditEntry: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: user || 'Sistema',
      action: 'UPDATE_SETTINGS',
      details: 'Actualización de configuración global',
    };

    const logs = await MasterSettingsService.getAuditLogs();
    const nextLogs = [auditEntry, ...logs].slice(0, 200);

    await upsertTenantSetting(AUDIT_KEY, nextLogs, 'Global settings audit', getCurrentStudioId());

    return updated;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return getTenantJsonSetting<AuditLog[]>(AUDIT_KEY, [], getCurrentStudioId());
  },
};

export default MasterSettingsService;
