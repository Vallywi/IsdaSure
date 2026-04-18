import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { walletConnected, isAuthenticated, userRole } = useWallet();
  const location = useLocation();

  if (!walletConnected) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/roles" replace state={{ from: location }} />;
  }

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
}