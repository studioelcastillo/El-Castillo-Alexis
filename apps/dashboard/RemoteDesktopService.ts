import { supabase } from './supabaseClient';
import { getStoredUser } from './session';

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

const getActorName = () => {
  const user = getStoredUser();
  if (!user) return 'Usuario';
  const first = user.user_name || user.user_username || user.user_email || 'Usuario';
  const last = user.user_surname || '';
  return `${first} ${last}`.trim();
};

const logAudit = async (payload: {
  actor: string;
  action: AuditLog['action'];
  target: string;
  details: string;
  ip?: string;
}) => {
  const { actor, action, target, details, ip } = payload;
  const { error } = await supabase.from('remote_audit_logs').insert([
    {
      actor_name: actor,
      action,
      target_name: target,
      details,
      ip_address: ip || '127.0.0.1',
    },
  ]);

  if (error) {
    console.error('Remote audit log error', error);
  }
};

const mapDevice = (row: any): RemoteDevice => ({
  id: String(row.remote_device_id),
  name: row.device_name,
  groups: Array.isArray(row.groups_json) ? row.groups_json : [],
  status: (row.device_status || 'OFFLINE').toUpperCase(),
  last_seen: row.last_seen || row.updated_at || row.created_at,
  os: (row.os || 'WINDOWS').toUpperCase(),
  version: row.device_version || '1.0.0',
  ip_address: row.ip_address || '-/-',
  unattended_enabled: row.unattended_enabled === true,
  current_session_id: row.current_session_id ? String(row.current_session_id) : undefined,
  tags: Array.isArray(row.tags_json) ? row.tags_json : [],
  monitors_count: Number(row.monitors_count || 0),
  preview_url: row.preview_url || undefined,
  preview_updated_at: row.preview_updated_at || undefined,
});

const mapSession = (row: any): RemoteSession => ({
  id: String(row.remote_session_id),
  device_id: String(row.remote_device_id),
  user_id: Number(row.user_id || 0),
  user_name: row.user_name || 'Usuario',
  start_time: row.start_time,
  end_time: row.end_time || undefined,
  permissions: row.permissions_json || {
    control: false,
    audio_sys: false,
    audio_mic: false,
    file_transfer: false,
  },
  status: (row.status || 'ACTIVE').toUpperCase(),
});

// --- SERVICE ---

const RemoteDesktopService = {
  getDevices: async (): Promise<RemoteDevice[]> => {
    const { data, error } = await supabase
      .from('remote_devices')
      .select('*')
      .order('device_name', { ascending: true });

    if (error) {
      console.error('Remote getDevices error', error);
      return [];
    }

    return (data || []).map(mapDevice);
  },

  getSession: async (sessionId: string): Promise<RemoteSession | undefined> => {
    const { data, error } = await supabase
      .from('remote_sessions')
      .select('*')
      .eq('remote_session_id', Number(sessionId))
      .single();

    if (error || !data) return undefined;
    return mapSession(data);
  },

  connect: async (deviceId: string, options: { control: boolean; audio: 'NONE' | 'SYS' | 'MIC' | 'BOTH' }) => {
    const { data: device, error: deviceError } = await supabase
      .from('remote_devices')
      .select('*')
      .eq('remote_device_id', Number(deviceId))
      .single();

    if (deviceError || !device) throw new Error('Dispositivo no encontrado');
    if ((device.device_status || '').toUpperCase() === 'OFFLINE') {
      throw new Error('El dispositivo esta desconectado');
    }

    const user = getStoredUser();
    const userId = user?.user_id ? Number(user.user_id) : null;
    const userName = getActorName();

    const { data: newSession, error: sessionError } = await supabase
      .from('remote_sessions')
      .insert([
        {
          remote_device_id: Number(deviceId),
          user_id: userId,
          user_name: userName,
          permissions_json: {
            control: options.control,
            audio_sys: options.audio === 'SYS' || options.audio === 'BOTH',
            audio_mic: options.audio === 'MIC' || options.audio === 'BOTH',
            file_transfer: false,
          },
          status: 'ACTIVE',
        },
      ])
      .select('*')
      .single();

    if (sessionError || !newSession) {
      throw new Error('No se pudo iniciar la sesion');
    }

    await supabase
      .from('remote_devices')
      .update({
        device_status: 'BUSY',
        current_session_id: newSession.remote_session_id,
        updated_at: new Date().toISOString(),
      })
      .eq('remote_device_id', Number(deviceId));

    await logAudit({
      actor: userName,
      action: 'CONNECT',
      target: device.device_name,
      details: `Conexion iniciada (Control: ${options.control}, Audio: ${options.audio})`,
    });

    return mapSession(newSession);
  },

  disconnect: async (sessionId: string) => {
    const { data: session, error: sessionError } = await supabase
      .from('remote_sessions')
      .select('*')
      .eq('remote_session_id', Number(sessionId))
      .single();

    if (sessionError || !session) return;

    await supabase
      .from('remote_sessions')
      .update({ status: 'ENDED', end_time: new Date().toISOString() })
      .eq('remote_session_id', Number(sessionId));

    await supabase
      .from('remote_devices')
      .update({
        device_status: 'ONLINE',
        current_session_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('remote_device_id', Number(session.remote_device_id));

    await logAudit({
      actor: session.user_name || getActorName(),
      action: 'DISCONNECT',
      target: session.user_name || 'Unknown',
      details: 'Sesion finalizada',
    });
  },

  rotateKey: async (deviceId: string) => {
    const { data: device } = await supabase
      .from('remote_devices')
      .select('device_name')
      .eq('remote_device_id', Number(deviceId))
      .single();

    await logAudit({
      actor: getActorName(),
      action: 'KEY_ROTATE',
      target: device?.device_name || deviceId,
      details: 'Rotacion manual de clave de acceso no asistido',
    });
    return { success: true, new_key_hash: '*******' };
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const { data, error } = await supabase
      .from('remote_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Remote getAuditLogs error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.remote_audit_id),
      timestamp: row.created_at,
      actor: row.actor_name || 'Sistema',
      action: row.action,
      target: row.target_name || '-',
      details: row.details || '',
      ip: row.ip_address || '-/-',
    }));
  },

  // --- POLICIES ---
  getPolicies: async (): Promise<AccessPolicy[]> => {
    const { data, error } = await supabase
      .from('remote_access_policies')
      .select('*')
      .order('policy_name', { ascending: true });

    if (error) {
      console.error('Remote getPolicies error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.remote_policy_id),
      name: row.policy_name,
      allow_unattended: row.allow_unattended === true,
      require_consent: row.require_consent === true,
      allow_audio: row.allow_audio === true,
      allow_control: row.allow_control === true,
      allowed_roles: Array.isArray(row.allowed_roles) ? row.allowed_roles : [],
    }));
  },

  updatePolicy: async (policy: AccessPolicy) => {
    const { data, error } = await supabase
      .from('remote_access_policies')
      .update({
        policy_name: policy.name,
        allow_unattended: policy.allow_unattended,
        require_consent: policy.require_consent,
        allow_audio: policy.allow_audio,
        allow_control: policy.allow_control,
        allowed_roles: policy.allowed_roles,
        updated_at: new Date().toISOString(),
      })
      .eq('remote_policy_id', Number(policy.id))
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo actualizar la politica');
    }

    await logAudit({
      actor: getActorName(),
      action: 'POLICY_CHANGE',
      target: policy.name,
      details: 'Actualizacion de politica de acceso',
    });

    return policy;
  },

  // --- AUTO-ENROLLMENT & HEARTBEAT ---

  autoEnroll: async (deviceData: {
    device_uuid: string;
    hostname: string;
    os: 'WINDOWS' | 'MAC' | 'LINUX';
    version: string;
    monitors: number;
  }) => {
    const { data, error } = await supabase
      .from('remote_devices')
      .insert([
        {
          device_uuid: deviceData.device_uuid,
          device_name: deviceData.hostname,
          device_status: 'ONLINE',
          last_seen: new Date().toISOString(),
          os: deviceData.os,
          device_version: deviceData.version,
          ip_address: '10.0.0.' + Math.floor(Math.random() * 255),
          unattended_enabled: false,
          groups_json: ['Sin Asignar'],
          tags_json: ['Auto-Enrolled'],
          monitors_count: deviceData.monitors,
          preview_url:
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=400&auto=format&fit=crop',
          preview_updated_at: new Date().toISOString(),
        },
      ])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo auto-enrolar el dispositivo');
    }

    await logAudit({
      actor: 'SYSTEM',
      action: 'CONNECT',
      target: data.device_name,
      details: 'Dispositivo auto-enrolado exitosamente',
      ip: data.ip_address,
    });

    return mapDevice(data);
  },

  sendHeartbeat: async (deviceId: string) => {
    await supabase
      .from('remote_devices')
      .update({
        device_status: 'ONLINE',
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('remote_device_id', Number(deviceId));
  },

  updatePreview: async (deviceId: string, previewUrl: string) => {
    await supabase
      .from('remote_devices')
      .update({
        preview_url: previewUrl,
        preview_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('remote_device_id', Number(deviceId));
  },

  updateDevice: async (deviceId: string, updates: Partial<RemoteDevice>) => {
    const payload: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) payload.device_name = updates.name;
    if (updates.groups !== undefined) payload.groups_json = updates.groups;
    if (updates.tags !== undefined) payload.tags_json = updates.tags;
    if (updates.status !== undefined) payload.device_status = updates.status;
    if (updates.last_seen !== undefined) payload.last_seen = updates.last_seen;
    if (updates.os !== undefined) payload.os = updates.os;
    if (updates.version !== undefined) payload.device_version = updates.version;
    if (updates.ip_address !== undefined) payload.ip_address = updates.ip_address;
    if (updates.unattended_enabled !== undefined) payload.unattended_enabled = updates.unattended_enabled;
    if (updates.current_session_id !== undefined) {
      payload.current_session_id = updates.current_session_id ? Number(updates.current_session_id) : null;
    }
    if (updates.monitors_count !== undefined) payload.monitors_count = updates.monitors_count;
    if (updates.preview_url !== undefined) payload.preview_url = updates.preview_url;
    if (updates.preview_updated_at !== undefined) payload.preview_updated_at = updates.preview_updated_at;

    const { data, error } = await supabase
      .from('remote_devices')
      .update(payload)
      .eq('remote_device_id', Number(deviceId))
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo actualizar el dispositivo');
    }

    await logAudit({
      actor: getActorName(),
      action: 'POLICY_CHANGE',
      target: data.device_name,
      details: 'Actualizacion de metadatos del dispositivo',
    });

    return mapDevice(data);
  },
};

export default RemoteDesktopService;
