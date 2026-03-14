import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import path from 'path';
import { loadSupabaseProject } from './load-supabase-env.mjs';

const ROOT = process.cwd();
const DASHBOARD_ENV = path.join(ROOT, 'apps', 'dashboard', '.env');
const ROOT_ENV = path.join(ROOT, '.env');
const ROOT_ENV_TMP = path.join(ROOT, '.env.tmp');
const STAGING_ENV = path.join(ROOT, '.env.staging');
const PRODUCTION_ENV = path.join(ROOT, '.env.production');

const parseEnv = (content) => {
  const lines = content.split(/\r?\n/);
  const env = {};
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) env[key] = value;
  });
  return env;
};

const loadEnvFile = async (filePath) => {
  try {
    const content = await readFile(filePath, 'utf8');
    return parseEnv(content);
  } catch {
    return {};
  }
};

const loadEnv = async (mode) => {
  if (mode === 'staging') {
    const project = loadSupabaseProject('staging');
    return {
      VITE_SUPABASE_URL: project.url,
      SUPABASE_URL: project.url,
      VITE_SUPABASE_ANON_KEY: project.anonKey,
      SUPABASE_ANON_KEY: project.anonKey,
    };
  }
  if (mode === 'production') {
    const project = loadSupabaseProject('production');
    return {
      VITE_SUPABASE_URL: project.url,
      SUPABASE_URL: project.url,
      VITE_SUPABASE_ANON_KEY: project.anonKey,
      SUPABASE_ANON_KEY: project.anonKey,
    };
  }
  const [dashboardEnv, rootEnv, rootEnvTmp] = await Promise.all([
    loadEnvFile(DASHBOARD_ENV),
    loadEnvFile(ROOT_ENV),
    loadEnvFile(ROOT_ENV_TMP),
  ]);
  return { ...rootEnvTmp, ...rootEnv, ...dashboardEnv };
};

const looksLikeJwt = (value) => typeof value === 'string' && value.startsWith('eyJ');

const main = async () => {
  const mode = String(process.argv[2] || 'local').toLowerCase();
  const env = await loadEnv(mode);
  const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Missing Supabase URL or anon key.');
    process.exit(1);
  }

  if (!looksLikeJwt(anonKey)) {
    console.error(`Supabase anon key looks invalid for mode ${mode}. It should start with "eyJ" (JWT).`);
    process.exit(1);
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseKey = serviceKey || anonKey;
  const supabase = createClient(url, supabaseKey, { auth: { persistSession: false } });
  const keys = ['monetization_token_value', 'license_clients', 'license_revenue_data'];

  const { data, error } = await supabase
    .from('settings')
    .select('set_key, set_value')
    .in('set_key', keys);

  if (error) {
    console.error(`Failed to read settings (${mode}): ${error.message}`);
    process.exit(1);
  }

  const map = new Map((data || []).map((row) => [row.set_key, row.set_value]));
  keys.forEach((key) => {
    const value = map.get(key);
    const hasValue = value !== null && value !== undefined && String(value).trim() !== '';
    const length = hasValue ? String(value).length : 0;
    console.log(`${key}: ${hasValue ? 'present' : 'missing'}${hasValue ? ` (len ${length})` : ''}`);
  });
};

main();
