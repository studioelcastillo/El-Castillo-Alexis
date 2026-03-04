import { supabase } from './supabaseClient';
import { GlobalSettings, AuditLog } from './types';

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
    const { data, error } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error('Global settings error', error);
    }

    if (data?.set_value) {
      try {
        return { ...defaultSettings, ...JSON.parse(data.set_value) } as GlobalSettings;
      } catch {
        return { ...defaultSettings };
      }
    }

    return { ...defaultSettings };
  },

  async updateSettings(newSettings: Partial<GlobalSettings>, user: string): Promise<GlobalSettings> {
    const current = await MasterSettingsService.getSettings();
    const updated: GlobalSettings = {
      ...current,
      ...newSettings,
      last_updated: new Date().toISOString(),
      updated_by: user,
    };

    await supabase
      .from('settings')
      .upsert(
        [
          {
            set_key: SETTINGS_KEY,
            set_value: JSON.stringify(updated),
            set_description: 'Global settings',
          },
        ],
        { onConflict: 'set_key' }
      );

    const auditEntry: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: user || 'Sistema',
      action: 'UPDATE_SETTINGS',
      details: 'Actualización de configuración global',
    };

    const logs = await MasterSettingsService.getAuditLogs();
    const nextLogs = [auditEntry, ...logs].slice(0, 200);

    await supabase
      .from('settings')
      .upsert(
        [
          {
            set_key: AUDIT_KEY,
            set_value: JSON.stringify(nextLogs),
            set_description: 'Global settings audit',
          },
        ],
        { onConflict: 'set_key' }
      );

    return updated;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', AUDIT_KEY)
      .maybeSingle();

    if (error) {
      console.error('Global settings audit error', error);
      return [];
    }

    if (data?.set_value) {
      try {
        return JSON.parse(data.set_value) as AuditLog[];
      } catch {
        return [];
      }
    }

    return [];
  },
};

export default MasterSettingsService;
