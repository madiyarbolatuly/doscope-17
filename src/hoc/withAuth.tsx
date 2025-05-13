
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WithAuth: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login with return path
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Component {...props} />;
  };

  return WithAuth;
};
