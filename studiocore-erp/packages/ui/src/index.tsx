import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return <section className={joinClassNames('panel ui-panel fade-up', className)}>{children}</section>;
}

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions }: PageHeroProps) {
  return (
    <Panel className="page-hero ui-page-hero">
      <div className="ui-page-hero__content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="ui-page-hero__actions">{actions}</div> : null}
    </Panel>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function SectionHeading({ eyebrow, title, description, actions }: SectionHeadingProps) {
  return (
    <div className="ui-section-heading">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="ui-section-heading__actions">{actions}</div> : null}
    </div>
  );
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
};

export function ActionButton({
  className,
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        'ui-button',
        variant === 'primary' && 'primary-button',
        variant !== 'primary' && 'ghost-button',
        variant === 'secondary' && 'ui-button--secondary',
        variant === 'danger' && 'ui-button--danger',
        fullWidth && 'full-width',
        className,
      )}
      {...props}
    />
  );
}

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint: string;
};

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <article className="kpi-card ui-kpi-card panel fade-up">
      <span className="mini-label">{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );
}

type StatusBadgeProps = {
  value: string | number | null | undefined;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const label = value === null || value === undefined ? '--' : String(value);
  const normalized = label.toLowerCase();
  const tone =
    normalized === 'ok' || normalized === 'active' || normalized === 'true' || normalized === 'system'
      ? 'success'
      : normalized === 'blocked' || normalized === 'error' || normalized === 'inactive' || normalized === 'offline'
        ? 'danger'
        : 'neutral';

  return <span className={`status-badge ${tone}`}>{label}</span>;
}

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  compact?: boolean;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, compact = false, action }: EmptyStateProps) {
  return (
    <div className={joinClassNames('empty-state ui-empty-state', compact && 'compact-empty')}>
      {icon ? <div className="ui-empty-state__icon">{icon}</div> : null}
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

type InlineMessageProps = {
  tone?: 'info' | 'success' | 'error';
  children: ReactNode;
};

export function InlineMessage({ tone = 'info', children }: InlineMessageProps) {
  return <div className={joinClassNames('ui-inline-message', `ui-inline-message--${tone}`)}>{children}</div>;
}

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <label className="field ui-field" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {hint ? <small className="ui-field__hint">{hint}</small> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={joinClassNames('ui-text-input', props.className)} {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={joinClassNames('ui-text-input', props.className)} {...props} />;
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={joinClassNames('ui-text-input ui-textarea', props.className)} {...props} />;
}

type CheckboxFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export function CheckboxField({ checked, onChange, label, hint, disabled = false }: CheckboxFieldProps) {
  return (
    <label className={joinClassNames('ui-checkbox', disabled && 'ui-checkbox--disabled')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
    </label>
  );
}
