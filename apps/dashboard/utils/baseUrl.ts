const normalizeBase = (value: string | undefined) => {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};

export const getAppBase = () => normalizeBase(import.meta.env.BASE_URL || '/');

export const buildAppUrl = (path: string) => {
  const base = getAppBase();
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  if (typeof window === 'undefined') {
    return `${base}${normalizedPath}`;
  }
  return new URL(`${base}${normalizedPath}`, window.location.origin).toString();
};
