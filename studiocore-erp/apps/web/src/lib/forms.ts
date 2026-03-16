export function toOptionalString(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

export function toNullableString(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function toOptionalNumber(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : undefined;
}

export function toNullableNumber(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : null;
}
