import { Component, ReactNode, ElementType } from 'react';
import { AlertTriangle } from 'lucide-react';

// ─── Spinner ─────────────────────────────────────────────────────────────────
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

// ─── LoadingPage ─────────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" className="text-[var(--primary)]" />
    </div>
  );
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <div>
            <p className="font-semibold text-lg">Something went wrong</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">{this.state.error?.message}</p>
          </div>
          <button className="btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  desc?: string;
  action?: ReactNode;
}
export function EmptyState({ icon: Icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {Icon && <Icon className="w-12 h-12 text-[var(--text-muted)]" strokeWidth={1} />}
      <div>
        <p className="font-semibold">{title}</p>
        {desc && <p className="text-[var(--text-muted)] text-sm mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative card shadow-2xl w-full ${sizes[size]} animate-fade-in`}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h3 className="font-bold text-lg">{title}</h3>
          <button className="btn-ghost p-1.5 rounded-lg" onClick={onClose}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: 'badge-green', COMPLETED: 'badge-green', APPROVED: 'badge-green', ACTIVE: 'badge-green',
    FAILED: 'badge-red', REJECTED: 'badge-red', BLOCKED: 'badge-red',
    PENDING: 'badge-yellow',
    REVERSED: 'badge-blue', CREDIT: 'badge-green', DEBIT: 'badge-red',
    TOPUP: 'badge-blue', TRANSFER: 'badge-blue', WITHDRAW: 'badge-red',
    CASHBACK: 'badge-green', REDEEM: 'badge-blue',
  };
  return <span className={map[status] || 'badge-blue'}>{status}</span>;
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-[var(--text-muted)] text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</button>
      </div>
    </Modal>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'cyan' | 'green' | 'red' | 'yellow' | 'purple';
  trend?: number;
}
export function StatCard({ icon: Icon, label, value, sub, color = 'cyan', trend }: StatCardProps) {
  const colors: Record<string, string> = {
    cyan: 'text-[var(--primary)] bg-[var(--primary-light)]',
    green: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
    red: 'text-red-500 bg-red-50 dark:bg-red-950/40',
    yellow: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40',
    purple: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={trend >= 0 ? 'text-emerald-500 text-xs font-semibold' : 'text-red-500 text-xs font-semibold'}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="amount text-2xl font-bold">{value}</div>
      <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}
