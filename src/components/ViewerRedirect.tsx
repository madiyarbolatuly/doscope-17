// ViewerRedirect.tsx
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ViewerRedirect() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (!loading && user?.role === 'viewer' && pathname !== '/shared') {
    return <Navigate to="/shared" replace />;
  }
  return <Outlet />;
}
