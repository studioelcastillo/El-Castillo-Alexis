type StatusBadgeProps = {
  value: string | number | null | undefined;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const label = value === null || value === undefined ? '--' : String(value);
  const normalized = label.toLowerCase();
  const tone =
    normalized === 'ok' || normalized === 'active' || normalized === 'true'
      ? 'success'
      : normalized === 'blocked' || normalized === 'error'
        ? 'danger'
        : 'neutral';

  return <span className={`status-badge ${tone}`}>{label}</span>;
}
