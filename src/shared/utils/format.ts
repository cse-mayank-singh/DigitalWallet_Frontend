/**
 * Formats a number as Indian Rupee amount string.
 * @example formatAmount(1000) → '₹1,000.00'
 */
export function formatAmount(a: number | undefined | null): string {
  return `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Formats a date string in Indian locale short format.
 * @example fmtDate('2024-01-15T10:30:00') → '15 Jan 2024'
 */
export function fmtDate(d: string | undefined | null): string {
  return d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
}

/**
 * Formats a date string in Indian locale with time.
 */
export function fmtDateTime(d: string | undefined | null): string {
  return d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
}
