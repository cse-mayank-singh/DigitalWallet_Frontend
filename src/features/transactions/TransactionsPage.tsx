import { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Download, Search, ArrowUpRight, ArrowDownLeft,
  Flag, Filter, X, ChevronLeft, ChevronRight, RefreshCw,
  SlidersHorizontal, TrendingUp, TrendingDown, Calendar
} from 'lucide-react';
import { walletApi } from '../../core/api/services';
import { StatusBadge, LoadingPage, EmptyState } from '../../shared/components/UI';
import { toast } from '../../shared/components/Toast';
import { useDebounce } from '../../shared/hooks/useDebounce';

function fmt(a: number): string {
  return `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}
function fmtDate(d?: string | null): string {
  return d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';
}

const CREDIT_TYPES = ['TOPUP', 'CASHBACK'];
const TX_TYPES = ['TOPUP', 'TRANSFER', 'WITHDRAW', 'CASHBACK', 'REDEEM'];
const TX_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED'];

const TYPE_COLORS: Record<string, string> = {
  TOPUP: 'badge-green',
  CASHBACK: 'badge-green',
  TRANSFER: 'badge-red',
  WITHDRAW: 'badge-red',
  REDEEM: 'badge-yellow',
};

interface Transaction {
  id: number; type: string; amount: number; status: string;
  description?: string; referenceId?: string; createdAt?: string;
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletApi.transactions(page, 10);
      let data: Transaction[] = res.data.content || [];
      if (typeFilter) data = data.filter((t) => t.type === typeFilter);
      if (statusFilter) data = data.filter((t) => t.status === statusFilter);
      if (debouncedSearch) data = data.filter((t) =>
        t.referenceId?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      setTxns(data);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, typeFilter, statusFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const downloadCsv = () => {
    const headers = ['ID', 'Type', 'Amount', 'Status', 'Description', 'Date'];
    const rows = txns.map((t) => [t.id, t.type, t.amount, t.status, t.description || '', t.createdAt || '']);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setTypeFilter(''); setStatusFilter(''); setSearch(''); setPage(0); };
  const hasFilters = !!(typeFilter || statusFilter || search);

  // Summary stats
  const totalCredit = txns.filter(t => CREDIT_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalDebit = txns.filter(t => !CREDIT_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{totalElements} total records</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost p-2 rounded-xl" onClick={load} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={downloadCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: totalElements.toString(), icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Credits (Page)', value: fmt(totalCredit), icon: TrendingDown, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Debits (Page)', value: fmt(totalDebit), icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: 'Current Page', value: `${page + 1} / ${totalPages}`, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[var(--text-muted)] font-medium">{label}</div>
              <div className="font-bold text-sm truncate amount">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
        <div className="flex gap-3 items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              className="input-field pl-10"
              placeholder="Search by ref ID or description…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          {/* Filter toggle */}
          <button
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showFilters ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]'}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}
          </button>

          {hasFilters && (
            <button className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-red-500 transition-colors" onClick={clearFilters}>
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--border)] flex-wrap">
            <div className="flex-1 min-w-36">
              <label className="label">Type</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <select className="input-field pl-9 text-sm" value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
                  <option value="">All Types</option>
                  {TX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 min-w-36">
              <label className="label">Status</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <select className="input-field pl-9 text-sm" value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                  <option value="">All Statuses</option>
                  {TX_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions list */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {loading ? (
          <LoadingPage />
        ) : txns.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={Receipt} title="No transactions found" desc="Try adjusting your filters or search query" />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                    <th className="text-left px-5 py-3.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Transaction</th>
                    <th className="text-left px-5 py-3.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Type</th>
                    <th className="text-right px-5 py-3.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Amount</th>
                    <th className="text-center px-5 py-3.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Date</th>
                    <th className="text-center px-5 py-3.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {txns.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--primary-light)] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            CREDIT_TYPES.includes(tx.type)
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                          }`}>
                            {CREDIT_TYPES.includes(tx.type)
                              ? <ArrowDownLeft className="w-4 h-4" />
                              : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">#{tx.id}</div>
                            <div className="text-xs text-[var(--text-muted)] truncate max-w-40">
                              {tx.description || tx.referenceId || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[tx.type] || 'badge-blue'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`amount font-bold ${CREDIT_TYPES.includes(tx.type) ? 'text-emerald-600' : 'text-red-500'}`}>
                          {CREDIT_TYPES.includes(tx.type) ? '+' : '−'}{fmt(tx.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(tx.createdAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mx-auto text-xs text-[var(--text-muted)] hover:text-red-500 transition-all px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => toast.info(`Dispute filed for transaction #${tx.id}`)}
                        >
                          <Flag className="w-3 h-3" /> Dispute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {txns.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-[var(--primary-light)] transition-colors">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      CREDIT_TYPES.includes(tx.type)
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                    }`}>
                      {CREDIT_TYPES.includes(tx.type)
                        ? <ArrowDownLeft className="w-4 h-4" />
                        : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">#{tx.id}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[tx.type] || 'badge-blue'}`}>{tx.type}</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{tx.description || tx.referenceId || '—'}</div>
                    </div>
                    <div className={`amount font-bold text-sm ${CREDIT_TYPES.includes(tx.type) ? 'text-emerald-600' : 'text-red-500'}`}>
                      {CREDIT_TYPES.includes(tx.type) ? '+' : '−'}{fmt(tx.amount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={tx.status} />
                      <span className="text-xs text-[var(--text-muted)]">{fmtDate(tx.createdAt)}</span>
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      onClick={() => toast.info(`Dispute filed for #${tx.id}`)}
                    >
                      <Flag className="w-3 h-3" /> Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
                <span className="text-sm text-[var(--text-muted)]">
                  Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 btn-secondary px-3 py-2 text-sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    className="flex items-center gap-1.5 btn-secondary px-3 py-2 text-sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
