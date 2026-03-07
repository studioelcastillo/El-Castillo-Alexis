import http from 'node:http';
import { URL } from 'node:url';

const toNumberOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const apiKey = process.env.GEMINI_API_KEY;
const host = process.env.GEMINI_PROXY_HOST || '127.0.0.1';
const port = Number(process.env.GEMINI_PROXY_PORT || process.env.PORT || 8787);
const maxBodyBytes = toNumberOr(process.env.GEMINI_PROXY_MAX_BODY_BYTES, 1_000_000);
const maxOutputTokensLimit = toNumberOr(process.env.GEMINI_PROXY_MAX_OUTPUT_TOKENS, 2048);
const rateLimitPerMinute = toNumberOr(process.env.GEMINI_PROXY_RATE_LIMIT_PER_MINUTE, 0);
const fetchTimeoutMs = toNumberOr(process.env.GEMINI_PROXY_FETCH_TIMEOUT_MS, 20000);
const allowedOrigins = (process.env.GEMINI_PROXY_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedModels = (process.env.GEMINI_PROXY_ALLOWED_MODELS || '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const proxyToken = process.env.GEMINI_PROXY_TOKEN;
const rateWindowMs = 60_000;
const rateLimits = new Map();

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY. Set it in the server environment.');
  process.exit(1);
}

if (!proxyToken) {
  console.error('Missing GEMINI_PROXY_TOKEN. Set it in the server environment.');
  process.exit(1);
}

const normalizeHeader = (value) => {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
};

const normalizeIp = (value) => {
  if (!value) return '';
  return String(value).replace('::ffff:', '').trim();
};

const getClientIp = (req) => {
  const forwarded = normalizeHeader(req.headers['x-forwarded-for']);
  if (forwarded) return normalizeIp(forwarded.split(',')[0]);
  return normalizeIp(req.socket?.remoteAddress);
};

const isRateLimited = (ip) => {
  if (!rateLimitPerMinute) return false;
  if (!ip) return false;
  const now = Date.now();
  const entry = rateLimits.get(ip) || { count: 0, resetAt: now + rateWindowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + rateWindowMs;
  }
  entry.count += 1;
  rateLimits.set(ip, entry);
  return entry.count > rateLimitPerMinute;
};

const resolveCorsOrigin = (origin) => {
  if (!origin) return allowedOrigins[0] || 'null';
  if (allowedOrigins.length === 0) return 'null';
  if (allowedOrigins.includes('*')) return origin;
  return allowedOrigins.includes(origin) ? origin : 'null';
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return false;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(origin);
};

const buildCorsHeaders = (origin) => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': resolveCorsOrigin(origin),
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gemini-Proxy-Token',
  'Vary': 'Origin',
});

const sendJson = (res, statusCode, payload, origin) => {
  res.writeHead(statusCode, buildCorsHeaders(origin));
  res.end(JSON.stringify(payload));
};

const getRequestToken = (req) => {
  const authHeader = normalizeHeader(req.headers.authorization);
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const headerToken =
    normalizeHeader(req.headers['x-gemini-proxy-token']) ||
    normalizeHeader(req.headers['x-api-key']);
  return headerToken;
};

const isAuthorized = (req) => {
  const token = getRequestToken(req);
  return token && token === proxyToken;
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    let bytesReceived = 0;
    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBodyBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  const origin = normalizeHeader(req.headers.origin);
  const clientIp = getClientIp(req);

  if (!isOriginAllowed(origin)) {
    return sendJson(res, 403, { error: 'Origin not allowed' }, origin);
  }

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {}, origin);
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { status: 'ok' }, origin);
  }

  if (proxyToken && !isAuthorized(req)) {
    return sendJson(res, 401, { error: 'Unauthorized' }, origin);
  }

  if (req.method === 'POST' && url.pathname === '/api/gemini') {
    if (isRateLimited(clientIp)) {
      return sendJson(res, 429, { error: 'Rate limit exceeded' }, origin);
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      const message = error?.message === 'Payload too large'
        ? 'Payload too large'
        : 'Invalid JSON body';
      return sendJson(res, error?.message === 'Payload too large' ? 413 : 400, { error: message }, origin);
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return sendJson(res, 400, { error: 'Missing prompt' }, origin);
    }

    const model = typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : 'gemini-1.5-flash';
    if (allowedModels.length > 0 && !allowedModels.includes(model)) {
      return sendJson(res, 400, { error: 'Model not allowed' }, origin);
    }
    const temperatureInput = Number.isFinite(body.temperature) ? body.temperature : 0.7;
    const temperature = Math.min(Math.max(temperatureInput, 0), 2);
    const requestedTokens = Number.isFinite(body.maxOutputTokens) ? Math.floor(body.maxOutputTokens) : 1024;
    const maxOutputTokens = Math.min(Math.max(requestedTokens, 1), maxOutputTokensLimit);

    let timeoutId;
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = fetchTimeoutMs > 0 ? new AbortController() : null;
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller?.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        return sendJson(res, response.status, {
          error: 'Gemini API error',
          details: result || await response.text().catch(() => 'Unknown error'),
        }, origin);
      }

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const includeRaw = Boolean(body.includeRaw);
      return sendJson(res, 200, includeRaw ? { text, raw: result } : { text }, origin);
    } catch (error) {
      if (error?.name === 'AbortError') {
        return sendJson(res, 504, { error: 'Gemini request timed out' }, origin);
      }
      return sendJson(res, 500, { error: 'Failed to reach Gemini API' }, origin);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  return sendJson(res, 404, { error: 'Not found' }, origin);
});

server.listen(port, host, () => {
  console.log(`Gemini proxy listening on http://${host}:${port}`);
});
