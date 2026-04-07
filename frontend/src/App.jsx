import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import api from './api/client';
import ProtectedRoute from './components/ProtectedRoute';
import ShellLayout from './components/ShellLayout';
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const bootstrap = async () => {
    try {
      const res = await api.get('/api/auth/me');
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
    bootstrap();
  }, []);

  const logout = async () => {
    await api.post('/api/auth/logout');
    setSession(null);
    setIsAuthenticated(false);
  };

  if (isBootstrapping) {
    return null;
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
        path="/users"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} session={session} allowedRoles={['ADMIN']}>
            <ShellLayout onLogout={logout} session={session}>
              <UsersPage />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} session={session}>
            <ShellLayout onLogout={logout} session={session}>
              <VendorsPage />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trades"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} session={session}>
            <ShellLayout onLogout={logout} session={session}>
              <TradesPage />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trades/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} session={session}>
            <ShellLayout onLogout={logout} session={session}>
              <TradeDetailsPage />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} session={session}>
            <ShellLayout onLogout={logout} session={session}>
              <ProfilePage session={session} onSessionRefresh={bootstrap} />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/trades' : '/login'} replace />} />
    </Routes>
  );
}
