
import { MOCK_USERS } from './constants';

// --- TYPES ---

export interface RemoteDevice {
    id: string;
    name: string;
    groups: string[];
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    last_seen: string;
    os: 'WINDOWS' | 'MAC' | 'LINUX';
    version: string;
    ip_address: string;
    unattended_enabled: boolean;
    current_session_id?: string;
    tags: string[];
    monitors_count: number;
    preview_url?: string;
    preview_updated_at?: string;
}

export interface RemoteSession {
    id: string;
    device_id: string;
    user_id: number;
    user_name: string;
    start_time: string;
    end_time?: string;
    permissions: {
        control: boolean;
        audio_sys: boolean;
        audio_mic: boolean;
        file_transfer: boolean;
    };
    status: 'ACTIVE' | 'ENDED';
}

export interface AccessPolicy {
    id: string;
    name: string;
    allow_unattended: boolean;
    require_consent: boolean;
    allow_audio: boolean;
    allow_control: boolean;
    allowed_roles: string[];
}

export interface AuditLog {
    id: string;
    timestamp: string;
    actor: string;
    action: 'CONNECT' | 'DISCONNECT' | 'KEY_ROTATE' | 'POLICY_CHANGE' | 'REVOKE';
    target: string;
    details: string;
    ip: string;
}

// --- MOCK DATA ---

let localDevices: RemoteDevice[] = [
    { 
        id: 'dev_001', 
        name: 'PC-RECEPCION-01', 
        groups: ['Recepción', 'Sede Norte'], 
        status: 'ONLINE', 
        last_seen: new Date().toISOString(), 
        os: 'WINDOWS', 
        version: '1.2.0', 
        ip_address: '192.168.1.10', 
        unattended_enabled: true, 
        tags: ['Principal', 'Caja'], 
        monitors_count: 2,
        preview_url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=400&auto=format&fit=crop',
        preview_updated_at: new Date().toISOString()
    },
    { 
        id: 'dev_002', 
        name: 'PC-MODELO-ROOM-101', 
        groups: ['Habitaciones', 'Sede Sur'], 
        status: 'ONLINE', 
        last_seen: new Date().toISOString(), 
        os: 'WINDOWS', 
        version: '1.2.0', 
        ip_address: '192.168.1.101', 
        unattended_enabled: true, 
        tags: ['Room 101', 'Stream'], 
        monitors_count: 1,
        preview_url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=400&auto=format&fit=crop',
        preview_updated_at: new Date().toISOString()
    },
    { id: 'dev_003', name: 'PC-MODELO-ROOM-102', groups: ['Habitaciones'], status: 'OFFLINE', last_seen: new Date(Date.now() - 3600000).toISOString(), os: 'WINDOWS', version: '1.1.9', ip_address: '192.168.1.102', unattended_enabled: true, tags: ['Room 102', 'Stream'], monitors_count: 1 },
    { id: 'dev_004', name: 'LAPTOP-ADMIN-01', groups: ['Administración', 'Sede Norte'], status: 'BUSY', last_seen: new Date().toISOString(), os: 'MAC', version: '2.0.1', ip_address: '192.168.1.50', unattended_enabled: false, current_session_id: 'sess_999', tags: ['Gerencia'], monitors_count: 1 },
    { id: 'dev_005', name: 'SRV-DATA-01', groups: ['Servidores'], status: 'ONLINE', last_seen: new Date().toISOString(), os: 'LINUX', version: '3.5.0', ip_address: '10.0.0.5', unattended_enabled: true, tags: ['Backend', 'Critical'], monitors_count: 0 },
];

let localSessions: RemoteSession[] = [
    { id: 'sess_999', device_id: 'dev_004', user_id: 1, user_name: 'Admin', start_time: new Date(Date.now() - 1800000).toISOString(), permissions: { control: true, audio_sys: false, audio_mic: false, file_transfer: true }, status: 'ACTIVE' }
];

let localAuditLogs: AuditLog[] = [
    { id: 'log_1', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: 'Admin', action: 'KEY_ROTATE', target: 'PC-RECEPCION-01', details: 'Rotación programada de clave de acceso', ip: '10.0.0.1' },
    { id: 'log_2', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'Monitor Sofia', action: 'CONNECT', target: 'PC-MODELO-ROOM-101', details: 'Sesión de soporte iniciada', ip: '192.168.1.20' },
];

// --- SERVICE ---

const RemoteDesktopService = {
    getDevices: async (): Promise<RemoteDevice[]> => {
        await new Promise(r => setTimeout(r, 400));
        // Simulate preview updates for online devices
        localDevices = localDevices.map(d => {
            if (d.status === 'ONLINE' || d.status === 'BUSY') {
                return {
                    ...d,
                    preview_updated_at: new Date().toISOString()
                };
            }
            return d;
        });
        return [...localDevices];
    },

    getSession: async (sessionId: string): Promise<RemoteSession | undefined> => {
        return localSessions.find(s => s.id === sessionId);
    },

    connect: async (deviceId: string, options: { control: boolean, audio: 'NONE'|'SYS'|'MIC'|'BOTH' }) => {
        await new Promise(r => setTimeout(r, 1000));
        const device = localDevices.find(d => d.id === deviceId);
        if (!device) throw new Error("Dispositivo no encontrado");
        if (device.status === 'OFFLINE') throw new Error("El dispositivo está desconectado");

        const newSession: RemoteSession = {
            id: `sess_${Date.now()}`,
            device_id: deviceId,
            user_id: 1, // Mock current user
            user_name: 'Usuario Actual',
            start_time: new Date().toISOString(),
            permissions: {
                control: options.control,
                audio_sys: options.audio === 'SYS' || options.audio === 'BOTH',
                audio_mic: options.audio === 'MIC' || options.audio === 'BOTH',
                file_transfer: false
            },
            status: 'ACTIVE'
        };
        
        localSessions.push(newSession);
        // Update device status
        const devIndex = localDevices.findIndex(d => d.id === deviceId);
        if (devIndex >= 0) {
            localDevices[devIndex] = { ...localDevices[devIndex], status: 'BUSY', current_session_id: newSession.id };
        }

        // Log audit
        localAuditLogs.unshift({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: 'Usuario Actual',
            action: 'CONNECT',
            target: device.name,
            details: `Conexión iniciada (Control: ${options.control}, Audio: ${options.audio})`,
            ip: '127.0.0.1'
        });

        return newSession;
    },

    disconnect: async (sessionId: string) => {
        const sessionIdx = localSessions.findIndex(s => s.id === sessionId);
        if (sessionIdx >= 0) {
            const session = localSessions[sessionIdx];
            localSessions[sessionIdx] = { ...session, status: 'ENDED', end_time: new Date().toISOString() };
            
            // Free device
            const devIndex = localDevices.findIndex(d => d.id === session.device_id);
            if (devIndex >= 0) {
                localDevices[devIndex] = { ...localDevices[devIndex], status: 'ONLINE', current_session_id: undefined };
            }

            // Log
            localAuditLogs.unshift({
                id: `log_${Date.now()}_end`,
                timestamp: new Date().toISOString(),
                actor: session.user_name,
                action: 'DISCONNECT',
                target: localDevices[devIndex]?.name || 'Unknown',
                details: 'Sesión finalizada',
                ip: '127.0.0.1'
            });
        }
    },

    rotateKey: async (deviceId: string) => {
        await new Promise(r => setTimeout(r, 800));
        localAuditLogs.unshift({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: 'SuperAdmin',
            action: 'KEY_ROTATE',
            target: localDevices.find(d => d.id === deviceId)?.name || deviceId,
            details: 'Rotación manual de clave de acceso no asistido',
            ip: '127.0.0.1'
        });
        return { success: true, new_key_hash: '*******' };
    },

    getAuditLogs: async () => {
        return [...localAuditLogs];
    },

    // --- POLICIES ---
    getPolicies: async (): Promise<AccessPolicy[]> => {
        return [
            { id: 'pol_1', name: 'Default Security', allow_unattended: true, require_consent: false, allow_audio: false, allow_control: true, allowed_roles: ['ADMIN', 'SOPORTE'] },
            { id: 'pol_2', name: 'High Privacy', allow_unattended: false, require_consent: true, allow_audio: false, allow_control: false, allowed_roles: ['ADMIN'] },
            { id: 'pol_3', name: 'Full Access (Dev)', allow_unattended: true, require_consent: false, allow_audio: true, allow_control: true, allowed_roles: ['ADMIN', 'DEV'] }
        ];
    },

    updatePolicy: async (policy: AccessPolicy) => {
        await new Promise(r => setTimeout(r, 500));
        return policy;
    },

    // --- AUTO-ENROLLMENT & HEARTBEAT ---

    autoEnroll: async (deviceData: { device_uuid: string, hostname: string, os: 'WINDOWS'|'MAC'|'LINUX', version: string, monitors: number }) => {
        await new Promise(r => setTimeout(r, 1000));
        const newDevice: RemoteDevice = {
            id: `dev_${Date.now()}`,
            name: deviceData.hostname,
            groups: ['Sin Asignar'],
            status: 'ONLINE',
            last_seen: new Date().toISOString(),
            os: deviceData.os,
            version: deviceData.version,
            ip_address: '10.0.0.' + Math.floor(Math.random() * 255),
            unattended_enabled: false,
            tags: ['Auto-Enrolled'],
            monitors_count: deviceData.monitors,
            preview_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=400&auto=format&fit=crop',
            preview_updated_at: new Date().toISOString()
        };
        localDevices.push(newDevice);
        
        localAuditLogs.unshift({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: 'SYSTEM',
            action: 'CONNECT', // Using CONNECT as a proxy for ENROLL
            target: newDevice.name,
            details: 'Dispositivo auto-enrolado exitosamente',
            ip: newDevice.ip_address
        });
        
        return newDevice;
    },

    sendHeartbeat: async (deviceId: string) => {
        const devIndex = localDevices.findIndex(d => d.id === deviceId);
        if (devIndex >= 0) {
            localDevices[devIndex] = {
                ...localDevices[devIndex],
                status: 'ONLINE',
                last_seen: new Date().toISOString()
            };
        }
    },

    updatePreview: async (deviceId: string, previewUrl: string) => {
        const devIndex = localDevices.findIndex(d => d.id === deviceId);
        if (devIndex >= 0) {
            localDevices[devIndex] = {
                ...localDevices[devIndex],
                preview_url: previewUrl,
                preview_updated_at: new Date().toISOString()
            };
        }
    },

    updateDevice: async (deviceId: string, updates: Partial<RemoteDevice>) => {
        await new Promise(r => setTimeout(r, 600));
        const devIndex = localDevices.findIndex(d => d.id === deviceId);
        if (devIndex >= 0) {
            localDevices[devIndex] = { ...localDevices[devIndex], ...updates };
            
            localAuditLogs.unshift({
                id: `log_${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Usuario Actual',
                action: 'POLICY_CHANGE', // Using POLICY_CHANGE as generic update action
                target: localDevices[devIndex].name,
                details: 'Actualización de metadatos del dispositivo',
                ip: '127.0.0.1'
            });
            
            return localDevices[devIndex];
        }
        throw new Error("Dispositivo no encontrado");
    }
};

export default RemoteDesktopService;
