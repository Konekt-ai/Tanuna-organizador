import Link from 'next/link';
import { Construction } from 'lucide-react';

// Encabezado de página: título serif + descripción + acción opcional.
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="justify-self-end">{action}</div>}
    </div>
  );
}

// Tarjeta contenedora estándar.
export function Card({ title, action, className = '', children }) {
  return (
    <section
      className={`rounded-xl border border-border bg-card p-6 shadow-card-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-serif text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// KPI / stat tile.
export function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card-sm">
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-serif text-3xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

const BADGE_TONES = {
  neutral: 'bg-secondary text-secondary-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning-foreground',
  danger: 'bg-destructive/15 text-destructive',
  accent: 'bg-accent/10 text-accent',
};

// Badge / pill de estado.
export function Badge({ tone = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        BADGE_TONES[tone] ?? BADGE_TONES.neutral
      }`}
    >
      {children}
    </span>
  );
}

// Botón primario (para acciones de página).
export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Estado "en construcción" para módulos que se conectan en fases posteriores.
// Honesto: deja claro que la sección aún no opera con datos reales.
export function ComingSoon({ title, description, phase, cta }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center shadow-card-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Construction size={22} />
      </div>
      <h3 className="font-serif text-2xl">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {phase && (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {phase}
        </p>
      )}
      {cta && (
        <div className="mt-6">
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}
