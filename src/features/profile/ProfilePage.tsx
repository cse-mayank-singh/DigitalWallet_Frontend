import { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  FileText, CheckCircle, Clock, XCircle, Upload, User,
  Mail, Phone, Calendar, Shield, Edit3, Save, X,
  Camera, BadgeCheck, AlertTriangle, Lock, ChevronRight
} from 'lucide-react';
import { userApi } from '../../core/api/services';
import { StatusBadge, LoadingPage } from '../../shared/components/UI';
import { toast } from '../../shared/components/Toast';
import { useAuth } from '../../store/AuthContext';
import { useNotifications } from '../../store/NotificationContext';

const DOC_TYPES = ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'];

interface Profile {
  id?: number; name?: string; email?: string; phone?: string; status?: string; createdAt?: string;
}
interface KycData {
  status: string; docType?: string; docNumber?: string; submittedAt?: string; rejectionReason?: string;
}

const kycStatusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; text: string; desc: string }> = {
  APPROVED: { icon: BadgeCheck, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'KYC Approved', desc: 'All features are unlocked' },
  PENDING: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'Under Review', desc: 'Your documents are being verified' },
  REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20', text: 'KYC Rejected', desc: 'Please resubmit your documents' },
  NOT_SUBMITTED: { icon: FileText, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg)]', text: 'Not Submitted', desc: 'Submit KYC to unlock all features' },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [kycForm, setKycForm] = useState({ docType: 'AADHAAR', docNumber: '' });
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, kRes] = await Promise.allSettled([userApi.profile(), userApi.kycStatus()]);
        if (pRes.status === 'fulfilled') {
          setProfile(pRes.value.data.data);
          setForm({ name: pRes.value.data.data.name || '', phone: pRes.value.data.data.phone || '' });
        }
        if (kRes.status === 'fulfilled') setKyc(kRes.value.data.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await userApi.updateProfile(form);
      setProfile(res.data.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaveLoading(false); }
  };

  const submitKyc = async () => {
    if (!kycForm.docNumber || !kycFile) return toast.error('Fill all KYC fields and upload document');
    setKycLoading(true);
    try {
      const fd = new FormData();
      fd.append('docFile', kycFile);
      fd.append('docType', kycForm.docType);
      fd.append('docNumber', kycForm.docNumber);
      const res = await userApi.kycSubmit(fd);
      setKyc(res.data.data);
      addNotification({ title: 'KYC Submitted', message: 'Your KYC documents are under review', type: 'info' });
      toast.success('KYC submitted for review!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'KYC submission failed');
    } finally { setKycLoading(false); }
  };

  if (loading) return <LoadingPage />;

  const kycStatus = kyc?.status || 'NOT_SUBMITTED';
  const kycConfig = kycStatusConfig[kycStatus] || kycStatusConfig.NOT_SUBMITTED;
  const KycIcon = kycConfig.icon;
  const initials = (profile?.name || user?.fullName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const userId = profile?.id ?? user?.id;

  return (
  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

    {/* LEFT SIDEBAR */}
    <div className="lg:col-span-1 space-y-6">

      {/* Profile Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 text-center relative overflow-hidden">
        
        {/* Gradient Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-pink-500/20 blur-3xl" />

        {/* Avatar */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
          {initials}
        </div>

        <h2 className="mt-4 text-lg font-bold">{profile?.name || user?.fullName}</h2>
        <p className="text-sm text-[var(--text-muted)]">{profile?.email || user?.email}</p>

        <div className="flex justify-center gap-2 mt-3">
          <StatusBadge status={profile?.status || 'ACTIVE'} />
          <StatusBadge status={kycStatus} />
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <p className="text-xs text-[var(--text-muted)]">User ID</p>
          <p className="font-semibold">{userId ?? '-'}</p>
        </div>

        {/* Actions */}
        <button
          onClick={() => setEditing(!editing)}
          className="mt-5 w-full btn-primary"
        >
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {/* Quick Info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 space-y-4">
        <h3 className="font-semibold text-sm text-[var(--text-muted)]">Account Info</h3>

        <div className="text-sm">
          <p className="text-[var(--text-muted)]">Phone</p>
          <p className="font-semibold">{profile?.phone || '—'}</p>
        </div>

        <div className="text-sm">
          <p className="text-[var(--text-muted)]">Member Since</p>
          <p className="font-semibold">
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString('en-IN')
              : '—'}
          </p>
        </div>
      </div>

    </div>

    {/* RIGHT CONTENT */}
    <div className="lg:col-span-2 space-y-6">

      {/* KYC HERO */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kycConfig.bg}`}>
            <KycIcon className={`w-7 h-7 ${kycConfig.color}`} />
          </div>

          <div>
            <h2 className="font-bold text-lg">{kycConfig.text}</h2>
            <p className="text-sm text-[var(--text-muted)]">{kycConfig.desc}</p>
          </div>
        </div>

        <span className={`px-4 py-2 rounded-xl text-xs font-bold ${kycConfig.bg} ${kycConfig.color}`}>
          {kycStatus}
        </span>
      </div>

      {/* PROFILE EDIT FORM */}
      {editing && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-4">
          <h3 className="font-bold">Edit Profile</h3>

          <input
            className="input-field"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="input-field"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <button className="btn-primary w-full" onClick={saveProfile}>
            Save Changes
          </button>
        </div>
      )}

      {/* KYC DETAILS */}
      {kyc && kycStatus !== 'NOT_SUBMITTED' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--text-muted)]">User ID</p>
            <p className="font-semibold">{userId ?? '-'}</p>
          </div>

          <div>
            <p className="text-[var(--text-muted)]">Doc Type</p>
            <p className="font-semibold">{kyc.docType}</p>
          </div>

          <div>
            <p className="text-[var(--text-muted)]">Doc Number</p>
            <p className="font-semibold">{kyc.docNumber}</p>
          </div>

          <div>
            <p className="text-[var(--text-muted)]">Status</p>
            <StatusBadge status={kyc.status} />
          </div>

          <div>
            <p className="text-[var(--text-muted)]">Submitted</p>
            <p className="font-semibold">
              {kyc.submittedAt
                ? new Date(kyc.submittedAt).toLocaleDateString('en-IN')
                : '—'}
            </p>
          </div>
        </div>
      )}

      {/* KYC SUBMISSION */}
      {(kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED') && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-4">

          <h3 className="font-bold">Submit KYC</h3>

          <select
            className="input-field"
            value={kycForm.docType}
            onChange={(e) => setKycForm({ ...kycForm, docType: e.target.value })}
          >
            {DOC_TYPES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <input
            className="input-field"
            placeholder="Document Number"
            value={kycForm.docNumber}
            onChange={(e) => setKycForm({ ...kycForm, docNumber: e.target.value })}
          />

          {/* Upload */}
          <div
            className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:border-[var(--primary)]"
            onClick={() => fileRef.current?.click()}
          >
            {kycFile ? kycFile.name : 'Click to upload document'}
          </div>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setKycFile(e.target.files?.[0] ?? null)
            }
          />

          <button className="btn-primary w-full" onClick={submitKyc}>
            Submit KYC
          </button>
        </div>
      )}

      {/* STATES */}
      {kycStatus === 'PENDING' && (
        <div className="text-center py-10">
          <Clock className="w-10 h-10 mx-auto text-yellow-500 animate-pulse" />
          <p className="mt-3 font-semibold">Verification in progress</p>
        </div>
      )}

      {kycStatus === 'APPROVED' && (
  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[180px]">
    
    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
      <BadgeCheck className="w-7 h-7 text-emerald-500" />
    </div>

    <p className="font-semibold text-emerald-500">
      Verified User
    </p>

    <p className="text-sm text-[var(--text-muted)] mt-1">
      Thank you for choosing DigiWallet
    </p>

  </div>
)}

    </div>
  </div>
);
}

