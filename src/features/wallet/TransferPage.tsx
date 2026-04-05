import { useState, ChangeEvent, FormEvent } from 'react';
import {
  Send, User, Info, CheckCircle, Gift, Sparkles
} from 'lucide-react';
import { walletApi, userApi } from '../../core/api/services';
import { toast } from '../../shared/components/Toast';
import { useNotifications } from '../../store/NotificationContext';
import { Spinner } from '../../shared/components/UI';
import NoWalletBanner from '../../shared/components/NoWalletBanner';

function fmt(a: number | string): string {
  return `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED' | 'APPROVED' | null;

function isWalletNotFound(err: unknown): boolean {
  const e = err as any;
  const status: number = e?.response?.status;
  const msg: string = (e?.response?.data?.message || '').toLowerCase();
  return (
    status === 404 ||
    msg.includes('wallet not found') ||
    msg.includes('no wallet') ||
    msg.includes('wallet not activated')
  );
}

interface TransferForm {
  receiverId: string;
  amount: string;
  description: string;
}

interface TransferSuccess {
  amount: string;
  receiverId: string;
}

export default function TransferPage() {
  const { addNotification } = useNotifications();

  const [form, setForm] = useState<TransferForm>({
    receiverId: '',
    amount: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<TransferSuccess | null>(null);
  const [walletMissing, setWalletMissing] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.receiverId || !form.amount)
      return toast.error('Fill all fields');

    if (Number(form.amount) < 1 || Number(form.amount) > 25000)
      return toast.error('Amount must be ₹1–₹25,000');

    setLoading(true);

    try {
      await walletApi.transfer({
        receiverId: Number(form.receiverId),
        amount: Number(form.amount),
        description: form.description,
        idempotencyKey: `txn_${Date.now()}_${form.receiverId}`,
      });

      setSuccess({
        amount: form.amount,
        receiverId: form.receiverId
      });

      addNotification({
        title: 'Transfer Successful',
        message: `₹${form.amount} sent`,
        type: 'success'
      });

      toast.success(`Sent ${fmt(form.amount)}`);
      setForm({ receiverId: '', amount: '', description: '' });

    } catch (err: any) {
      if (isWalletNotFound(err)) {
        const kycRes = await userApi.kycStatus().catch(() => null);
        setKycStatus(kycRes?.data?.data?.status ?? null);
        setWalletMissing(true);
      } else {
        toast.error(err.response?.data?.message || 'Transfer failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const rewardPoints =
    form.amount && Number(form.amount) > 0
      ? Math.floor(Number(form.amount) / 100)
      : 0;

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-6">

      {/* 🔥 TITLE */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow">
          Send Money
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Fast • Secure • Rewarding
        </p>
      </div>

      {/* 🟡 GOLD REWARD BANNER */}
      <div className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 transition-all hover:scale-[1.01]">
        <div className="rounded-2xl bg-black/70 backdrop-blur-xl p-4 flex items-center gap-3 relative overflow-hidden">

          {/* glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20" />

          <div className="p-2 bg-yellow-400/20 rounded-xl">
            <Gift className="w-5 h-5 text-yellow-300" />
          </div>

          <div>
            <p className="text-sm font-semibold text-yellow-200">
              Earn Rewards ✨
            </p>
            <p className="text-xs text-yellow-300/80">
              Every ₹100 = +1 reward point
            </p>
          </div>

          <Sparkles className="ml-auto w-5 h-5 text-yellow-300 opacity-80" />
        </div>
      </div>

      {walletMissing && (
        <NoWalletBanner kycStatus={kycStatus} variant="inline" />
      )}

      {/* ✅ SUCCESS */}
      {success && (
        <div className="group p-[1px] rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 hover:scale-[1.01] transition">
          <div className="p-5 rounded-2xl bg-black/70 backdrop-blur-xl flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <div>
              <div className="font-bold text-emerald-300">
                Transfer Successful
              </div>
              <div className="text-sm text-emerald-400">
                {fmt(success.amount)} sent
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💎 FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="group p-[1px] rounded-2xl bg-gradient-to-r from-yellow-400/40 via-transparent to-yellow-400/40 hover:scale-[1.01] transition"
      >
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border)] space-y-5 shadow-lg">

          {/* receiver */}
          <div className="hover:scale-[1.01] transition">
            <label className="label">Recipient ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
              <input
                name="receiverId"
                type="number"
                className="input-field pl-10 focus:ring-yellow-400/50"
                value={form.receiverId}
                onChange={handleChange}
                placeholder='0'
                required
              />
            </div>
          </div>

          {/* amount */}
          <div className="hover:scale-[1.01] transition">
            <label className="label">Amount</label>
            <input
              name="amount"
              type="number"
              className="input-field text-2xl font-semibold focus:ring-yellow-400/50"
              value={form.amount}
              onChange={handleChange}
              placeholder='100.00'
              required
            />
          </div>

          {/* desc */}
          <div className="hover:scale-[1.01] transition">
            <label className="label">Description</label>
            <input
              name="description"
              type="text"
              className="input-field focus:ring-yellow-400/50"
              value={form.description}
              onChange={handleChange}
              placeholder='[OPTIONAL]'
            />
          </div>

          {/* 💰 SUMMARY */}
          {form.amount && Number(form.amount) > 0 && (
            <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30 space-y-2 hover:shadow-lg hover:shadow-yellow-400/10 transition">
              <div className="flex justify-between text-sm">
                <span>Amount</span>
                <span>{fmt(form.amount)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Rewards</span>
                <span className="text-yellow-400 font-bold">
                  +{rewardPoints} pts
                </span>
              </div>

              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{fmt(form.amount)}</span>
              </div>
            </div>
          )}

          {/* 🚀 BUTTON */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2
              bg-gradient-to-r from-yellow-400 to-amber-500 text-black
              hover:shadow-lg hover:shadow-yellow-400/30 hover:scale-[1.02]
              active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : <><Send className="w-4 h-4" /> Transfer</>}
          </button>

        </div>
      </form>

      {/* 📘 GUIDELINES */}
      <div className="group p-[1px] rounded-2xl bg-gradient-to-r from-yellow-400/30 to-transparent hover:scale-[1.01] transition">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-yellow-400">
            <Info className="w-4 h-4" /> Guidelines
          </h3>
          <ul className="text-xs text-[var(--text-muted)] space-y-1">
            <li>• Instant transfers</li>
            <li>• Max ₹25,000</li>
            <li>• Secure & encrypted</li>
            <li>• Non-reversible</li>
          </ul>
        </div>
      </div>

    </div>
  );
}