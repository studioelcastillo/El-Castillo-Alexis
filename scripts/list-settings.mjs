import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const STAGING_ENV = path.join(ROOT, '.env.staging');
const PRODUCTION_ENV = path.join(ROOT, '.env.production');

const parseEnv = (content) => {
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
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
  if (mode === 'staging') return loadEnvFile(STAGING_ENV);
  if (mode === 'production') return loadEnvFile(PRODUCTION_ENV);
  return {};
};

const main = async () => {
  const mode = String(process.argv[2] || '').toLowerCase();
  if (mode !== 'staging' && mode !== 'production') {
    console.error('Usage: node scripts/list-settings.mjs staging|production');
    process.exit(1);
  }

  const env = await loadEnv(mode);
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Missing Supabase URL or anon key.');
    process.exit(1);
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseKey = serviceKey || anonKey;
  const supabase = createClient(url, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.from('settings').select('set_key, set_description');

  if (error) {
    console.error(`Failed to read settings (${mode}): ${error.message}`);
    process.exit(1);
  }

  const keys = (data || [])
    .map((row) => row.set_key)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  console.log(`settings keys (${mode}): ${keys.length}`);
  keys.forEach((key) => console.log(key));
};

main();
