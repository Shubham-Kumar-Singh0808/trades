import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ isAuthenticated, session, allowedRoles, children }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length) {
    const roles = session?.roles || [];
    const hasRole = allowedRoles.some((role) => roles.includes(role));
    if (!hasRole) {
      return <Navigate to="/trades" replace />;
    }
  }

  return children;
}
