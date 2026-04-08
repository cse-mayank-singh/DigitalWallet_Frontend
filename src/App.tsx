import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { NotificationProvider } from './store/NotificationContext';
import { ToastProvider } from './shared/components/Toast';
import AppLayout from './layouts/AppLayout';
import { ErrorBoundary, LoadingPage } from './shared/components/UI';

const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const WalletPage = lazy(() => import('./features/wallet/WalletPage'));
const TransferPage = lazy(() => import('./features/wallet/TransferPage'));
const RewardsPage = lazy(() => import('./features/rewards/RewardsPage'));
const TransactionsPage = lazy(() => import('./features/transactions/TransactionsPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const AdminPage = lazy(() => import('./features/admin/AdminPage'));

const LoginPage = lazy(() => import('./features/auth/AuthPages').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./features/auth/AuthPages').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <AppLayout><ErrorBoundary>{children}</ErrorBoundary></AppLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <ToastProvider />
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Wrap><DashboardPage /></Wrap>} />
                <Route path="/wallet" element={<Wrap><WalletPage /></Wrap>} />
                <Route path="/transfer" element={<Wrap><TransferPage /></Wrap>} />
                <Route path="/rewards" element={<Wrap><RewardsPage /></Wrap>} />
                <Route path="/transactions" element={<Wrap><TransactionsPage /></Wrap>} />
                <Route path="/profile" element={<Wrap><ProfilePage /></Wrap>} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Wrap><AdminPage /></Wrap>} />
              </Route>

              <Route
                path="*"
                element={(
                  <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                    <div className="text-center">
                      <div className="text-7xl font-bold text-[var(--primary)] mb-4">404</div>
                      <p className="font-semibold text-xl mb-2">Page not found</p>
                      <a href="/" className="btn-primary inline-flex mt-4">Go home</a>
                    </div>
                  </div>
                )}
              />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
