import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wallet, Plus, ArrowDownLeft, Download, RefreshCw,
  CheckCircle, XCircle, Loader, ArrowUpLeft, Eye, EyeOff,
  CreditCard, Calendar, ChevronLeft, ChevronRight,
  FileText, TrendingDown, TrendingUp, Banknote
} from 'lucide-react';
import { walletApi, userApi } from '../../core/api/services';
import { Modal, StatusBadge, LoadingPage, EmptyState } from '../../shared/components/UI';
import { toast } from '../../shared/components/Toast';
import { useNotifications } from '../../store/NotificationContext';
import { useAuth } from '../../store/AuthContext';
import NoWalletBanner from '../../shared/components/NoWalletBanner';

function isWalletNotFound(err: unknown): boolean {
  const e = err as any;
  const status: number = e?.response?.status;
  const msg: string = (e?.response?.data?.message || '').toLowerCase();
  return (
    status === 404 ||
    msg.includes('wallet not found') ||
    msg.includes('wallet does not exist') ||
    msg.includes('no wallet') ||
    msg.includes('wallet not activated') ||
    msg.includes('wallet inactive')
  );
}

type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED' | 'APPROVED' | null;

declare global {
  interface Window { Razorpay: any; }
}

function fmt(a: number | string | undefined | null): string {
  return `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}
function fmtDate(d?: string | null): string {
  return d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type PayStatus = 'idle' | 'creatingOrder' | 'paying' | 'verifying' | 'success' | 'failed';

interface Balance { balance: number; status?: string; lastUpdated?: string; }
interface LedgerEntry { id: number; type: string; amount: number; description?: string; referenceId?: string; createdAt?: string; }

export default function WalletPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [balance, setBalance] = useState<Balance | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [walletMissing, setWalletMissing] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);
  const [hideBalance, setHideBalance] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [payStatus, setPayStatus] = useState<PayStatus>('idle');
  const [lastPayment, setLastPayment] = useState<{ paymentId: string; orderId: string } | null>(null);
  const [failMsg, setFailMsg] = useState('');

  const payStatusRef = useRef<PayStatus>('idle');
  const setPayStatusSafe = (v: PayStatus | ((prev: PayStatus) => PayStatus)) => {
    const next = typeof v === 'function' ? v(payStatusRef.current) : v;
    payStatusRef.current = next;
    setPayStatus(next);
  };

  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [stmtFrom, setStmtFrom] = useState('');
  const [stmtTo, setStmtTo] = useState('');

  const loadData = useCallback(async () => {
    try {
      const kycRes = await userApi.kycStatus().catch(() => null);
      if (kycRes) setKycStatus(kycRes.data?.data?.status ?? null);

      const [bRes, lRes] = await Promise.allSettled([
        walletApi.balance(),
        walletApi.ledger(page, 15),
      ]);

      if (bRes.status === 'rejected') {
        if (isWalletNotFound(bRes.reason)) { setWalletMissing(true); setLoading(false); return; }
        toast.error('Failed to load wallet balance');
      } else {
        setWalletMissing(false);
        setBalance(bRes.value.data.data);
      }

      if (lRes.status === 'fulfilled') {
        setLedger(lRes.value.data.content || []);
        setTotalPages(lRes.value.data.totalPages || 1);
      }
    } catch { toast.error('Failed to load wallet data'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetAddModal = () => {
    setAddModal(false); setAmount(''); setPayStatusSafe('idle'); setLastPayment(null); setFailMsg('');
  };

  const handleAddMoney = async () => {
    const rupees = Number(amount);
    if (!rupees || rupees < 1) return toast.error('Enter a valid amount (min ₹1)');
    setPayStatusSafe('creatingOrder');
    const sdkReady = await loadRazorpayScript();
    if (!sdkReady) { toast.error('Could not load Razorpay SDK.'); setPayStatusSafe('idle'); return; }

    let order: any;
    try {
      const res = await walletApi.createOrder(rupees);
      order = res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create payment order');
      setPayStatusSafe('idle'); return;
    }

    if (!order?.orderId) { toast.error('Invalid order received.'); setPayStatusSafe('idle'); return; }

    setPayStatusSafe('paying');
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: order.amount, currency: order.currency || 'INR',
      name: 'DigiWallet', description: 'Wallet Top-up', order_id: order.orderId,
      handler: async function (response: any) {
        setPayStatusSafe('verifying');
        await verifyPayment(response);
      },
      prefill: { name: user?.fullName || '', email: user?.email || '' },
      theme: { color: '#2563eb' },
      modal: {
        ondismiss: () => {
          if (payStatusRef.current === 'paying') { setPayStatusSafe('idle'); toast.info('Payment cancelled'); }
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      const msg = response.error.description || 'Payment was not completed';
      setFailMsg(msg); setPayStatusSafe('failed');
      addNotification({ title: 'Payment Failed', message: msg, type: 'error' });
    });
    rzp.open();
  };

  const verifyPayment = async (rzpResponse: any) => {
    const payload = {
      razorpayPaymentId: rzpResponse.razorpay_payment_id,
      razorpayOrderId: rzpResponse.razorpay_order_id,
      razorpaySignature: rzpResponse.razorpay_signature,
    };
    try {
      await walletApi.verifyPayment(payload);
      setLastPayment({ paymentId: rzpResponse.razorpay_payment_id, orderId: rzpResponse.razorpay_order_id });
      setPayStatusSafe('success');
      toast.success(`${fmt(amount)} added to your wallet!`, 'Top-up Successful');
      addNotification({ title: 'Wallet Topped Up', message: `${fmt(amount)} credited via Razorpay`, type: 'success' });
      setTimeout(loadData, 800);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Verification failed — contact support';
      setFailMsg(msg); setPayStatusSafe('failed'); toast.error(msg);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt || Number(withdrawAmt) < 1) return toast.error('Enter a valid amount');
    setWithdrawLoading(true);
    try {
      await walletApi.withdraw({ amount: Number(withdrawAmt) });
      toast.success(`${fmt(withdrawAmt)} withdrawn successfully`);
      addNotification({ title: 'Withdrawal Successful', message: `${fmt(withdrawAmt)} withdrawn`, type: 'success' });
      setWithdrawModal(false); setWithdrawAmt(''); loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally { setWithdrawLoading(false); }
  };

  const downloadStatement = async () => {
    if (!stmtFrom || !stmtTo) return toast.error('Select date range');
    try {
      const res = await walletApi.downloadStatement(stmtFrom, stmtTo);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `statement_${stmtFrom}_${stmtTo}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Statement downloaded');
    } catch { toast.error('Failed to download statement'); }
  };

  if (loading) return <LoadingPage />;

  if (walletMissing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <button className="btn-ghost p-2" onClick={loadData}><RefreshCw className="w-4 h-4" /></button>
        </div>
        <NoWalletBanner kycStatus={kycStatus} variant="page" />
      </div>
    );
  }

  const quickAmounts = [100, 500, 1000, 2000, 5000];
  const isProcessing = ['creatingOrder', 'paying', 'verifying'].includes(payStatus);

  const AddMoneyContent = () => {
    if (payStatus === 'creatingOrder') return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
          <Loader className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
        <p className="font-bold">Creating payment order…</p>
        <p className="text-sm text-[var(--text-muted)]">Connecting to Razorpay</p>
      </div>
    );

    if (payStatus === 'paying') return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-[var(--primary)] animate-pulse" />
        </div>
        <p className="font-bold">Razorpay checkout is open</p>
        <p className="text-sm text-[var(--text-muted)]">Complete the payment in the Razorpay popup</p>
      </div>
    );

    if (payStatus === 'verifying') return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
          <Loader className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
        <p className="font-bold">Verifying payment…</p>
        <p className="text-sm text-[var(--text-muted)]">Crediting your wallet — please wait</p>
      </div>
    );

    if (payStatus === 'success') return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-xl text-emerald-600 dark:text-emerald-400">Payment Successful!</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">{fmt(amount)} added to your wallet</p>
        </div>
        {lastPayment && (
          <div className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)] font-semibold">Payment ID</span>
              <span className="font-mono font-semibold truncate ml-4">{lastPayment.paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)] font-semibold">Order ID</span>
              <span className="font-mono font-semibold truncate ml-4">{lastPayment.orderId}</span>
            </div>
          </div>
        )}
        <button className="btn-primary w-full py-3" onClick={resetAddModal}>Done</button>
      </div>
    );

    if (payStatus === 'failed') return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-xl text-red-600 dark:text-red-400">Payment Failed</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">{failMsg}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button className="btn-secondary flex-1" onClick={resetAddModal}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => { setPayStatusSafe('idle'); setFailMsg(''); }}>Try Again</button>
        </div>
      </div>
    );

    return (
      <div className="space-y-5">
        <div>
          <label className="label">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[var(--text-muted)]">₹</span>
            <input
              className="input-field text-2xl font-mono pl-9"
              type="number" min="1" placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMoney()}
              autoFocus
            />
          </div>
        </div>
        <div>
          <label className="label">Quick Select</label>
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((a) => (
              <button
                key={a}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                  Number(amount) === a
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                }`}
                onClick={() => setAmount(String(a))}
              >
                ₹{a.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        {Number(amount) > 0 && (
          <div className="flex items-center justify-between p-4 bg-[var(--primary-light)] border border-[var(--border)] rounded-2xl">
            <span className="text-sm text-[var(--text-muted)]">You will be charged</span>
            <span className="font-bold amount text-xl">{fmt(amount)}</span>
          </div>
        )}
        <button
          className="btn-primary w-full text-base py-3.5"
          onClick={handleAddMoney}
          disabled={!amount || Number(amount) < 1}
        >
          <CreditCard className="w-4 h-4" />
          Pay {amount ? fmt(amount) : ''} via Razorpay
        </button>
        <p className="text-xs text-center text-[var(--text-muted)]">
          🔒 Secured by Razorpay · UPI · Cards · Net Banking
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your balance and transactions</p>
        </div>
        <button className="btn-ghost p-2 rounded-xl" onClick={loadData} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Balance card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 dark:from-blue-950 dark:via-slate-900 dark:to-slate-900 p-6 sm:p-8 text-white overflow-hidden">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-72 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-4 right-4 opacity-5"><Wallet className="w-32 h-32" /></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 opacity-70" />
              <span className="text-sm font-medium opacity-70">Available Balance</span>
            </div>
            <button
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => setHideBalance(v => !v)}
            >
              {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {hideBalance ? 'Show' : 'Hide'}
            </button>
          </div>

          <div className="mb-1">
            <span className="text-4xl sm:text-5xl font-bold amount">
              {hideBalance ? '••••••' : fmt(balance?.balance)}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-6 text-sm opacity-60">
            <div className={`w-2 h-2 rounded-full ${balance?.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
            <span>Wallet {balance?.status || 'Active'}</span>
            <span>·</span>
            <span>Updated {fmtDate(balance?.lastUpdated)}</span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              className="flex items-center gap-2 bg-[var(--primary)] hover:bg-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              onClick={() => setAddModal(true)}
            >
              <Plus className="w-4 h-4" /> Add Money
            </button>
            <button
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              onClick={() => setWithdrawModal(true)}
            >
              <ArrowUpLeft className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Statement download */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="font-bold text-sm">Download Statement</h2>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-32">
            <label className="label">From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input type="date" className="input-field pl-9 text-sm" value={stmtFrom}
                onChange={(e) => setStmtFrom(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 min-w-32">
            <label className="label">To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input type="date" className="input-field pl-9 text-sm" value={stmtTo}
                onChange={(e) => setStmtTo(e.target.value)} />
            </div>
          </div>
          <button className="btn-secondary flex items-center gap-2 text-sm py-3" onClick={downloadStatement}>
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <Banknote className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="font-bold text-sm">Ledger</h2>
        </div>

        {ledger.length === 0 ? (
          <div className="py-12">
            <EmptyState icon={Wallet} title="No ledger entries yet" desc="Your transaction history will appear here after your first transaction." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {ledger.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--primary-light)] transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  entry.type === 'CREDIT'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                }`}>
                  {entry.type === 'CREDIT'
                    ? <TrendingDown className="w-4 h-4" />
                    : <TrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{entry.description || entry.referenceId || 'Transaction'}</div>
                  <div className="text-xs text-[var(--text-muted)]">{fmtDate(entry.createdAt)}</div>
                </div>
                <div className={`amount font-bold text-sm shrink-0 ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {entry.type === 'CREDIT' ? '+' : '−'}{fmt(entry.amount)}
                </div>
                <StatusBadge status={entry.type} />
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--text-muted)]">Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong></span>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 btn-secondary px-3 py-2 text-sm" disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button className="flex items-center gap-1 btn-secondary px-3 py-2 text-sm" disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      <Modal
        open={addModal}
        onClose={isProcessing ? () => {} : resetAddModal}
        title={
          payStatus === 'success' ? '🎉 Top-up Successful' :
          payStatus === 'failed' ? '❌ Payment Failed' :
          isProcessing ? '⏳ Processing…' : 'Add Money'
        }
      >
        <AddMoneyContent />
      </Modal>

      {/* Withdraw Modal */}
      <Modal open={withdrawModal} onClose={() => { setWithdrawModal(false); setWithdrawAmt(''); }} title="Withdraw Funds">
        <div className="space-y-5">
          <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl flex items-center gap-3">
            <Wallet className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <div className="text-xs text-[var(--text-muted)] font-medium">Available Balance</div>
              <div className="font-bold amount text-lg">{fmt(balance?.balance)}</div>
            </div>
          </div>
          <div>
            <label className="label">Withdrawal Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[var(--text-muted)]">₹</span>
              <input
                className="input-field text-2xl font-mono pl-9"
                type="number" min="1" placeholder="0"
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <button
            className="btn-primary w-full py-3.5 text-base"
            onClick={handleWithdraw}
            disabled={withdrawLoading || !withdrawAmt || Number(withdrawAmt) < 1}
          >
            {withdrawLoading ? 'Processing…' : <><ArrowDownLeft className="w-4 h-4" /> Withdraw {withdrawAmt ? fmt(withdrawAmt) : ''}</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
