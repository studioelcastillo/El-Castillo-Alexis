import type { ReactNode } from 'react';

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint: string;
};

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <article className="kpi-card panel fade-up">
      <span className="mini-label">{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );
}
