export function formatDateTime(value?: string | Date | null, options: { dateOnly?: boolean } = {}) {
  if (!value) {
    return '--';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: options.dateOnly ? undefined : 'short',
  }).format(date);
}

export function formatCurrency(value: number | string, currency = 'COP') {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numericValue)) {
    return '--';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
  }).format(numericValue);
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
