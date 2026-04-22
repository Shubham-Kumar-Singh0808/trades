import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import api from './api/client';
import ProtectedRoute from './components/ProtectedRoute';
import ShellLayout from './components/ShellLayout';
import SplashScreen from './components/SplashScreen';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TradeDetailsPage from './pages/TradeDetailsPage';
import TradesPage from './pages/TradesPage';
import UsersPage from './pages/UsersPage';
import VendorRegistrationPage from './pages/VendorRegistrationPage';
import VendorSetupPasswordPage from './pages/VendorSetupPasswordPage';
import VendorsPage from './pages/VendorsPage';
import PendingRegistrationsPage from './pages/PendingRegistrationsPage';
import ProfileChangesPage from './pages/ProfileChangesPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const location = useLocation();

  const skipBootstrapRoutes = [
    '/setup-password',
    '/vendor/setup-password',
    '/vendor/register',
    '/forgot-password',
    '/reset-password',
  ];

  const bootstrap = async () => {
    try {
      const res = await api.get('/api/auth/me', { suppressErrorToast: true });
      setSession(res.data);
      setIsAuthenticated(true);
    } catch {
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    if (skipBootstrapRoutes.includes(location.pathname)) {
      setSession(null);
      setIsAuthenticated(false);
      setIsBootstrapping(false);
      return;
    }

    setIsBootstrapping(true);
    bootstrap();
  }, [location.pathname]);

  const logout = async () => {
    await api.post('/api/auth/logout');
    setSession(null);
    setIsAuthenticated(false);
  };

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/trades" replace />
          ) : (
            <LoginPage onLoginSuccess={bootstrap} />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/vendor/register"
        element={
          isAuthenticated ? (
            <Navigate to="/trades" replace />
          ) : (
            <VendorRegistrationPage />
          )
        }
      />
      <Route
        path="/setup-password"
        element={
          isAuthenticated ? (
            <Navigate to="/trades" replace />
          ) : (
            <VendorSetupPasswordPage />
          )
        }
      />
      <Route
        path="/vendor/setup-password"
        element={
          isAuthenticated ? (
            <Navigate to="/trades" replace />
          ) : (
            <VendorSetupPasswordPage />
          )
        }
      />
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} session={session}>
            <ShellLayout onLogout={logout} session={session}>
              <Outlet />
            </ShellLayout>
          </ProtectedRoute>
        }
      >
        <Route
          path="/users"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} session={session} allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/vendors" element={<VendorsPage session={session} />} />
        <Route path="/vendors/pending" element={<PendingRegistrationsPage session={session} />} />
        <Route path="/vendors/changes" element={<ProfileChangesPage session={session} />} />
        <Route path="/trades" element={<TradesPage session={session} />} />
        <Route path="/trades/:id" element={<TradeDetailsPage session={session} />} />
        <Route
          path="/profile"
          element={<ProfilePage session={session} onSessionRefresh={bootstrap} />}
        />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/trades' : '/login'} replace />} />
    </Routes>
  );
}
