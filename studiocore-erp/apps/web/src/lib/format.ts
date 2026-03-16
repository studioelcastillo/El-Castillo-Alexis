export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return '--';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return '--';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(date);
}

export function shortText(value?: string | null, fallback = '--') {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export function joinValues(values: Array<string | number>, fallback = '--') {
  return values.length ? values.join(', ') : fallback;
}

export function pluralize(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}
