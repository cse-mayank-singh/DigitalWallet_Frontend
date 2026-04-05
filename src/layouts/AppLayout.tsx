import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Send, Gift, Receipt, User,
  Sun, Moon, Bell, LogOut, Menu, Shield, ChevronRight,
  X, Zap, TrendingUp
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { useNotifications } from '../store/NotificationContext';
import { authApi } from '../core/api/services';
import { toast } from '../shared/components/Toast';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

const userNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/transfer', icon: Send, label: 'Send Money' },
  { to: '/rewards', icon: Gift, label: 'Rewards' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/profile', icon: User, label: 'Profile & KYC' },
];

const adminNav: NavItem[] = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggle } = useTheme();
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (refreshToken) await authApi.logout({ refreshToken });
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const navLinks = [...userNav, ...(isAdmin ? adminNav : [])];

  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-md shadow-blue-500/30">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-none">DigiWallet</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Smart Wallet</div>
          </div>
        </div>
        <button className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-muted)]" onClick={() => setSidebarOpen(false)}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-2 mb-1">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Navigation</span>
        </div>
        {navLinks.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
                ? 'bg-[var(--primary)] text-white shadow-md shadow-blue-500/20'
                : 'text-[var(--text-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--primary-light)] text-[var(--primary)]'}`}>
                    {badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-60 text-white' : ''}`} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-[var(--border)] space-y-2">
        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm shadow-blue-500/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{user?.fullName}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">{user?.role}</div>
          </div>
        </div>
        {/* Logout */}
        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  // Page title based on route
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/wallet': 'Wallet',
    '/transfer': 'Send Money',
    '/rewards': 'Rewards',
    '/transactions': 'Transactions',
    '/profile': 'Profile & KYC',
    '/admin': 'Admin Panel',
  };
  const currentTitle = routeTitles[location.pathname] || 'DigiWallet';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 flex-col bg-[var(--bg-card)] border-r border-[var(--border)] shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--bg-card)] border-r border-[var(--border)] z-50 animate-slide-in shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center gap-3 px-4 shrink-0">
          {/* Mobile menu button */}
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <span className="font-bold text-sm hidden sm:block">{currentTitle}</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button className="btn-ghost p-2 rounded-xl" onClick={toggle} title="Toggle theme">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                className="btn-ghost p-2 rounded-xl relative"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <>
                    <span className="notif-dot" />
                    <span className="notif-dot-static" />
                  </>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="badge-red text-xs">{unreadCount}</span>
                      )}
                    </div>
                    <button className="text-xs text-[var(--primary)] hover:underline font-medium" onClick={markAllRead}>
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-30" />
                        <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3.5 cursor-pointer hover:bg-[var(--primary-light)] transition-colors ${!n.read ? 'bg-[var(--primary-light)]/50' : ''}`}
                          onClick={() => markRead(n.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs">{n.title}</div>
                              <div className="text-xs text-[var(--text-muted)] mt-0.5">{n.message}</div>
                              <div className="text-xs text-[var(--text-muted)] mt-1 opacity-70">{new Date(n.time).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <div className="ml-1 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-500/30 cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
