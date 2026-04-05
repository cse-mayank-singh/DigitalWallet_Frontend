import { Link } from 'react-router-dom';
import {
  Wallet, Shield, FileText, ArrowRight,
  CheckCircle, Clock, XCircle, Lock, Sparkles
} from 'lucide-react';

type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED' | 'APPROVED' | null;

interface NoWalletBannerProps {
  kycStatus?: KycStatus;
  variant?: 'page' | 'inline';
}

export default function NoWalletBanner({
  kycStatus = null,
  variant = 'page'
}: NoWalletBannerProps) {

  const steps = [
    {
      icon: FileText,
      title: 'Submit Documents',
      desc: 'Upload Aadhaar, PAN or any valid government ID.',
      done: kycStatus !== null && kycStatus !== 'NOT_SUBMITTED',
      active: !kycStatus || kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED',
    },
    {
      icon: Clock,
      title: 'Verification',
      desc: 'Please wait until Admin verifies your kyc',
      done: kycStatus === 'APPROVED',
      active: kycStatus === 'PENDING',
    },
    {
      icon: Wallet,
      title: 'Wallet Activated',
      desc: 'Start sending & receiving money instantly.',
      done: false,
      active: false,
    },
  ];

  const status = kycStatus ?? 'NOT_SUBMITTED';

  const statusMap = {
    NOT_SUBMITTED: {
      label: 'KYC Required',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/30',
      icon: FileText
    },
    PENDING: {
      label: 'Under Review',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/30',
      icon: Clock
    },
    REJECTED: {
      label: 'Rejected',
      color: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/30',
      icon: XCircle
    },
    APPROVED: {
      label: 'Approved',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/30',
      icon: CheckCircle
    },
  };

  const cfg = statusMap[status];
  const StatusIcon = cfg.icon;

  /* ───────── INLINE VERSION ───────── */
  if (variant === 'inline') {
    return (
      <div className="group p-[1px] rounded-2xl bg-gradient-to-r from-yellow-400/40 to-transparent hover:scale-[1.01] transition">
        <div className={`p-5 rounded-2xl backdrop-blur-xl bg-[var(--bg-card)] border ${cfg.bg}`}>
          <div className="flex gap-4 items-start">

            <div className="p-2 rounded-xl bg-yellow-400/20">
              <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
            </div>

            <div className="flex-1">
              <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>

              <p className="text-sm text-[var(--text-muted)] mt-1">
                {status === 'PENDING'
                  ? 'Your KYC is under review. Wallet activates automatically.'
                  : status === 'REJECTED'
                  ? 'Your KYC was rejected. Please resubmit correctly.'
                  : 'Complete KYC to activate your wallet.'}
              </p>

              {status !== 'PENDING' && (
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-yellow-400 hover:gap-2 transition-all"
                >
                  {status === 'REJECTED' ? 'Resubmit KYC' : 'Submit KYC'}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── FULL PAGE VERSION ───────── */
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">

      {/* 🔥 HERO */}
      <div className="group p-[1px] rounded-3xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:scale-[1.01] transition">

        <div className="rounded-3xl p-8 bg-black/70 backdrop-blur-xl text-center relative overflow-hidden">

          {/* glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-yellow-400/10 via-transparent to-yellow-400/10" />

          <div className="relative">

            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-yellow-400/20 mb-6">
              <Wallet className="w-10 h-10 text-yellow-300" />
            </div>

            <h2 className="text-2xl font-bold text-yellow-300 mb-2">
              Wallet Locked 🔒
            </h2>

            <p className="text-sm text-yellow-200/80 max-w-sm mx-auto">
              Complete KYC to unlock your wallet and start seamless transactions.
            </p>

            <div className={`inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full border text-sm ${cfg.bg} ${cfg.color}`}>
              <StatusIcon className="w-4 h-4" />
              {cfg.label}
            </div>
          </div>
        </div>
      </div>

      {/* ⚡ STEPS */}
      <div className="space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="group p-[1px] rounded-2xl bg-gradient-to-r from-yellow-400/30 to-transparent hover:scale-[1.01] transition"
            >
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex gap-4 items-start">

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${step.done
                    ? 'bg-emerald-500 text-white'
                    : step.active
                      ? 'bg-yellow-400 text-black'
                      : 'bg-[var(--primary-light)] text-[var(--text-muted)]'
                  }`}
                >
                  {step.done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <p className={`font-semibold text-sm
                    ${step.active ? 'text-yellow-400' :
                      step.done ? 'text-emerald-400' :
                        'text-[var(--text-muted)]'}`}
                  >
                    {step.title}
                  </p>

                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {step.desc}
                  </p>
                </div>

                {step.active && (
                  <Sparkles className="w-4 h-4 text-yellow-400 opacity-70" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚀 ACTION */}
      {status !== 'PENDING' && (
        <div className="group p-[1px] rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-[1.02] transition">

          <div className="p-6 rounded-2xl bg-black/70 backdrop-blur-xl flex justify-between items-center flex-wrap gap-4">

            <div>
              <p className="font-bold text-yellow-300">
                {status === 'REJECTED' ? 'Fix & Resubmit KYC' : 'Activate Your Wallet'}
              </p>
              <p className="text-xs text-yellow-200/70 mt-1">
                Takes less than 2 minutes.
              </p>
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold
                hover:scale-[1.05] hover:shadow-lg hover:shadow-yellow-400/30 transition"
            >
              <Shield className="w-4 h-4" />
              {status === 'REJECTED' ? 'Resubmit' : 'Start KYC'}
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>
        </div>
      )}

      {/* ⏳ PENDING */}
      {status === 'PENDING' && (
        <div className="text-center p-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/10">
          <Clock className="w-10 h-10 mx-auto text-yellow-400 mb-3 animate-pulse" />
          <p className="font-bold text-yellow-300">Verification in progress</p>
          <p className="text-xs text-yellow-200/70 mt-1">
            This usually takes 24–48 hours
          </p>
        </div>
      )}

    </div>
  );
}