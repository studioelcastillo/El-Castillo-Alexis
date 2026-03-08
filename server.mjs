import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname);
const distDir = process.env.DIST_DIR || path.join('dist', 'spa');
const distRoot = path.isAbsolute(distDir) ? distDir : path.join(root, distDir);

const normalizeBase = (value) => {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};

const base = normalizeBase(process.env.VITE_DASHBOARD_BASE || process.env.DASHBOARD_APP_URL || '/');
const basePath = base === '/' ? '' : base.replace(/^\/+|\/+$/g, '');
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const shouldLogRequestHeaders = process.env.LOG_REQUEST_HEADERS === 'true';
const exposeDebugConfig = process.env.ENABLE_DEBUG_CONFIG === 'true' && !isProduction;
const apiProxyTarget = process.env.API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:4101';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const app = express();
app.set('trust proxy', true);

const isLoopbackRequest = (req) => {
  const remote = req.ip || req.socket?.remoteAddress || '';
  const normalized = String(remote).replace('::ffff:', '');
  return normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost';
};

const sendIndex = (res, indexPath, notFoundMessage) => {
  if (!fs.existsSync(indexPath)) {
    res.status(404).send(notFoundMessage);
    return;
  }
  res.sendFile(indexPath);
};

if (!fs.existsSync(distRoot)) {
  console.warn(`[server] Build directory not found: ${distRoot}`);
}

if (!supabase) {
  console.warn('[server] Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. /__local/login-lookup is disabled.');
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    base,
    basePath: basePath || '/',
    distRoot,
    distExists: fs.existsSync(distRoot),
    apiProxyTarget,
  });
});

app.use('/api', createProxyMiddleware({
  target: apiProxyTarget,
  changeOrigin: true,
  xfwd: true,
  logLevel: isProduction ? 'warn' : 'info',
}));

if (!isProduction || shouldLogRequestHeaders) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (shouldLogRequestHeaders) {
      console.log('Forwarded-Proto:', req.get('x-forwarded-proto'));
      console.log('Forwarded-Host:', req.get('x-forwarded-host'));
    }
    next();
  });
}

app.get('/__local/login-lookup', async (req, res) => {
  if (isProduction || !isLoopbackRequest(req)) {
    return res.status(403).json({ status: 'Error', message: 'Endpoint disponible solo en desarrollo local' });
  }

  const { identifier } = req.query;
  if (!identifier) {
    return res.status(400).json({ status: 'Error', message: 'Identifier is required' });
  }

  if (!supabase) {
    return res.status(500).json({ status: 'Error', message: 'Auth lookup service not configured on server' });
  }

  try {
    const normalizedIdentifier = String(identifier).trim();
    const isEmail = normalizedIdentifier.includes('@');

    let query = supabase
      .from('users')
      .select('user_email, user_identification, auth_user_id, user_active, user_name, user_personal_email')
      .is('deleted_at', null);

    if (isEmail) {
      query = query.or(`user_email.ilike.${normalizedIdentifier},user_personal_email.ilike.${normalizedIdentifier}`);
    } else {
      query = query.or(`user_identification.eq.${normalizedIdentifier},user_name.ilike.${normalizedIdentifier}`);
    }

    const { data: userRecords, error } = await query;
    if (error) {
      console.error('[server] Lookup DB error:', error);
      return res.status(500).json({ status: 'Error', message: 'Database error' });
    }

    if (!userRecords?.length) {
      return res.status(404).json({ status: 'Error', message: 'User not found' });
    }

    const user = userRecords.find((candidate) => candidate.user_active) || userRecords[0];
    return res.json({ status: 'Success', data: user });
  } catch (error) {
    console.error('[server] Lookup internal error:', error);
    return res.status(500).json({ status: 'Error', message: 'Internal server error' });
  }
});

app.use(express.static(distRoot));

app.get('/dashboard-app', (_req, res) => {
  res.redirect(301, '/');
});

app.get('/dashboard-app/*', (_req, res) => {
  res.redirect(301, '/');
});

if (exposeDebugConfig) {
  app.get('/debug-config', (req, res) => {
    res.json({
      currentTime: new Date().toISOString(),
      base,
      basePath,
      apiProxyTarget,
      env: {
        VITE_DASHBOARD_BASE: process.env.VITE_DASHBOARD_BASE,
        DASHBOARD_APP_URL: process.env.DASHBOARD_APP_URL,
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
      },
      headers: req.headers,
      protocol: req.get('x-forwarded-proto') || req.protocol,
      host: req.get('x-forwarded-host') || req.get('host'),
      distRoot,
      distExists: fs.existsSync(distRoot),
    });
  });
}

if (basePath) {
  app.get('/', (_req, res) => {
    res.redirect(302, `/${basePath}/`);
  });

  app.get(`/${basePath}`, (_req, res) => {
    res.redirect(302, `/${basePath}/`);
  });

  app.get(`/${basePath}/*`, (_req, res) => {
    sendIndex(res, path.join(distRoot, basePath, 'index.html'), 'Dashboard files not found. Check server logs.');
  });
} else {
  app.get('*', (_req, res) => {
    sendIndex(res, path.join(distRoot, 'index.html'), 'Root files not found. Check server logs.');
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`[server] Listening on port ${port}`);
  console.log(`[server] Serving static files from ${distRoot}`);
  console.log(`[server] API proxy target: ${apiProxyTarget}`);
  if (basePath) {
    console.log(`[server] Base path configured as /${basePath}/`);
  }
});
