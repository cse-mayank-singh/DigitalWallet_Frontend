import { useState, useEffect } from 'react';
import {
  Gift, Star, Zap, Award, ShoppingBag, RefreshCw,
  TrendingUp, ChevronRight, Crown, Sparkles, Clock,
  CheckCircle, ArrowRight, Tag
} from 'lucide-react';
import { rewardsApi } from '../../core/api/services';
import { Modal, StatusBadge, LoadingPage, EmptyState } from '../../shared/components/UI';
import { toast } from '../../shared/components/Toast';
import { useNotifications } from '../../store/NotificationContext';

function fmt(a: number | string): string {
  return `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

const TIER_INFO: Record<string, { gradient: string; label: string; min: number; icon: React.ElementType }> = {
  BRONZE:   { gradient: 'from-orange-400 to-orange-600',   label: 'Bronze',   min: 0,    icon: Award },
  SILVER:   { gradient: 'from-slate-400 to-slate-600',     label: 'Silver',   min: 500,  icon: Award },
  GOLD:     { gradient: 'from-yellow-400 to-yellow-600',   label: 'Gold',     min: 1000, icon: Crown },
  PLATINUM: { gradient: 'from-blue-500 to-pink-500',       label: 'Platinum', min: 5000, icon: Sparkles },
};

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  CASHBACK: { icon: Zap,         color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  COUPON:   { icon: Tag,         color: 'text-blue-500',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
  VOUCHER:  { icon: ShoppingBag, color: 'text-pink-500',   bg: 'bg-pink-100 dark:bg-pink-900/30' },
};

interface RewardSummary { tier: string; points: number; nextTier?: string; pointsToNextTier?: number; }
interface CatalogItem {
  id: number; name: string; description?: string; type: string; pointsRequired: number;
  cashbackAmount?: number; tierRequired?: string; stock?: number; active: boolean;
}
interface HistoryItem { id: number; type: string; points: number; description?: string; createdAt?: string; }

export default function RewardsPage() {
  const { addNotification } = useNotifications();
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemModal, setRedeemModal] = useState<CatalogItem | null>(null);
  const [redeemPtsModal, setRedeemPtsModal] = useState(false);
  const [ptsToRedeem, setPtsToRedeem] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<'catalog' | 'history'>('catalog');

  const load = async () => {
    try {
      const [sRes, cRes, hRes] = await Promise.allSettled([
        rewardsApi.summary(), rewardsApi.catalog(), rewardsApi.transactions(),
      ]);
      if (sRes.status === 'fulfilled') setSummary(sRes.value.data.data);
      if (cRes.status === 'fulfilled') setCatalog(cRes.value.data.data || []);
      if (hRes.status === 'fulfilled') setHistory(hRes.value.data.data || []);
    } catch { toast.error('Failed to load rewards'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRedeem = async (item: CatalogItem) => {
    setActionLoading(true);
    try {
      const res = await rewardsApi.redeem({ rewardId: item.id });
      const data = res.data.data;
      toast.success(`Redeemed! ${data.couponCode ? `Coupon: ${data.couponCode}` : 'Cashback credited.'}`);
      addNotification({ title: 'Reward Redeemed!', message: `${item.name} redeemed successfully`, type: 'success' });
      setRedeemModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    } finally { setActionLoading(false); }
  };

  const handleRedeemPoints = async () => {
    const pts = Number(ptsToRedeem);
    if (!pts || pts < 1) return toast.error('Enter valid points');
    setActionLoading(true);
    try {
      await rewardsApi.redeemPoints(pts);
      toast.success(`${pts} points redeemed as ${fmt(pts)}!`);
      addNotification({ title: 'Points Redeemed', message: `${pts} points → ${fmt(pts)} wallet credit`, type: 'success' });
      setRedeemPtsModal(false);
      setPtsToRedeem('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    } finally { setActionLoading(false); }
  };

  if (loading) return <LoadingPage />;

  const tier = summary?.tier || 'BRONZE';
  const tierInfo = TIER_INFO[tier] || TIER_INFO.BRONZE;
  const TierIcon = tierInfo.icon;

  const progressPct = summary?.nextTier
    ? Math.min(100, Math.round(
        ((summary.points - (TIER_INFO[tier]?.min || 0)) /
         ((summary.pointsToNextTier ?? 0) + summary.points - (TIER_INFO[tier]?.min || 0))) * 100
      ))
    : 100;

  const EARN_TYPES = ['EARN', 'BONUS'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards & Loyalty</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Earn points and redeem for exclusive benefits</p>
        </div>
        <button className="btn-ghost p-2 rounded-xl" onClick={load} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tier Hero Card */}
      <div className={`relative rounded-3xl bg-gradient-to-br ${tierInfo.gradient} p-6 sm:p-8 text-white overflow-hidden`}>
        {/* Decorative */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 right-16 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <TierIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold opacity-80 uppercase tracking-wider">Membership</div>
                <div className="text-xl font-bold">{tierInfo.label} Member</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-70 mb-0.5">1 point = ₹1</div>
              <div className="badge-blue bg-white/20 text-white text-xs">Cashback Rate: 1x</div>
            </div>
          </div>

          <div className="mb-1">
            <span className="text-5xl font-bold amount">{summary?.points?.toLocaleString() || 0}</span>
            <span className="text-lg opacity-70 ml-2">points</span>
          </div>
          <p className="text-sm opacity-70 mb-5">Available to redeem · Equivalent to {fmt(summary?.points || 0)}</p>

          {/* Progress to next tier */}
          {summary?.nextTier && (
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-2 opacity-80">
                <span>{tierInfo.label}</span>
                <span>{summary.pointsToNextTier} pts to {summary.nextTier}</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
          

          <div className="flex gap-3 flex-wrap">
            <button
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              onClick={() => setRedeemPtsModal(true)}
            >
              <Zap className="w-4 h-4" /> Redeem as Cash
            </button>
            <button
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              onClick={() => setTab('catalog')}
            >
              <Gift className="w-4 h-4" /> Browse Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Tier progression */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="font-bold text-sm">Tier Progression</h3>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(TIER_INFO).map(([key, info], i, arr) => {
            const isActive = key === tier;
            const isPast = Object.keys(TIER_INFO).indexOf(key) < Object.keys(TIER_INFO).indexOf(tier);
            return (
              <div key={key} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-1`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1 transition-all
                    ${isPast ? `bg-gradient-to-br ${info.gradient}` : isActive ? `bg-gradient-to-br ${info.gradient} ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-card)]` : 'bg-[var(--bg)] border border-[var(--border)]'}`}>
                    <info.icon className={`w-4 h-4 ${isPast || isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{info.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{info.min}+</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`h-px w-4 mx-1 mt-[-18px] ${isPast ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[var(--bg)] border border-[var(--border)] rounded-2xl w-fit">
        {(['catalog', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all flex items-center gap-2
              ${tab === t ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
            {t === 'catalog' ? <><Gift className="w-3.5 h-3.5" /> Catalog</> : <><Clock className="w-3.5 h-3.5" /> History</>}
          </button>
        ))}
      </div>

      {/* Catalog */}
      {tab === 'catalog' && (
        catalog.length === 0 ? (
          <EmptyState icon={Gift} title="Catalog is empty" desc="No rewards available right now. Check back soon!" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((item) => {
              const typeMeta = TYPE_META[item.type] || { icon: Gift, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-light)]' };
              const TypeIcon = typeMeta.icon;
              const canAfford = (summary?.points || 0) >= item.pointsRequired;
              return (
                <div key={item.id}
                  className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-blue-500/5 hover:border-[var(--primary)]/30 ${!item.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl ${typeMeta.bg} flex items-center justify-center`}>
                      <TypeIcon className={`w-5 h-5 ${typeMeta.color}`} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="badge-blue text-xs">{item.type}</span>
                      {(item.stock ?? 0) > 0 && (
                        <span className="text-xs text-[var(--text-muted)]">{item.stock} left</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="font-bold mb-1">{item.name}</div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">{item.description}</div>
                    {(item.cashbackAmount ?? 0) > 0 && (
                      <div className="text-emerald-500 font-semibold text-sm mt-2">
                        +{fmt(item.cashbackAmount ?? 0)} cashback
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div>
                      <div className="text-lg font-bold text-[var(--primary)] amount">{item.pointsRequired} pts</div>
                      {item.tierRequired && (
                        <div className="text-xs text-[var(--text-muted)]">Requires {item.tierRequired}</div>
                      )}
                    </div>
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${canAfford && item.active
                        ? 'btn-primary'
                        : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                      disabled={!canAfford || !item.active}
                      onClick={() => canAfford && item.active && setRedeemModal(item)}
                    >
                      Redeem <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* History */}
      {tab === 'history' && (
        history.length === 0 ? (
          <EmptyState icon={Star} title="No reward activity" desc="Your reward transactions will appear here as you earn and redeem points." />
        ) : (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {history.map((tx) => {
                const isEarn = EARN_TYPES.includes(tx.type);
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--primary-light)] transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      isEarn ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                    }`}>
                      {isEarn ? <Star className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{tx.description || tx.type}</div>
                      <div className="text-xs text-[var(--text-muted)]">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    </div>
                    <div className={`font-bold text-sm amount ${isEarn ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isEarn ? '+' : '−'}{tx.points} pts
                    </div>
                    <StatusBadge status={tx.type} />
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Redeem item modal */}
      <Modal open={!!redeemModal} onClose={() => setRedeemModal(null)} title="Confirm Redemption" size="sm">
        {redeemModal && (
          <div className="space-y-5">
            <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
              <div className="font-bold mb-1">{redeemModal.name}</div>
              <div className="text-sm text-[var(--text-muted)]">{redeemModal.description}</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--primary)] amount">{redeemModal.pointsRequired} pts</span>
                <span className="text-[var(--text-muted)] text-sm">required</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--primary-light)] border border-[var(--border)] rounded-xl text-sm">
              <CheckCircle className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="text-[var(--text-muted)]">You have <strong className="text-[var(--text)]">{summary?.points?.toLocaleString()} pts</strong> available</span>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setRedeemModal(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => handleRedeem(redeemModal)} disabled={actionLoading}>
                {actionLoading ? 'Processing…' : <><CheckCircle className="w-4 h-4" /> Confirm</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Redeem points as cash modal */}
      <Modal open={redeemPtsModal} onClose={() => setRedeemPtsModal(false)} title="Redeem Points as Cash" size="sm">
        <div className="space-y-5">
          <div className="p-4 bg-[var(--primary-light)] border border-[var(--border)] rounded-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] mb-1">
              <Zap className="w-4 h-4" /> Direct Wallet Credit
            </div>
            <p className="text-xs text-[var(--text-muted)]">Convert your reward points to wallet cash. 1 point = ₹1. Daily cap applies.</p>
          </div>
          <div>
            <label className="label">Points to redeem</label>
            <input
              type="number" min="1" max={summary?.points}
              className="input-field text-2xl font-mono"
              placeholder="0"
              value={ptsToRedeem}
              onChange={(e) => setPtsToRedeem(e.target.value)}
            />
            <div className="flex justify-between mt-1.5 text-xs text-[var(--text-muted)]">
              <span>Available: <strong>{summary?.points?.toLocaleString()} pts</strong></span>
              {ptsToRedeem && <span>= <strong className="text-emerald-500">{fmt(ptsToRedeem)}</strong> wallet credit</span>}
            </div>
          </div>
          <button className="btn-primary w-full py-3" onClick={handleRedeemPoints} disabled={actionLoading || !ptsToRedeem}>
            {actionLoading ? 'Processing…' : <><ArrowRight className="w-4 h-4" /> Redeem {ptsToRedeem || 0} pts</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
