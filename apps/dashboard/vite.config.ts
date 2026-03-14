import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';

const repoRoot = path.resolve(__dirname, '..', '..');
const appRoot = path.resolve(__dirname);
const envPrefixes = ['VITE_', 'DASHBOARD_'];

const normalizeBase = (value: string | undefined) => {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};

export default defineConfig(({ mode }) => {
  const repoEnv = loadEnv(mode, repoRoot, '');
  const appEnv = mode === 'development' ? loadEnv(mode, appRoot, '') : {};
  const env = { ...repoEnv, ...appEnv, ...process.env };
  const base = normalizeBase(env.VITE_DASHBOARD_BASE || env.DASHBOARD_APP_URL || '/');
  const isLocalhostUrl = (value: string) => {
    const lower = value.toLowerCase();
    return (
      lower.startsWith('http://localhost') ||
      lower.startsWith('http://127.0.0.1') ||
      lower.startsWith('https://localhost') ||
      lower.startsWith('https://127.0.0.1')
    );
  };
  const shouldExposeApiUrl = (value: string) => {
    if (!value) return false;
    if (mode === 'production' && isLocalhostUrl(value)) return false;
    return true;
  };
  const isLoopbackAddress = (value: string | undefined) => {
    if (!value) return false;
    return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
  };
  const defineEnv = Object.fromEntries(
    Object.entries(env)
      .filter(([key, value]) => envPrefixes.some((prefix) => key.startsWith(prefix)) && value !== undefined)
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
  );
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const apiUrl = String(env.VITE_API_URL || env.API_URL || '').trim();
  if (supabaseUrl !== undefined) {
    defineEnv['import.meta.env.VITE_SUPABASE_URL'] = JSON.stringify(supabaseUrl);
  }
  if (supabaseAnonKey !== undefined) {
    defineEnv['import.meta.env.VITE_SUPABASE_ANON_KEY'] = JSON.stringify(supabaseAnonKey);
  }
  if (shouldExposeApiUrl(apiUrl)) {
    defineEnv['import.meta.env.VITE_API_URL'] = JSON.stringify(apiUrl);
  }
  return {
    envDir: repoRoot,
    envPrefix: envPrefixes,
    define: defineEnv,
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'local-login-lookup',
        configureServer(server) {
          if (!supabaseUrl || !supabaseServiceRoleKey) return;

          const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          server.middlewares.use('/__local/login-lookup', async (req, res) => {
            if (req.method !== 'GET') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            const remoteAddress = req.socket.remoteAddress;
            if (!isLoopbackAddress(remoteAddress)) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Local access only' }));
              return;
            }

            try {
              const requestUrl = new URL(req.url || '/', 'http://localhost');
              const identifier = String(requestUrl.searchParams.get('identifier') || '').trim();

              if (!identifier) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing identifier' }));
                return;
              }

              const { data, error } = await adminClient
                .from('users')
                .select('user_email, user_identification, auth_user_id')
                .eq('user_identification', identifier)
                .maybeSingle();

              if (error || !data) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'User not found' }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ data }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Lookup failed' }));
            }
          });
        },
      },
    ],
    build: {
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return;
            if (id.includes('node_modules/react-router')) return 'vendor-router';
            if (id.includes('node_modules/react-dom')) return 'vendor-react';
            if (id.includes('node_modules/react/')) return 'vendor-react';
            if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
            if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';
            if (id.includes('node_modules/recharts')) return 'vendor-charts';
            if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
            if (id.includes('node_modules/date-fns') || id.includes('node_modules/moment')) return 'vendor-dates';
            if (id.includes('node_modules/crypto-js')) return 'vendor-crypto';
            if (id.includes('node_modules/axios')) return 'vendor-axios';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
