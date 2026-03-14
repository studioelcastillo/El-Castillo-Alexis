import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PROJECTS = {
  staging: {
    name: 'staging',
    label: 'STAGING',
    ref: 'pnnrsqocukixusmzrlhy',
    url: 'https://pnnrsqocukixusmzrlhy.supabase.co',
    envFiles: [
      '.env',
      '.secure/root.env.local',
      '.env.staging',
      '.secure/root.staging.env.local',
    ],
  },
  production: {
    name: 'production',
    label: 'PRODUCTION',
    ref: 'ysorlqfwqccsgxxkpzdx',
    url: 'https://ysorlqfwqccsgxxkpzdx.supabase.co',
    envFiles: [
      '.env',
      '.secure/root.env.local',
      '.env.production',
      '.secure/root.production.env.local',
    ],
  },
};

const PROJECT_ALIASES = {
  stage: 'staging',
  staging: 'staging',
  prod: 'production',
  production: 'production',
};

const EMPTY_LIKE_VALUES = new Set(['', 'null', 'undefined', 'none', 'n/a']);
const PLACEHOLDER_PATTERNS = [
  /^TU_[A-Z0-9_]+$/i,
  /^YOUR_[A-Z0-9_]+$/i,
  /^REEMPLAZAR_[A-Z0-9_]+$/i,
  /^CAMBIAR_[A-Z0-9_]+$/i,
  /^OPCIONAL_/i,
  /^SOLO_EN_/i,
  /^CHANGE_ME$/i,
  /^PENDIENTE_/i,
];

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#') || line.startsWith('[')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    parsed[key] = value.replace(/^['\"]|['\"]$/g, '');
  }

  return parsed;
};

const normalizeConfiguredValue = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }

  if (EMPTY_LIKE_VALUES.has(normalized.toLowerCase())) {
    return '';
  }

  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return '';
  }

  return normalized;
};

const resolveConfiguredValue = (...values) => {
  for (const value of values) {
    const normalized = normalizeConfiguredValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

export const resolveSupabaseProjectName = (name) => {
  const normalized = String(name || '').trim().toLowerCase();
  const projectName = PROJECT_ALIASES[normalized];

  if (!projectName) {
    throw new Error(`Proyecto Supabase no soportado: ${name}`);
  }

  return projectName;
};

export const loadSupabaseProject = (name) => {
  const projectName = resolveSupabaseProjectName(name);
  const project = PROJECTS[projectName];
  const config = {};

  for (const relativePath of project.envFiles) {
    Object.assign(config, parseEnvFile(path.resolve(process.cwd(), relativePath)));
  }

  Object.assign(config, process.env);

  return {
    ...project,
    url: resolveConfiguredValue(config.VITE_SUPABASE_URL, config.SUPABASE_URL) || project.url,
    anonKey: resolveConfiguredValue(config.VITE_SUPABASE_ANON_KEY, config.SUPABASE_ANON_KEY),
    secretKey: resolveConfiguredValue(config.SUPABASE_SECRET_KEY),
    serviceRoleKey: resolveConfiguredValue(config.SUPABASE_SERVICE_ROLE_KEY),
    publishableKey: resolveConfiguredValue(config.SUPABASE_PUBLISHABLE_KEY),
  };
};

const requireValue = (value, message) => {
  if (!value) {
    throw new Error(message);
  }

  return value;
};

export const createSupabaseAdminClient = (name) => {
  const project = loadSupabaseProject(name);
  const clientKey = requireValue(
    project.serviceRoleKey || project.secretKey,
    `Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY para ${project.label}.`
  );

  return createClient(project.url, clientKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createSupabaseAnonClient = (name) => {
  const project = loadSupabaseProject(name);
  const anonKey = requireValue(
    project.anonKey,
    `Falta SUPABASE_ANON_KEY o VITE_SUPABASE_ANON_KEY para ${project.label}.`
  );

  return createClient(project.url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const getSupabaseAdminApiKey = (name) => {
  const project = loadSupabaseProject(name);

  return requireValue(
    project.serviceRoleKey || project.secretKey,
    `Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY para ${project.label}.`
  );
};

export const getSupabaseAdminHeaders = (name, extraHeaders = {}) => {
  const apiKey = getSupabaseAdminApiKey(name);

  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    ...extraHeaders,
  };
};

export const authAdminListUsers = async (name, { page = 1, perPage = 1000 } = {}) => {
  const project = loadSupabaseProject(name);
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const response = await fetch(`${project.url}/auth/v1/admin/users?${query.toString()}`, {
    headers: getSupabaseAdminHeaders(name),
  });

  if (!response.ok) {
    throw new Error(`Auth admin listUsers fallo en ${project.label}: ${response.status} ${await response.text()}`);
  }

  return response.json();
};

export const authAdminGetUserById = async (name, userId) => {
  const project = loadSupabaseProject(name);
  const response = await fetch(`${project.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: getSupabaseAdminHeaders(name),
  });

  if (!response.ok) {
    throw new Error(`Auth admin getUserById fallo en ${project.label}: ${response.status} ${await response.text()}`);
  }

  return response.json();
};

export const authAdminUpdateUserById = async (name, userId, attributes) => {
  const project = loadSupabaseProject(name);
  const response = await fetch(`${project.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: getSupabaseAdminHeaders(name, {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(attributes),
  });

  if (!response.ok) {
    throw new Error(`Auth admin updateUserById fallo en ${project.label}: ${response.status} ${await response.text()}`);
  }

  return response.json();
};
