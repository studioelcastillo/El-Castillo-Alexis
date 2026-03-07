import { getStoredUser } from './session';

export const getCurrentStudioId = (): number | null => {
  const rawValue = getStoredUser()?.std_id;
  const studioId = Number(rawValue);
  return Number.isFinite(studioId) && studioId > 0 ? studioId : null;
};

export const resolveStudioId = (value?: string | number | null): number | null => {
  const candidate = Number(value);
  if (Number.isFinite(candidate) && candidate > 0) {
    return candidate;
  }

  return getCurrentStudioId();
};

export const requireStudioId = (value?: string | number | null): number => {
  const studioId = resolveStudioId(value);
  if (!studioId) {
    throw new Error('No hay un estudio activo en la sesion.');
  }

  return studioId;
};

export const withStudioFallback = <T>(value: T, fallback: T) =>
  value === null || value === undefined || value === '' ? fallback : value;
