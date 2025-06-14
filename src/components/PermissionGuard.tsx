
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  pagePath?: string;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  pagePath,
  fallback
}) => {
  const { hasPermission, hasPageAccess } = usePermissions();
  const { user } = useAuth();

  // Check permission if provided
  if (permission && !hasPermission(permission)) {
    return fallback || (
      <Alert className="m-4">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          У вас нет прав доступа к этой функции. Требуется разрешение: {permission}
        </AlertDescription>
      </Alert>
    );
  }

  // Check page access if provided
  if (pagePath && !hasPageAccess(pagePath)) {
    return fallback || (
      <Alert className="m-4">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          У вас нет доступа к этой странице. Обратитесь к администратору для получения доступа.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};
