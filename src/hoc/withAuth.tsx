
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WithAuth: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <Component {...props} />;
  };

  return WithAuth;
};
