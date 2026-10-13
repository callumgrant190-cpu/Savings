import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { CHART } from '../lib/categories';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = '' }: {
  title?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card animate-floatIn p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-base font-bold text-white">{title}</h2>}
            {subtitle && <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Headline number with an optional colour key and sub-line. */
export function Stat({ label, value, sub, swatch, tone }: {
  label: string;
  value: string;
  sub?: ReactNode;
  swatch?: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {swatch && <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: swatch }} />}
        {label}
      </div>
      <div
        className={`mt-1.5 text-2xl font-extrabold tracking-tight ${
          tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-red-400' : 'text-white'
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

/** Number input that keeps an empty string while typing instead of snapping to 0. */
export function NumberInput({ value, onChange, step = 'any', min, prefix, suffix, placeholder }: {
  value: number | '';
  onChange: (v: number | '') => void;
  step?: string;
  min?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        className={`input tabular ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
        value={value}
        step={step}
        min={min}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-white/10 bg-ink-900/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg font-semibold transition ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
            value === o.value ? 'bg-brand-500 text-ink-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-slate-400">{icon}</div>
      <div className="font-semibold text-slate-200">{title}</div>
      {children && <div className="max-w-sm text-sm text-slate-400">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-800 p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-300">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          {i.dashed ? (
            <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Shared tooltip shell for Recharts `content` props. */
export function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string; bold?: boolean }[] }) {
  return (
    <div
      className="min-w-[180px] rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: CHART.tooltipBg, border: `1px solid ${CHART.tooltipBorder}` }}
    >
      <div className="mb-1.5 font-semibold text-slate-200">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            {r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className={`tabular ${r.bold ? 'font-bold text-white' : 'text-slate-200'}`}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
} as const;
