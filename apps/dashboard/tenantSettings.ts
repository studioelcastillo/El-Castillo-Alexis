import { supabase } from './supabaseClient';
import { getCurrentStudioId } from './tenant';

type SettingRow = {
  set_key: string;
  set_value: string | null;
};

const buildScopedKey = (baseKey: string, studioId?: number | null) => {
  if (!studioId) return baseKey;
  return `studio:${studioId}:${baseKey}`;
};

const readSettingRow = async (baseKey: string, studioId?: number | null): Promise<SettingRow | null> => {
  const scopedKey = buildScopedKey(baseKey, studioId);
  const scoped = await supabase
    .from('settings')
    .select('set_key, set_value')
    .eq('set_key', scopedKey)
    .maybeSingle();

  if (scoped.data) {
    return scoped.data as SettingRow;
  }

  return null;
};

export const getTenantSettingValue = async (baseKey: string, studioId = getCurrentStudioId()) => {
  const row = await readSettingRow(baseKey, studioId);
  return row?.set_value ?? null;
};

export const getTenantJsonSetting = async <T>(baseKey: string, fallback: T, studioId = getCurrentStudioId()): Promise<T> => {
  const rawValue = await getTenantSettingValue(baseKey, studioId);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

export const upsertTenantSetting = async (
  baseKey: string,
  value: unknown,
  description: string,
  studioId = getCurrentStudioId()
) => {
  const set_key = buildScopedKey(baseKey, studioId);
  const set_value = typeof value === 'string' ? value : JSON.stringify(value);

  return supabase.from('settings').upsert(
    [
      {
        set_key,
        set_value,
        set_description: description,
      },
    ],
    { onConflict: 'set_key' }
  );
};
