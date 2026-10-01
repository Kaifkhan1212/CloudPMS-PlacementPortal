/* Shared filter-tab button helper — used on multiple pages */
export const filterTabClass = (isActive) =>
  `inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-sans font-medium transition-all duration-150 flex-shrink-0 ${
    isActive
      ? 'text-white shadow-sm'
      : ''
  }`;

export const filterTabStyle = (isActive) =>
  isActive
    ? { background: 'var(--accent)', border: '1.5px solid var(--accent)' }
    : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' };
