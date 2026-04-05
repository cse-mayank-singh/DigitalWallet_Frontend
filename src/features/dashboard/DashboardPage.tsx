import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Send, Plus, Gift, ArrowUpRight, ArrowDownLeft,
  TrendingUp, Clock, Eye, EyeOff, ChevronRight, Zap,
  Shield, Award, CreditCard, RefreshCw, BarChart2, Wifi, WifiOff
} from 'lucide-react';
import { walletApi, rewardsApi, userApi } from '../../core/api/services';
import { StatCard, StatusBadge, LoadingPage } from '../../shared/components/UI';
import { toast } from '../../shared/components/Toast';
import { useAuth } from '../../store/AuthContext';
import { useNotifications } from '../../store/NotificationContext';
import NoWalletBanner from '../../shared/components/NoWalletBanner';
import { useWebSocket } from '../../shared/hooks/useWebSocket';
import { formatAmount, fmtDate } from '../../shared/utils/format';
import { isWalletNotFound } from '../../shared/utils/wallet';

interface Balance { balance: number; status: string; }
interface Transaction {
  id: number; type: string; amount: number; status: string;
  description?: string; referenceId?: string; createdAt?: string;
  senderId?: number | string; receiverId?: number | string;
}
interface Rewards {
  points: number; tier: string; nextTier?: string; pointsToNextTier?: number;
}
type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED' | 'APPROVED' | null;

interface SpendingPoint { label: string; credit: number; debit: number; }

const CREDIT_TYPES = ['TOPUP', 'CASHBACK'];

/** Returns true if a transaction is a credit for the given user */
function isCredit(tx: Transaction, userId?: number | string): boolean {
  if (CREDIT_TYPES.includes(tx.type)) return true;
  if (tx.type === 'TRANSFER') return String(tx.receiverId) === String(userId);
  return false;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Buckets transactions into the last 7 days for the spending graph */
function buildSpendingData(txns: Transaction[], userId?: number | string): SpendingPoint[] {
  const days: SpendingPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateStr = d.toISOString().slice(0, 10);
    const dayTxns = txns.filter(t => (t.createdAt || '').slice(0, 10) === dateStr);
    const credit = dayTxns.filter(t => isCredit(t, userId)).reduce((s, t) => s + t.amount, 0);
    const debit  = dayTxns.filter(t => !isCredit(t, userId)).reduce((s, t) => s + t.amount, 0);
    days.push({ label, credit, debit });
  }
  return days;
}

// ─── Memoized sub-components ─────────────────────────────────────────────────

const QuickActions = memo(function QuickActions() {
  return (
    <div className="flex gap-2 flex-wrap">
      {[
        { icon: Plus, label: 'Add', to: '/wallet' },
        { icon: Send, label: 'Send', to: '/transfer' },
        { icon: Gift, label: 'Redeem', to: '/rewards' },
      ].map(({ icon: Icon, label, to }) => (
        <Link key={label} to={to}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95">
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  );
});

const SecurityCard = memo(function SecurityCard() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-emerald-500" />
        <h3 className="font-bold text-sm">Security</h3>
        <span className="ml-auto badge-green text-xs">Protected</span>
      </div>
      <div className="space-y-2">
        {[
          { icon: Shield,     label: '256-bit Encryption' },
          { icon: Zap,        label: 'Instant Alerts' },
          { icon: CreditCard, label: 'KYC Verified' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Icon className="w-3.5 h-3.5 text-emerald-500" />
            {label}
          </div>
        ))}
      </div>
      <Link to="/profile" className="mt-4 btn-ghost w-full text-center text-xs py-2 flex items-center justify-center gap-1">
        Manage Profile <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
});

// ─── Spending Graph ───────────────────────────────────────────────────────────

const SpendingGraph = memo(function SpendingGraph({ data }: { data: SpendingPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = useMemo(() => Math.max(...data.flatMap(d => [d.credit, d.debit]), 1), [data]);

  const totalCredit = useMemo(() => data.reduce((s, d) => s + d.credit, 0), [data]);
  const totalDebit  = useMemo(() => data.reduce((s, d) => s + d.debit,  0), [data]);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="font-bold text-sm">Spending Overview</h3>
          <span className="text-xs text-[var(--text-muted)] font-normal">• Last 7 days</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-[var(--text-muted)]">In</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span className="text-[var(--text-muted)]">Out</span>
          </span>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2.5">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Total In</p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 amount mt-0.5">
            {formatAmount(totalCredit)}
          </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl px-3 py-2.5">
          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Total Out</p>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400 amount mt-0.5">
            {formatAmount(totalDebit)}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-28 relative">
        {/* Y-axis guide lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
          {[1, 0.5, 0].map((frac) => (
            <div key={frac} className="border-t border-dashed border-[var(--border)] opacity-50 w-full" />
          ))}
        </div>

        {data.map((d, i) => {
          const creditH = maxVal > 0 ? Math.round((d.credit / maxVal) * 80) : 0;
          const debitH  = maxVal > 0 ? Math.round((d.debit  / maxVal) * 80) : 0;
          const isHov = hovered === i;
          return (
            <div
              key={d.label}
              className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (d.credit > 0 || d.debit > 0) && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 bg-[var(--bg-card)] border border-[var(--border)] shadow-lg rounded-xl px-3 py-2 text-xs whitespace-nowrap pointer-events-none"
                  style={{ left: `${(i / (data.length - 1)) * 100}%` }}>
                  <p className="font-bold text-[var(--text)] mb-1">{d.label}</p>
                  {d.credit > 0 && <p className="text-emerald-500">+{formatAmount(d.credit)}</p>}
                  {d.debit  > 0 && <p className="text-rose-500">−{formatAmount(d.debit)}</p>}
                </div>
              )}

              {/* Bars */}
              <div className="w-full flex gap-0.5 items-end" style={{ height: '80px' }}>
                <div
                  className={`flex-1 rounded-t-md transition-all duration-300 ${isHov ? 'opacity-100' : 'opacity-80'} bg-emerald-500`}
                  style={{ height: `${creditH}px`, minHeight: creditH > 0 ? 3 : 0 }}
                />
                <div
                  className={`flex-1 rounded-t-md transition-all duration-300 ${isHov ? 'opacity-100' : 'opacity-80'} bg-rose-500`}
                  style={{ height: `${debitH}px`, minHeight: debitH > 0 ? 3 : 0 }}
                />
              </div>

              {/* Day label */}
              <span className={`text-[10px] mt-1 font-medium transition-colors ${isHov ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [balance, setBalance]       = useState<Balance | null>(null);
  const [recentTx, setRecentTx]     = useState<Transaction[]>([]);
  const [allTx, setAllTx]           = useState<Transaction[]>([]);
  const [rewards, setRewards]       = useState<Rewards | null>(null);
  const [loading, setLoading]       = useState(true);
  const [walletMissing, setWalletMissing] = useState(false);
  const [kycStatus, setKycStatus]   = useState<KycStatus>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const kycRes = await userApi.kycStatus().catch(() => null);
      if (kycRes) setKycStatus(kycRes.data?.data?.status ?? null);

      const [bRes, txRes, allTxRes, rRes] = await Promise.allSettled([
        walletApi.balance(),
        walletApi.transactions(0, 5),
        walletApi.transactions(0, 50),
        rewardsApi.summary(),
      ]);

      if (bRes.status === 'rejected') {
        if (isWalletNotFound(bRes.reason)) { setWalletMissing(true); setLoading(false); return; }
        toast.error('Failed to load wallet balance');
      } else {
        setBalance(bRes.value.data.data);
      }

      if (txRes.status === 'fulfilled')    setRecentTx(txRes.value.data.content || []);
      if (allTxRes.status === 'fulfilled') setAllTx(allTxRes.value.data.content || []);
      if (rRes.status === 'fulfilled')     setRewards(rRes.value.data.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // WebSocket — live balance + transaction notifications
  useWebSocket(
    useMemo(() => ({
      onBalanceUpdate: (newBalance: number) => {
        setBalance(prev => prev ? { ...prev, balance: newBalance } : prev);
        setWsConnected(true);
      },
      onTransactionNotification: (tx: Transaction) => {
        setRecentTx(prev => [tx, ...prev].slice(0, 5));
        setAllTx(prev => [tx, ...prev].slice(0, 50));
        addNotification({
          type: isCredit(tx, user?.id) ? 'success' : 'info',
          title: isCredit(tx, user?.id) ? 'Money received!' : 'Transaction update',
          message: `${tx.type}: ${formatAmount(tx.amount)}`,
        });
        setWsConnected(true);
      },
    }), [addNotification]),
    !walletMissing
  );

  const spendingData = useMemo(() => buildSpendingData(allTx, user?.id), [allTx, user?.id]);

  const totalCredits = useMemo(
    () => recentTx.filter(t => isCredit(t, user?.id)).reduce((s, t) => s + t.amount, 0),
    [recentTx, user?.id]
  );
  const totalDebits = useMemo(
    () => recentTx.filter(t => !isCredit(t, user?.id)).reduce((s, t) => s + t.amount, 0),
    [recentTx, user?.id]
  );

  const tierColors: Record<string, string> = {
    SILVER: 'text-slate-400', GOLD: 'text-yellow-400',
    PLATINUM: 'text-[var(--primary)]', BRONZE: 'text-orange-400',
  };

  if (loading) return <LoadingPage />;

  if (walletMissing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {user?.fullName?.split(' ')[0]} </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Let's get your wallet set up.</p>
        </div>
        <NoWalletBanner kycStatus={kycStatus} variant="page" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.fullName?.split(' ')[0]} 
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Here's your wallet overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          
          <button onClick={fetchData} className="btn-ghost p-2 rounded-xl" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Balance Card + Stats (2-col on lg) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

        {/* Balance hero card — spans 3 cols */}
        <div className="lg:col-span-1 lg:row-span-2 h-full relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-pink-600 p-6 sm:p-7 text-white overflow-hidden">
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/8 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 right-16 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-4 left-1/2 w-64 h-32 bg-white/4 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-80">Total Balance</span>
              </div>
              <button
                className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
                onClick={() => setHideBalance(v => !v)}
              >
                {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {hideBalance ? 'Show' : 'Hide'}
              </button>
            </div>

            <div className="mb-1">
              <span className="text-4xl sm:text-5xl font-bold amount tracking-tight">
                {hideBalance ? '••••••' : formatAmount(balance?.balance)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${balance?.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
              <span className="text-sm opacity-70">Wallet {balance?.status || 'Active'}</span>
            </div>

            <QuickActions />
          </div>
        </div>

        {/* Stats stack — spans 2 cols */}
        <div className="lg:col-span-2 grid grid-cols-2 grid-rows-2 gap-3">
          <StatCard
            icon={Gift} label="Reward Points" color="cyan"
            value={rewards?.points?.toLocaleString() || '0'}
            sub={<span className={`font-semibold ${tierColors[rewards?.tier ?? ''] || 'text-orange-400'}`}>{rewards?.tier || 'BRONZE'} Tier</span> as unknown as string}
          />
          <StatCard
            icon={TrendingUp} label="Points to Next" color="purple"
            value={rewards?.pointsToNextTier?.toLocaleString() || '0'}
            sub={rewards?.nextTier ? `→ ${rewards.nextTier}` : 'Max tier!'}
          />
          <StatCard
            icon={ArrowDownLeft} label="Recent Credits" color="green"
            value={formatAmount(totalCredits)}
          />
          <StatCard
            icon={ArrowUpRight} label="Recent Debits" color="red"
            value={formatAmount(totalDebits)}
          />
        </div>
      </div>

      {/* ── Spending Graph + Rewards (side by side on lg) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendingGraph data={spendingData} />
        </div>

        {/* Rewards tier card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-sm">Rewards Status</h3>
          </div>
          <div className={`text-lg font-bold ${tierColors[rewards?.tier ?? ''] || 'text-orange-400'}`}>
            {rewards?.tier || 'BRONZE'} Member
          </div>
          <div className="text-2xl font-bold amount mt-1 mb-3">
            {rewards?.points?.toLocaleString() || 0} pts
          </div>
          {rewards?.nextTier && (
            <div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2">
                <span>{rewards.tier}</span>
                <span>{rewards.pointsToNextTier} pts to {rewards.nextTier}</span>
              </div>
              <div className="h-2 bg-[var(--bg)] border border-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((rewards.points / ((rewards.pointsToNextTier ?? 1) + rewards.points)) * 100))}%` }}
                />
              </div>
            </div>
          )}
          <Link to="/rewards" className="mt-auto pt-4 btn-secondary w-full text-center text-xs py-2 flex items-center justify-center gap-1">
            <Gift className="w-3.5 h-3.5" /> View Catalog
          </Link>
        </div>
      </div>

      {/* ── Recent Transactions + Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Transactions — 2/3 width */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-bold text-sm">Recent Transactions</h2>
              {wsConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live updates on" />
              )}
            </div>
            <Link to="/transactions" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-medium">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTx.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1 opacity-70">Add money to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--primary-light)] transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCredit(tx, user?.id)
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                  }`}>
                    {isCredit(tx, user?.id)
                      ? <ArrowDownLeft className="w-4 h-4" />
                      : <ArrowUpRight  className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{tx.type}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{tx.description || tx.referenceId || '—'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm amount ${isCredit(tx, user?.id) ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isCredit(tx, user?.id) ? '+' : '-'}{formatAmount(tx.amount)}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{fmtDate(tx.createdAt)}</div>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Security — memoized */}
        <SecurityCard />
      </div>
    </div>
  );
}