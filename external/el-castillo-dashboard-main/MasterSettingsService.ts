
import { GlobalSettings, AuditLog } from './types';

// Estado inicial simulado (Base de Datos)
let currentSettings: GlobalSettings = {
  payment: {
    bank_name: 'Bancolombia',
    account_type: 'AHORROS',
    account_number: '032-123456-78',
    account_holder: 'El Castillo Group SAS',
    holder_id: '900.123.456-1',
    email_notifications: 'pagos@elcastillo.app',
    instructions: 'Por favor incluir el ID de Estudio en la referencia de pago.'
  },
  support: {
    whatsapp_number: '+57 300 123 4567',
    email_support: 'soporte@elcastillo.app',
    hours_operation: 'Lunes a Viernes 8:00 AM - 6:00 PM',
    help_center_url: 'https://ayuda.elcastillo.app'
  },
  company: {
    brand_name: 'El Castillo',
    legal_name: 'El Castillo Group SAS',
    nit: '900.123.456-1',
    address: 'Av. Roosevelt # 24-55',
    city: 'Cali',
    country: 'Colombia'
  },
  last_updated: new Date().toISOString(),
  updated_by: 'Sistema'
};

let auditLogs: AuditLog[] = [
  { id: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'Admin Principal', action: 'UPDATE_PAYMENT', details: 'Actualización cuenta bancaria' }
];

const MasterSettingsService = {
  getSettings: async (): Promise<GlobalSettings> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...currentSettings };
  },

  updateSettings: async (newSettings: Partial<GlobalSettings>, user: string): Promise<GlobalSettings> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Detectar cambios para auditoría (simplificado)
    const changes: string[] = [];
    if (JSON.stringify(newSettings.payment) !== JSON.stringify(currentSettings.payment)) changes.push('Datos de Pago');
    if (JSON.stringify(newSettings.support) !== JSON.stringify(currentSettings.support)) changes.push('Datos de Soporte');
    if (JSON.stringify(newSettings.company) !== JSON.stringify(currentSettings.company)) changes.push('Datos de Empresa');

    currentSettings = {
      ...currentSettings,
      ...newSettings,
      last_updated: new Date().toISOString(),
      updated_by: user
    };

    // Registrar auditoría
    if (changes.length > 0) {
      auditLogs.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: user,
        action: 'UPDATE_SETTINGS',
        details: `Modificación en: ${changes.join(', ')}`
      });
    }

    return { ...currentSettings };
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...auditLogs];
  }
};

export default MasterSettingsService;
