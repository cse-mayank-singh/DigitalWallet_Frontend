import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Wallet, Star, Mail, Phone, Globe, Send, Shield, Gift,
  TrendingUp, ArrowRight, Zap, Lock, CheckCircle, Users,
  BarChart3, CreditCard, Bell, ChevronRight, Award
} from 'lucide-react';
import { useTheme } from '../../store/ThemeContext';

function LandingNavbar() {
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-[var(--bg)]/90 backdrop-blur-xl shadow-sm border-b border-[var(--border)]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-md shadow-blue-500/30">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DigiWallet</span>
        </div>

        

        <div className="flex items-center gap-3">
          <button onClick={toggle} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--primary-light)] transition-colors">
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link to="/login" className="btn-ghost text-sm px-4 py-2">Login</Link>
          <Link to="/signup" className="btn-primary text-sm px-5 py-2">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-28 pb-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 0%, var(--bg) 80%)',
          }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[var(--primary-light)] border border-[var(--border)] rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--primary)]">
            <Zap className="w-3 h-3" />
            India's fastest growing digital wallet
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        <h1 className="text-center text-5xl sm:text-7xl font-bold mb-6 leading-[1.05] tracking-tight">
         Switch to Cashless Mode,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-pink-500">
          with a Stress-Free Node.
          </span>
        </h1>

        <p className="text-center text-lg text-[var(--text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
          Send, receive, and grow your money with DigiWallet. Zero fees, instant transfers, and rewards on every transaction.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link to="/signup" className="btn-primary px-8 py-3.5 text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
            Open Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-secondary px-8 py-3.5 text-base">
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-8 sm:gap-16 flex-wrap">
          {[
            { icon: Users, value: '2M+', label: 'Active Users' },
            { icon: TrendingUp, value: '₹500Cr+', label: 'Processed' },
            { icon: Shield, value: '99.9%', label: 'Uptime' },
            { icon: Star, value: '4.9★', label: 'App Rating' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-2xl font-bold">{value}</span>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Instant Transfers',
      desc: 'Send money to anyone in India instantly. No delays, no queues — just fast, reliable transfers 24/7.',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      desc: 'Your money is protected by 256-bit encryption, 2FA, and full KYC verification.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Gift,
      title: 'Smart Rewards',
      desc: 'Earn cashback points on every transaction. Redeem for vouchers, discounts, or wallet cash.',
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
    },
    {
      icon: BarChart3,
      title: 'Spending Insights',
      desc: 'Visualize where your money goes with smart analytics and monthly spending reports.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: CreditCard,
      title: 'Add Money Easily',
      desc: 'Top up via UPI, debit/credit cards, or net banking. Multiple payment methods supported.',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Bell,
      title: 'Real-Time Alerts',
      desc: 'Instant notifications for every debit, credit, and reward — never miss a transaction.',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <section className="py-24 bg-[var(--bg-card)] border-y border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest text-[var(--primary)] uppercase mb-3 block">Everything you need</span>
          <h2 className="text-4xl font-bold mb-4">Built for modern payments</h2>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto">All the tools you need to send, receive, and manage money — in one beautifully simple app.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up in under 2 minutes with your email and phone.' },
    { num: '02', title: 'Complete KYC', desc: 'Submit your Aadhaar or PAN to unlock full wallet features.' },
    { num: '03', title: 'Add Money', desc: 'Top up via UPI, cards, or net banking instantly.' },
    { num: '04', title: 'Start Transacting', desc: 'Send, receive, and earn rewards on every transaction.' },
  ];

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest text-[var(--primary)] uppercase mb-3 block">Get started in minutes</span>
          <h2 className="text-4xl font-bold mb-4">How it works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px border-t border-dashed border-[var(--border)] z-0" style={{ width: 'calc(100% - 24px)', left: '60%' }} />
              )}
              <div className="relative z-10">
                <div className="text-5xl font-black text-[var(--primary)]/15 mb-2">{s.num}</div>
                <h3 className="font-bold mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Security badges */}
        <div className="mt-16 p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg">Your security is our priority</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: '256-bit SSL Encryption', color: 'text-emerald-500' },
              { icon: Lock, label: '2-Factor Authentication', color: 'text-blue-500' },
              { icon: CheckCircle, label: 'RBI Compliant', color: 'text-purple-500' },
              { icon: Award, label: 'ISO 27001 Certified', color: 'text-orange-500' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <span className="text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: 'Arjun Sharma', role: 'Freelancer', text: 'DigiWallet completely changed how I handle payments. Transfers are instant and the cashback is a nice bonus!', rating: 5 },
    { name: 'Priya Mehta', role: 'Student', text: 'Super clean interface. Sending money to my family is so easy now. The OTP login is very convenient.', rating: 5 },
    { name: 'Rohit Verma', role: 'Entrepreneur', text: 'Finally a wallet that actually feels reliable and secure. KYC was painless and support is responsive.', rating: 5 },
    { name: 'Neha Kapoor', role: 'Teacher', text: 'The rewards program is genuinely good. I\'ve redeemed cashback multiple times. Love this app!', rating: 5 },
    { name: 'Karan Malhotra', role: 'Developer', text: 'Transparent fees, fast UPI, real-time notifications. This is what digital wallets should be.', rating: 5 },
    { name: 'Sneha Iyer', role: 'Designer', text: 'Beautiful UI, smooth experience. I\'ve recommended DigiWallet to my entire team.', rating: 5 },
  ];

  return (
    <section className="py-20 bg-[var(--bg-card)] border-y border-[var(--border)] relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-[var(--bg-card)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[var(--bg-card)] to-transparent z-10 pointer-events-none" />

      <div className="text-center mb-12 px-6">
        <span className="text-xs font-semibold tracking-widest text-[var(--primary)] uppercase mb-3 block">Loved by users</span>
        <h2 className="text-4xl font-bold">What our users say</h2>
      </div>

      <div className="flex gap-5 animate-scroll-fast px-6">
        {[...testimonials, ...testimonials].map((t, i) => (
          <div key={i} className="min-w-[300px] bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex gap-1">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed flex-1">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {t.name[0]}
              </div>
              <div>
                <div className="text-sm font-bold">{t.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function Footer() {
  const links = {
    Product: ['Features', 'Security', 'Pricing', 'Changelog'],
    Company: ['About', 'Careers', 'Blog', 'Press'],
    Resources: ['Help Center', 'Contact', 'Privacy Policy', 'Terms'],
  };

  return (
    <footer className="bg-[var(--bg-card)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">DigiWallet</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs leading-relaxed">
              A modern digital wallet built for fast, secure and seamless transactions across India.
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@digiwallet.in</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> 1800-123-4567</div>
              <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> India</div>
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4 text-sm">{title}</h4>
              <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-[var(--text)] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] pt-6 text-xs text-[var(--text-muted)] flex flex-col sm:flex-row justify-between gap-3">
          <span>© {new Date().getFullYear()} DigiWallet. All rights reserved.</span>
          <div className="flex gap-4">
            <span>RBI Registered</span>
            <span>·</span>
            <span>PCI-DSS Compliant</span>
            <span>·</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <TrustSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
