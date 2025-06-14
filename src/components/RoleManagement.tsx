
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { UserRole, ROLE_PERMISSIONS } from '@/types/user';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Crown, Shield, User, Eye } from 'lucide-react';

export const RoleManagement: React.FC = () => {
  const { user, updateUserRole } = useAuth();
  const { userPermissions, userPageAccess } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'user');

  const roleIcons = {
    admin: <Crown className="h-4 w-4" />,
    manager: <Shield className="h-4 w-4" />,
    user: <User className="h-4 w-4" />,
    viewer: <Eye className="h-4 w-4" />,
    custom: <User className="h-4 w-4" />
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    user: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
    custom: 'bg-purple-100 text-purple-800'
  };

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    updateUserRole(newRole);
  };

  const getRoleConfig = (role: UserRole) => {
    return ROLE_PERMISSIONS.find(rp => rp.role === role);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user && roleIcons[user.role]}
            Управление ролями пользователя
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Текущая роль:</label>
              <div className="mt-1">
                <Badge className={roleColors[user?.role || 'user']}>
                  {user?.role?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Изменить роль:</label>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="viewer">Просмотр</SelectItem>
                  <SelectItem value="custom">Настраиваемая</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Доступные страницы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {userPageAccess.map((page) => (
              <Badge key={page} variant="outline" className="justify-center">
                {page === '/' ? 'Главная' : page.replace('/', '')}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Права доступа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {userPermissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="justify-start">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
