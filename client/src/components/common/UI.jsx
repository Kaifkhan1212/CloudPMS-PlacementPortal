/**
 * CloudPMS Shared UI Components v2
 * Token-driven, dark-mode safe, premium SaaS aesthetic.
 */
import { CheckCircle2, Clock, Circle, XCircle, AlertCircle, FileText, Briefcase } from 'lucide-react';
import { useEffect } from 'react';

/* ── PageTitle ─────────────────────────────────────────────────── */
export function PageTitle({ title }) {
  useEffect(() => {
    document.title = title ? `${title} — CloudPMS` : 'CloudPMS — Campus Placement Portal';
    return () => { document.title = 'CloudPMS — Campus Placement Portal'; };
  }, [title]);
  return null;
}

/* ── Status Badge ──────────────────────────────────────────────── */
const STATUS_CONFIG = {
  'Applied':             { cls: 'badge-applied',     icon: Circle },
  'Shortlisted':         { cls: 'badge-shortlisted',  icon: CheckCircle2 },
  'Interview Scheduled': { cls: 'badge-interview',    icon: Clock },
  'Selected':            { cls: 'badge-selected',     icon: CheckCircle2 },
  'Rejected':            { cls: 'badge-rejected',     icon: XCircle },
  'Upcoming':            { cls: 'badge-upcoming',     icon: Clock },
  'Ongoing':             { cls: 'badge-ongoing',      icon: Circle },
  'Completed':           { cls: 'badge-completed',    icon: CheckCircle2 },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { cls: 'cpm-badge', icon: Circle };
  const Icon = cfg.icon;
  return (
    <span className={cfg.cls}>
      <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
      {status}
    </span>
  );
}

/* ── Page Hero Band ────────────────────────────────────────────── */
export function PageHero({ title, subtitle, actions, children }) {
  return (
    <div className="page-hero">
      <div className="page-hero-dots" />
      <div className="page-hero-content">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight" style={{ color: 'var(--hero-text)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm font-sans max-w-2xl leading-relaxed" style={{ color: 'var(--hero-muted)' }}>
                {subtitle}
              </p>
            )}
            {children}
          </div>
          {actions && (
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page Loader ───────────────────────────────────────────────── */
export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="spinner w-7 h-7" />
      <p className="font-sans text-xs animate-pulse" style={{ color: 'var(--text-subtle)' }}>Loading…</p>
    </div>
  );
}

/* ── Spinner ───────────────────────────────────────────────────── */
export function Spinner({ size = 'sm' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';
  return <div className={`spinner ${sz}`} />;
}

/* ── Avatar — initials circle ──────────────────────────────────── */
const AVATAR_PALETTES = [
  { bg: '#DBEAFE', color: '#1D4ED8' },
  { bg: '#FED7AA', color: '#C2410C' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#EDE9FE', color: '#6D28D9' },
  { bg: '#FCE7F3', color: '#9D174D' },
  { bg: '#FEF3C7', color: '#92400E' },
];

export function Avatar({ name = '', size = 'sm' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const palette = AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];
  const sizeClass = { xs: 'w-7 h-7 text-2xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size] || 'w-8 h-8 text-xs';

  return (
    <div
      className={`user-avatar ${sizeClass} font-sans font-semibold`}
      style={{ background: palette.bg, color: palette.color }}
    >
      {initials}
    </div>
  );
}

/* ── Company Avatar — square, branded ─────────────────────────── */
export function CompanyAvatar({ name = '', size = 'md' }) {
  const initials = name.substring(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`company-avatar ${sizeClass}`}>
      {initials}
    </div>
  );
}

/* ── Empty State ───────────────────────────────────────────────── */
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
        style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
      >
        {icon || <Briefcase className="w-6 h-6" strokeWidth={1.5} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-body">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Ghost Card (add-more invite) ──────────────────────────────── */
export function GhostCard({ icon, title, description, onClick, buttonLabel }) {
  return (
    <div
      onClick={onClick}
      className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-10 px-6 text-center gap-3 transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderColor: 'var(--border)' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ color: 'var(--text-subtle)', fontSize: '1.75rem' }}>{icon || '+'}</div>
      <p className="font-serif font-bold text-lg" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <p className="font-sans text-xs max-w-xs" style={{ color: 'var(--text-subtle)' }}>{description}</p>
      {buttonLabel && onClick && (
        <button className="btn-secondary mt-2 text-xs">{buttonLabel}</button>
      )}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────── */
export function StatCard({ icon, label, value, sub, colorClass }) {
  return (
    <div className="cpm-stat-card">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass || ''}`}>
          {icon}
        </div>
        <div className="kpi-value">{value}</div>
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Section Header ────────────────────────────────────────────── */
export function SectionHeader({ label, title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        {label && <p className="type-label mb-1">{label}</p>}
        {title && <h2 className="type-h3">{title}</h2>}
      </div>
      {action}
    </div>
  );
}

/* ── Inline Alert ──────────────────────────────────────────────── */
export function Alert({ type = 'info', icon, children }) {
  const classes = { info: 'alert-info', warning: 'alert-warning', success: 'alert-success', error: 'alert-error' };
  const icons   = { info: AlertCircle, warning: AlertCircle, success: CheckCircle2, error: XCircle };
  const Icon = icons[type];
  return (
    <div className={`${classes[type]} flex items-start gap-3`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

/* ── Progress Ring ─────────────────────────────────────────────── */
export function ProgressRing({ value = 0, size = 56, strokeWidth = 5 }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--accent)" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
      />
    </svg>
  );
}

/* ── Deadline Pill ─────────────────────────────────────────────── */
export function DeadlinePill({ daysText, isExpired }) {
  const style = isExpired
    ? { background: 'var(--bg-surface-2)', color: 'var(--text-subtle)', border: '1px solid var(--border)' }
    : daysText === 'Today'
    ? { background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }
    : { background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)' };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 font-sans text-2xs font-semibold rounded"
      style={style}
    >
      <Clock className="w-2.5 h-2.5" />
      {daysText}
    </span>
  );
}

/* ── Filter Tab Helpers (re-exported for convenience) ─────────────── */
export { filterTabClass, filterTabStyle } from '../../utils/uiHelpers';
