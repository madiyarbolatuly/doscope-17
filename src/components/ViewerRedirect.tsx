import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ViewerRedirect() {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (!isLoading && user?.role === 'viewer' && pathname !== '/shared') {
    return <Navigate to="/shared" replace />;
  }
  return <Outlet />;
}
