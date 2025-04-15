
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

export const ProtectedRoute = ({ children, requiredPermissions = [] }: ProtectedRouteProps) => {
  const { user, isLoadingUser, isAuthenticated } = useAuth();

  if (isLoadingUser) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredPermissions.length > 0 && 
      !requiredPermissions.every(permission => user?.permissions.includes(permission))) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
