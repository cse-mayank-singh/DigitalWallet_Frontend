import { useState, InputHTMLAttributes } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm, FieldError } from 'react-hook-form';
import {
  Wallet, Eye, EyeOff, ArrowRight, Mail, Phone, Lock, User,
  Shield, CheckCircle, Zap, Gift, KeyRound, ChevronLeft, Fingerprint, Star
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { authApi } from '../../core/api/services';
import { toast } from '../../shared/components/Toast';
import { Spinner } from '../../shared/components/UI';
import { useTheme } from '../../store/ThemeContext';

// ─── Auth Shell ───────────────────────────────────────────────────────────────
function AuthShell({ children, title, subtitle }: {
  children: React.ReactNode; title: string; subtitle: string;
}) {
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg)] relative flex items-center justify-center overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-10%] top-0 w-[40%] h-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-0 w-[40%] h-full bg-pink-500/20 blur-[120px]" />
      </div>

      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">DigiWallet</span>
        </div>

        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--primary-light)] transition-colors text-lg"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="relative w-full max-w-[420px] z-10">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-[var(--border)] shadow-2xl rounded-3xl p-8">

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--text)]">{title}</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Input Group ──────────────────────────────────────────────────────────────
interface InputGroupProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
  error?: FieldError | { message?: string };
  rightElement?: React.ReactNode;
}

function InputGroup({ label, icon: Icon, error, rightElement, ...props }: InputGroupProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />}
        <input
          className={`input-field ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-12' : ''} ${error ? 'border-red-500 focus:ring-red-500/50' : ''}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5">{error.message}</p>}
    </div>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Symbol', ok: /[@$!%*?&]/.test(password) },
    { label: '8+ chars', ok: password.length >= 8 },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-[var(--border)]'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map((c) => (
            <div key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
              <CheckCircle className={`w-3 h-3 ${c.ok ? '' : 'opacity-30'}`} />
              {c.label}
            </div>
          ))}
        </div>
        <span className={`text-xs font-bold ${colors[score - 1]?.replace('bg-', 'text-') || 'text-[var(--text-muted)]'}`}>
          {score > 0 ? labels[score - 1] : ''}
        </span>
      </div>
    </div>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/, '');
            const arr = value.split('');
            arr[i] = char;
            onChange(arr.join('').slice(0, 6));
            if (char && e.target.nextElementSibling) {
              (e.target.nextElementSibling as HTMLInputElement).focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i] && e.currentTarget.previousElementSibling) {
              (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
            }
          }}
          className="w-12 h-14 text-center text-xl font-bold bg-[var(--bg)] border-2 border-[var(--border)] rounded-2xl focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--primary-light)] transition-all"
        />
      ))}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
interface LoginFormData {
  email: string;
  phone: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = new URLSearchParams(location.search).get('reason') === 'session_expired';
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<'email' | 'phone' | 'otp'>('email');

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      let res;
      if (mode === 'email') {
        res = await authApi.login({ email: data.email, password: data.password });
      } else {
        res = await authApi.loginPhone({ phone: data.phone, password: data.password });
      }
      const { accessToken, refreshToken, user } = res.data;
      login(user, { accessToken, refreshToken });
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail) return toast.error('Enter your email address');
    setOtpLoading(true);
    try {
      await authApi.sendOtp({ email: otpEmail });
      toast.success('OTP sent to your email');
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return toast.error('Enter the complete 6-digit OTP');
    setOtpLoading(true);
    try {
      const res = await authApi.verifyOtp({ email: otpEmail, otp });
      const { accessToken, refreshToken, user } = res.data;
      login(user, { accessToken, refreshToken });
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally { setOtpLoading(false); }
  };

  const modeOptions = [
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'phone', label: 'Phone', icon: Phone },
    { key: 'otp', label: 'OTP', icon: Fingerprint },
  ];

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your DigiWallet account">
      {/* Session expiry banner */}
      {sessionExpired && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 text-sm">
          <span className="text-lg leading-none">⏱</span>
          <div>
            <p className="font-semibold">Invalid Email or Password</p>
            <p className="text-xs mt-0.5 opacity-80">Please sign in again to continue.</p>
          </div>
        </div>
      )}
      {/* Mode switcher */}
      <div className="flex p-1 bg-[var(--bg)] border border-[var(--border)] rounded-2xl mb-6">
        {modeOptions.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key as any); setOtpSent(false); setOtp(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${mode === key ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Email or Phone login */}
      {(mode === 'email' || mode === 'phone') && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {mode === 'email' ? (
            <InputGroup label="Email address" icon={Mail} type="email" placeholder="you@example.com"
              error={errors.email}
              {...register('email', { required: 'Email is required' })} />
          ) : (
            <InputGroup label="Phone number" icon={Phone} type="tel" placeholder="10-digit mobile number"
              error={errors.phone}
              {...register('phone', {
                required: 'Phone is required',
                pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
              })} />
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-[var(--primary)] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <InputGroup
              label=""
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.password}
              rightElement={
                <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-0.5"
                  onClick={() => setShowPw((v) => !v)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password', { required: 'Password is required' })}
            />
          </div>

          <button type="submit"
            className="btn-primary w-full py-3.5 text-base shadow-lg shadow-blue-500/20"
            disabled={loading}>
            {loading ? <Spinner size="sm" /> : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      )}

      {/* OTP Login */}
      {mode === 'otp' && (
        <div className="space-y-5">
          {!otpSent ? (
            <>
              <div className="p-4 rounded-2xl bg-[var(--primary-light)] border border-[var(--border)] flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[var(--primary)]">Passwordless Sign-in</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">We'll send a one-time code to your registered email.</p>
                </div>
              </div>
              <InputGroup label="Registered Email" icon={Mail} type="email" placeholder="you@example.com"
                value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} />
              <button className="btn-primary w-full py-3.5" onClick={handleSendOtp} disabled={otpLoading || !otpEmail}>
                {otpLoading ? <Spinner size="sm" /> : <><Mail className="w-4 h-4" /> Send OTP</>}
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <p className="text-sm font-semibold">OTP sent to</p>
                <p className="text-[var(--text-muted)] text-sm mt-1">{otpEmail}</p>
              </div>
              <OtpInput value={otp} onChange={setOtp} />
              <button className="btn-primary w-full py-3.5" onClick={handleVerifyOtp}
                disabled={otpLoading || otp.length < 6}>
                {otpLoading ? <Spinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Verify & Sign In</>}
              </button>
              <button className="btn-ghost w-full text-sm text-center" onClick={() => { setOtpSent(false); setOtp(''); }}>
                ← Change email
              </button>
            </>
          )}
        </div>
      )}

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--bg)] px-4 text-xs text-[var(--text-muted)]">Don't have an account?</span>
        </div>
      </div>

      <Link to="/signup" className="btn-secondary w-full text-center flex items-center justify-center gap-2 py-3">
        Create free account <ArrowRight className="w-4 h-4" />
      </Link>

      <p className="text-center text-xs text-[var(--text-muted)] mt-6">
        By signing in you agree to our{' '}
        <a href="#" className="text-[var(--primary)] hover:underline">Terms</a>{' '}and{' '}
        <a href="#" className="text-[var(--primary)] hover:underline">Privacy Policy</a>
      </p>
    </AuthShell>
  );
}

// ─── Signup Page ──────────────────────────────────────────────────────────────
interface SignupFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>();
  const passwordValue = watch('password', '');

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    try {
      await authApi.signup(data);
      toast.success('Account created! Please sign in to continue.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Join 2 million users on DigiWallet">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputGroup
            label="Full name"
            icon={User}
            placeholder="John Doe"
            error={errors.fullName}
            {...register('fullName', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Min 2 characters' },
              pattern: {
                value: /^[A-Za-z\s]+$/,
                message: 'Only letters are allowed (no numbers or symbols)'
              }
            })}
        />
        <div className="grid grid-cols-2 gap-3">
          <InputGroup label="Email" icon={Mail} type="email" placeholder="you@example.com"
            error={errors.email}
            {...register('email', { required: 'Email is required' })} />
          <InputGroup
  label="Phone"
  icon={Phone}
  type="tel"
  placeholder="10 digits"
  maxLength={10}
  onInput={(e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
  }}
  error={errors.phone}
  {...register('phone', {
    required: 'Phone is required',
    pattern: {
      value: /^[0-9]{10}$/,
      message: 'Phone must be exactly 10 digits'
    }
  })}
/>
        </div>

        <div>
          <InputGroup
            label="Password"
            icon={Lock}
            type={showPw ? 'text' : 'password'}
            placeholder="Min 8 chars — uppercase, number, symbol"
            error={errors.password}
            rightElement={
              <button type="button"
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-0.5"
                onClick={() => setShowPw((v) => !v)}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password', {
              required: 'Password is required',
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                message: 'Must contain uppercase, number & symbol'
              },
              minLength: { value: 8, message: 'Min 8 characters' }
            })}
          />
          <PasswordStrength password={passwordValue} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { icon: Shield, text: 'Bank-grade security' },
            { icon: Zap, text: 'Instant setup' },
            { icon: Gift, text: 'Free rewards' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
              <Icon className="w-3 h-3" />
              {text}
            </div>
          ))}
        </div>

        <button type="submit"
          className="btn-primary w-full py-3.5 text-base shadow-lg shadow-blue-500/20"
          disabled={loading}>
          {loading ? <Spinner size="sm" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--bg)] px-4 text-xs text-[var(--text-muted)]">Already have an account?</span>
        </div>
      </div>

      <Link to="/login" className="btn-secondary w-full text-center flex items-center justify-center gap-2 py-3">
        Sign in instead <ArrowRight className="w-4 h-4" />
      </Link>

      <p className="text-center text-xs text-[var(--text-muted)] mt-6">
        By creating an account you agree to our{' '}
        <a href="#" className="text-[var(--primary)] hover:underline">Terms</a> and{' '}
        <a href="#" className="text-[var(--primary)] hover:underline">Privacy Policy</a>
      </p>
    </AuthShell>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotSendOtp({ email });
      toast.info('OTP sent to your email');
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await authApi.forgotVerifyOtp({ email, otp });
      setResetToken(res.data.resetToken);
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const resetPw = async () => {
    setLoading(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword: password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  const steps = [
    { num: 1, label: 'Email', icon: Mail },
    { num: 2, label: 'Verify OTP', icon: KeyRound },
    { num: 3, label: 'New Password', icon: Lock },
  ];

  return (
    <AuthShell title="Reset password" subtitle="We'll get you back in securely">
      {/* Step tracker */}
      <div className="flex items-start mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                ${step > s.num ? 'bg-emerald-500 text-white' : step === s.num ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]'}`}>
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${step === s.num ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mx-2 mt-[-14px] transition-colors ${step > s.num ? 'bg-emerald-500' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {step === 1 && (
          <>
            <InputGroup label="Email address" icon={Mail} type="email" placeholder="your@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn-primary w-full py-3.5" onClick={sendOtp} disabled={loading || !email}>
              {loading ? <Spinner size="sm" /> : <><Mail className="w-4 h-4" /> Send Reset OTP</>}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="p-3 bg-[var(--primary-light)] border border-[var(--border)] rounded-xl text-sm">
              Code sent to <span className="font-semibold text-[var(--text)]">{email}</span>
            </div>
            <div>
              <label className="label text-center block mb-4">Enter 6-digit OTP</label>
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            <button className="btn-primary w-full py-3.5" onClick={verifyOtp}
              disabled={loading || otp.length < 6}>
              {loading ? <Spinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Verify OTP</>}
            </button>
            <button className="btn-ghost w-full text-sm text-center" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 inline" /> Change email
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm text-[var(--text-muted)]">OTP verified! Set your new password.</p>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  className="input-field pl-10 pr-12"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Strong new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] p-0.5"
                  onClick={() => setShowPw((v) => !v)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <button className="btn-primary w-full py-3.5" onClick={resetPw}
              disabled={loading || !password}>
              {loading ? <Spinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Reset Password</>}
            </button>
          </>
        )}

        <Link to="/login" className="btn-ghost w-full text-center text-sm flex items-center justify-center gap-1 py-2">
          <ChevronLeft className="w-4 h-4" /> Back to login
        </Link>
      </div>
    </AuthShell>
  );
}