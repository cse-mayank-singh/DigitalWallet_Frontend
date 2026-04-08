import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Users, Shield, AlertTriangle, TrendingUp, Search, Check, X, RefreshCw, Plus } from 'lucide-react';
import { adminApi } from '../../core/api/services';
import { StatCard, StatusBadge, LoadingPage, Modal, EmptyState } from '../../shared/components/UI';
import { toast } from '../../shared/components/Toast';
import { useNotifications } from '../../store/NotificationContext';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { useAuth } from '../../store/AuthContext';

function fmt(n: number | undefined | null): string {
  return Number(n || 0).toLocaleString();
}

interface AdminStats {
  totalUsers?: number;
  activeUsers?: number;
  blockedUsers?: number;
  kycPending?: number;
  newUsersToday?: number;
  newUsersThisWeek?: number;
  kycApproved?: number;
  kycRejected?: number;
}

interface AdminUser {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  kycStatus?: string;
}

interface KycItem {
  id?: number;
  kycId?: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  docType?: string;
  docNumber?: string;
}

interface CatalogForm {
  name: string;
  description: string;
  pointsRequired: string;
  type: string;
  stock: string;
  cashbackAmount: string;
}

type TabId = 'dashboard' | 'users' | 'kyc' | 'catalog';

export default function AdminPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [kycQueue, setKycQueue] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [addCatalogModal, setAddCatalogModal] = useState(false);
  const [catalogForm, setCatalogForm] = useState<CatalogForm>({
    name: '', description: '', pointsRequired: '', type: 'CASHBACK', stock: '', cashbackAmount: '',
  });
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.dashboard();
      setStats(res.data.data);
    } catch { toast.error('Failed to load dashboard stats'); }
    finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedSearch) {
        res = await adminApi.searchUsers(debouncedSearch, page, 15);
      } else {
        res = await adminApi.listUsers({ page, size: 15 });
      }
      setUsers(res.data.data?.content || []);
      setTotalPages(res.data.data?.totalPages || 1);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [debouncedSearch, page]);

  const loadKyc = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.pendingKyc();
      // console.log(res,"testing")
      setKycQueue(res.data?.data.content || res.data || []);
    } catch { toast.error('Failed to load KYC queue'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'users') loadUsers();
    else if (tab === 'kyc') loadKyc();
  }, [tab, loadDashboard, loadUsers, loadKyc]);

  const blockUser = async (userId: number, isBlocked: boolean) => {
    try {
      if (isBlocked) await adminApi.unblockUser(userId);
      else await adminApi.blockUser(userId);
      toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'}`);
      addNotification({ title: 'User Updated', message: `User #${userId} ${isBlocked ? 'unblocked' : 'blocked'}`, type: 'info' });
      loadUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const changeRole = async (userId: number, newRole: string) => {
    try {
      await adminApi.changeRole(userId, newRole);
      toast.success(`Role changed to ${newRole}`);
      loadUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const approveKyc = async (kycId: number) => {
    try {
      await adminApi.approveKycById(kycId);
      toast.success('KYC approved');
      addNotification({ title: 'KYC Approved', message: `KYC #${kycId} approved`, type: 'success' });
      loadKyc();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Approval failed'); }
  };

  const rejectKyc = async (kycId: number, reason: string) => {
    try {
      await adminApi.rejectKycById(kycId, reason);
      toast.success('KYC rejected');
      setRejectModal(null);
      loadKyc();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Rejection failed'); }
  };

  const addCatalogItem = async () => {
    try {
      await adminApi.addCatalogItem({
        ...catalogForm,
        pointsRequired: Number(catalogForm.pointsRequired),
        stock: Number(catalogForm.stock),
        cashbackAmount: Number(catalogForm.cashbackAmount) || 0,
      });
      toast.success('Catalog item added!');
      setAddCatalogModal(false);
      setCatalogForm({ name: '', description: '', pointsRequired: '', type: 'CASHBACK', stock: '', cashbackAmount: '' });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add item'); }
  };

  const refreshCurrent = () => {
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'users') loadUsers();
    else if (tab === 'kyc') loadKyc();
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: ' Dashboard' },
    { id: 'users', label: ' Users' },
    { id: 'kyc', label: ' KYC Queue' },
    { id: 'catalog', label: 'Catalog' },
  ];

  const currentUserId = user?.id;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" /> Admin Panel
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage users, KYC, and rewards</p>
        </div>
        <button className="btn-ghost p-2" onClick={refreshCurrent}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-[var(--text-muted)]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        loading ? <LoadingPage /> : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={fmt(stats.totalUsers)} color="cyan" />
            <StatCard icon={TrendingUp} label="Active Users" value={fmt(stats.activeUsers)} color="green" />
            <StatCard icon={AlertTriangle} label="Blocked Users" value={fmt(stats.blockedUsers)} color="red" />
            <StatCard icon={Shield} label="KYC Pending" value={fmt(stats.kycPending)} color="yellow" />
            <StatCard icon={Users} label="New Today" value={fmt(stats.newUsersToday)} color="cyan" />
            <StatCard icon={Users} label="This Week" value={fmt(stats.newUsersThisWeek)} color="purple" />
            <StatCard icon={Shield} label="KYC Approved" value={fmt(stats.kycApproved)} color="green" />
            <StatCard icon={Shield} label="KYC Rejected" value={fmt(stats.kycRejected)} color="red" />
          </div>
        ) : null
      )}
{/* Users Tab */}
{tab === 'users' && (
  <div className="space-y-4">
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input className="input-field pl-9" placeholder="Search name, email, phone…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      </div>
    </div>

    <div className="card overflow-hidden">
      {loading ? <LoadingPage /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  (() => {
                    const isSelf = u.id === currentUserId;
                    return (
                  <tr key={u.id} className="border-b border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center">
                          {(u.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <select className="input-field py-1 text-xs w-28 disabled:opacity-60 disabled:cursor-not-allowed" value={u.role || 'USER'}
                        disabled={isSelf}
                        title={isSelf ? 'You cannot change your own role' : undefined}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => changeRole(u.id, e.target.value)}>
                        {['USER', 'ADMIN', 'MERCHANT'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {isSelf && <p className="text-[10px] text-[var(--text-muted)] mt-1">Your role is locked</p>}
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge status={u.status || 'ACTIVE'} />
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                            u.status === 'BLOCKED'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit`}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot block your own account' : undefined}
                          onClick={() => blockUser(u.id, u.status === 'BLOCKED')}>
                          {isSelf ? 'Protected' : u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {users.map((u) => (
              <div key={u.id} className="p-4 space-y-3">
                {(() => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 text-white font-bold flex items-center justify-center">
                    {(u.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <StatusBadge status={u.status || 'ACTIVE'} />

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] font-semibold">
                    {u.role || 'USER'}
                  </span>

                  <button
                    className={`text-xs px-3 py-1 rounded-lg font-semibold ${
                      u.status === 'BLOCKED'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-red-100 text-red-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isSelf}
                    title={isSelf ? 'You cannot block your own account' : undefined}
                    onClick={() => blockUser(u.id, u.status === 'BLOCKED')}>
                    {isSelf ? 'Protected' : u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                  </button>
                </div>
                {isSelf && <p className="text-xs text-[var(--text-muted)]">Your admin account cannot be blocked or demoted.</p>}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-[var(--border)]">
              <button className="btn-secondary px-3 py-1.5 text-sm" disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="text-sm text-[var(--text-muted)]">
                Page {page + 1} / {totalPages}
              </span>
              <button className="btn-secondary px-3 py-1.5 text-sm" disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
)}

      {/* KYC Tab */}
      {tab === 'kyc' && (
        loading ? <LoadingPage /> : kycQueue.length === 0 ? (
          <EmptyState icon={Shield} title="No pending KYC submissions" desc="All caught up!" />
        ) : (
          <div className="space-y-3">
            {kycQueue.map((k) => {
              const kycId = k.kycId ?? k.id ?? 0;
              return (
                <div key={kycId} className="card p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-48">
                    <div className="font-bold">{k.userName || `User #${k.userId}`}</div>
                    <div className="text-sm text-[var(--text-muted)]">{k.userEmail}</div>
                    <div className="mt-2 flex gap-3 text-xs text-[var(--text-muted)]">
                      <span>Doc: <span className="font-semibold text-[var(--text)]">{k.docType}</span></span>
                      <span>#{k.docNumber}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 hover:bg-emerald-200 transition-all"
                      onClick={() => approveKyc(kycId)}>
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 hover:bg-red-200 transition-all"
                      onClick={() => setRejectModal(kycId)}>
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Catalog Tab */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <button className="btn-primary flex items-center gap-2" onClick={() => setAddCatalogModal(true)}>
            <Plus className="w-4 h-4" /> Add Catalog Item
          </button>
          <div className="card p-6">
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Use "Add Catalog Item" to create new rewards for users.<br />
              <span className="text-xs">Items added here will appear in the Rewards Catalog.</span>
            </p>
          </div>
        </div>
      )}

      {/* Reject KYC Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject KYC" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Rejection Reason</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="State the reason…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setRejectModal(null)}>Cancel</button>
            <button
              className="btn-danger flex-1"
              onClick={() => rejectModal && rejectKyc(rejectModal, rejectReason)}
              disabled={!rejectReason}>
              Reject KYC
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Catalog Modal */}
      <Modal open={addCatalogModal} onClose={() => setAddCatalogModal(false)} title="Add Reward Item" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Name', key: 'name' as keyof CatalogForm, placeholder: 'e.g. 10% Cashback' },
            { label: 'Points Required', key: 'pointsRequired' as keyof CatalogForm, inputType: 'number', placeholder: '100' },
            { label: 'Stock', key: 'stock' as keyof CatalogForm, inputType: 'number', placeholder: '50' },
            { label: 'Cashback Amount (₹)', key: 'cashbackAmount' as keyof CatalogForm, inputType: 'number', placeholder: '0' },
          ].map(({ label, key, inputType, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                type={inputType || 'text'}
                className="input-field"
                placeholder={placeholder}
                value={catalogForm[key]}
                onChange={(e) => setCatalogForm({ ...catalogForm, [key]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="label">Type</label>
            <select className="input-field" value={catalogForm.type}
              onChange={(e) => setCatalogForm({ ...catalogForm, type: e.target.value })}>
              {['CASHBACK', 'COUPON', 'VOUCHER'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <input className="input-field" placeholder="Short description" value={catalogForm.description}
              onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={() => setAddCatalogModal(false)}>Cancel</button>
          <button className="btn-primary flex-1" onClick={addCatalogItem}>Add Item</button>
        </div>
      </Modal>
    </div>
  );
}
