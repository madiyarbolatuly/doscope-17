
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_PERMISSIONS, Permission, DEFAULT_PERMISSIONS } from '@/types/user';

export const usePermissions = () => {
  const { user } = useAuth();

  const userPermissions = useMemo(() => {
    if (!user) return [];
    
    const roleConfig = ROLE_PERMISSIONS.find(rp => rp.role === user.role);
    if (!roleConfig) return [];
    
    return roleConfig.permissions;
  }, [user]);

  const userPageAccess = useMemo(() => {
    if (!user) return [];
    
    const roleConfig = ROLE_PERMISSIONS.find(rp => rp.role === user.role);
    if (!roleConfig) return [];
    
    return roleConfig.pageAccess;
  }, [user]);

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    return userPermissions.includes(permissionId);
  };

  const hasPageAccess = (pagePath: string): boolean => {
    if (!user) return false;
    
    // Admin has access to all pages
    if (user.role === 'admin') return true;
    
    return userPageAccess.includes(pagePath);
  };

  const getPermissionsByCategory = (category: string): Permission[] => {
    return DEFAULT_PERMISSIONS.filter(p => 
      p.category === category && hasPermission(p.id)
    );
  };

  return {
    hasPermission,
    hasPageAccess,
    userPermissions,
    userPageAccess,
    getPermissionsByCategory,
    allPermissions: DEFAULT_PERMISSIONS
  };
};
