import http from 'node:http';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SETTINGS_KEY = 'attendance_integration';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const DEFAULT_SETTINGS = {
  server_port: 4370,
  flush_interval_seconds: 120,
  max_batch_size: 200,
};

let flushIntervalSeconds = DEFAULT_SETTINGS.flush_interval_seconds;
let maxBatchSize = DEFAULT_SETTINGS.max_batch_size;
let serverPort = Number(process.env.ADMS_PORT || DEFAULT_SETTINGS.server_port);
let lastSettingsSync = 0;

let buffer = [];
let bufferKeys = new Set();
let isFlushing = false;
let lastFlushAt = 0;
const deviceLastSync = new Map();
const recentKeys = new Map();
const RECENT_TTL_MS = 24 * 60 * 60 * 1000;

const toNumberOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeIp = (value) => {
  if (!value) return '';
  return value.replace('::ffff:', '').trim();
};

const allowedIps = (process.env.ADMS_ALLOWED_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);
const admsToken = process.env.ADMS_TOKEN || '';
const maxBodyBytes = toNumberOr(process.env.ADMS_MAX_BODY_BYTES, 2_000_000);

if (allowedIps.length === 0) {
  console.error('Missing ADMS_ALLOWED_IPS. Receiver will reject all traffic.');
}

if (!admsToken) {
  console.error('Missing ADMS_TOKEN. Receiver will reject all traffic.');
}

const isIpAllowed = (ip) => allowedIps.length > 0 && allowedIps.includes(ip);

const normalizeHeader = (value) => {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
};

const getRequestToken = (req, url) => {
  const headerToken = normalizeHeader(req.headers['x-adms-token']);
  if (headerToken) return headerToken;
  const authHeader = normalizeHeader(req.headers.authorization);
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return url.searchParams.get('token') || '';
};

const normalizePunchTime = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes(' ') && !raw.includes('T')) return raw.replace(' ', 'T');
  return raw;
};

const mapPunchState = (value) => {
  const code = String(value ?? '').trim();
  switch (code) {
    case '0':
      return 'IN';
    case '1':
      return 'OUT';
    case '2':
      return 'BREAK_OUT';
    case '3':
      return 'BREAK_IN';
    case '4':
      return 'OVERTIME_IN';
    case '5':
      return 'OVERTIME_OUT';
    default:
      return code ? code.toUpperCase() : 'IN';
  }
};

const parseKeyValueLine = (line) => {
  const parts = line.split(/\t|,/).map((part) => part.trim()).filter(Boolean);
  const data = {};
  parts.forEach((part) => {
    const [key, value] = part.split('=');
    if (value !== undefined) data[key.trim().toLowerCase()] = value.trim();
  });
  return data;
};

const parseAttendanceLines = (body, sn) => {
  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const events = [];

  lines.forEach((line) => {
    if (line.includes('=')) {
      const data = parseKeyValueLine(line);
      const empCode = data.pin || data.id || data.emp_code;
      const punchTime = normalizePunchTime(data.datetime || data.punch_time || data.time);
      if (!empCode || !punchTime) return;
      events.push({
        emp_code: String(empCode),
        punch_time: punchTime,
        punch_state: mapPunchState(data.status),
        terminal_sn: sn,
        verify_type: toNumberOr(data.verify, null),
      });
      return;
    }

    const parts = line.split(/\t|,/).map((part) => part.trim());
    if (parts.length < 2) return;
    const empCode = parts[0];
    const punchTime = normalizePunchTime(parts[1]);
    const status = parts[2];
    const verify = parts[3];
    if (!empCode || !punchTime) return;
    events.push({
      emp_code: empCode,
      punch_time: punchTime,
      punch_state: mapPunchState(status),
      terminal_sn: sn,
      verify_type: toNumberOr(verify, null),
    });
  });

  return events;
};

const queueEvent = (event) => {
  const key = `${event.emp_code}|${event.punch_time}|${event.terminal_sn}`;
  const recentAt = recentKeys.get(key);
  if (recentAt && Date.now() - recentAt < RECENT_TTL_MS) return;
  if (bufferKeys.has(key)) return;
  bufferKeys.add(key);
  buffer.push(event);
  recentKeys.set(key, Date.now());

  if (buffer.length >= maxBatchSize) {
    flushBuffer();
  }
};

const flushBuffer = async () => {
  if (isFlushing) return;
  if (buffer.length === 0) return;
  isFlushing = true;
  lastFlushAt = Date.now();

  const batch = buffer;
  buffer = [];
  bufferKeys = new Set();

  try {
    const { error } = await supabase
      .from('attendance_transactions')
      .upsert(batch, {
        onConflict: 'emp_code,punch_time,terminal_sn',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error('Error guardando marcaciones:', error.message);
    }
  } catch (error) {
    console.error('Error guardando marcaciones:', error.message);
  } finally {
    isFlushing = false;
  }
};

const updateDevice = async (sn, ipAddress) => {
  if (!sn) return;
  const lastSync = deviceLastSync.get(sn) || 0;
  if (Date.now() - lastSync < flushIntervalSeconds * 1000) return;
  deviceLastSync.set(sn, Date.now());
  const normalizedIp = normalizeIp(ipAddress) || null;
  const payload = {
    device_sn: sn,
    device_alias: sn,
    device_ip: normalizedIp,
    device_status: 'ONLINE',
    last_sync_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('attendance_devices')
    .upsert([payload], { onConflict: 'device_sn' });

  if (error) {
    console.error('Error actualizando dispositivo:', error.message);
  }
};

const loadSettings = async () => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', SETTINGS_KEY)
      .maybeSingle();

    if (data?.set_value) {
      const parsed = JSON.parse(data.set_value);
      flushIntervalSeconds = toNumberOr(parsed.flush_interval_seconds, DEFAULT_SETTINGS.flush_interval_seconds);
      maxBatchSize = toNumberOr(parsed.max_batch_size, DEFAULT_SETTINGS.max_batch_size);
      serverPort = Number(process.env.ADMS_PORT || parsed.server_port || DEFAULT_SETTINGS.server_port);
    }
  } catch (error) {
    console.error('No se pudo cargar configuracion de integracion:', error.message);
  }
};

const ensureSettings = async () => {
  const now = Date.now();
  if (now - lastSettingsSync > 60000) {
    lastSettingsSync = now;
    await loadSettings();
  }
};

const handleRequest = async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const sn = url.searchParams.get('SN') || url.searchParams.get('sn') || '';
  const table = (url.searchParams.get('table') || '').toUpperCase();
  const clientIp = normalizeIp(req.socket.remoteAddress);

  if (allowedIps.length === 0) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (!isIpAllowed(clientIp)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (!admsToken) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Unauthorized');
    return;
  }

  if (admsToken && getRequestToken(req, url) !== admsToken) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Unauthorized');
    return;
  }

  await ensureSettings();

  if (req.method === 'POST') {
    let body = '';
    let bytesReceived = 0;
    let payloadTooLarge = false;
    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBodyBytes) {
        payloadTooLarge = true;
        res.writeHead(413, { 'Content-Type': 'text/plain' });
        res.end('Payload Too Large');
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', async () => {
      if (payloadTooLarge) return;
      if (table && table !== 'ATTLOG' && table !== 'ATTTLOG') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
      }

      const events = parseAttendanceLines(body, sn);
      events.forEach(queueEvent);
      await updateDevice(sn, clientIp);

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
    return;
  }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
};

await loadSettings();
setInterval(() => {
  const now = Date.now();
  if (buffer.length === 0) return;
  if (now - lastFlushAt < flushIntervalSeconds * 1000) return;
  flushBuffer();
}, 1000);

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentKeys.entries()) {
    if (now - ts > RECENT_TTL_MS) recentKeys.delete(key);
  }
  if (recentKeys.size > 50000) {
    recentKeys.clear();
  }
}, 10 * 60 * 1000);

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('Error en request:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('ERROR');
  });
});

server.listen(serverPort, () => {
  console.log(`ADMS receiver activo en puerto ${serverPort}`);
  console.log(`Flush cada ${flushIntervalSeconds}s, lote maximo ${maxBatchSize}`);
});
