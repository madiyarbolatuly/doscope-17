
import React from 'react';
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

    // No longer redirecting to login if not authenticated
    // Just render the component regardless of authentication status
    return <Component {...props} />;
  };

  return WithAuth;
};
