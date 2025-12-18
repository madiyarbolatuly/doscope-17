import React, { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  ShieldCheck,
  Copy,
  RefreshCw,
  Loader2,
  Users,
  Mail,
  MoreHorizontal,
  Pencil,
  KeyRound,
  Trash2,
  ShieldOff,
  Shield
} from 'lucide-react';
import { api } from '@/services/apiclient';
import { ADMIN_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  tenant_id: number;
  department_id: number;
  created_at: string;
  is_active: boolean;
};

type AdminUserListResponse = {
  items: AdminUser[];
  total: number;
};

type CredentialsNotice = {
  username: string;
  email: string;
  password: string;
  message: string;
};

const roleLabels: Record<AdminUser['role'], string> = {
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Наблюдатель',
};

const roleBadges: Record<AdminUser['role'], string> = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-amber-100 text-amber-700',
  viewer: 'bg-blue-100 text-blue-700',
};


const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [credentialsNotice, setCredentialsNotice] = useState<CredentialsNotice | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    role: 'viewer' as AdminUser['role'],
    departmentId: '',
    isActive: true,
  });
  const [updating, setUpdating] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    role: 'viewer',
    departmentId: user?.departmentId?.toString() ?? '',
    password: '',
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<AdminUserListResponse>(ADMIN_ENDPOINTS.USERS, {
        params: {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          search: debouncedSearch || undefined,
        },
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Failed to load users', error);
      toast({
        title: 'Не удалось загрузить пользователей',
        description: error?.response?.data?.detail || 'Попробуйте обновить страницу позднее',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setForm({
      username: '',
      email: '',
      role: 'viewer',
      departmentId: user?.departmentId?.toString() ?? '',
      password: '',
    });
  };

  const handleCreateUser = async () => {
    if (!form.username || !form.email) {
      toast({ title: 'Заполните все обязательные поля', variant: 'destructive' });
      return;
    }
    const departmentIdNum = form.departmentId
      ? Number(form.departmentId)
      : user?.departmentId ?? null;
    if (!departmentIdNum || Number.isNaN(departmentIdNum) || departmentIdNum <= 0) {
      toast({ title: 'Укажите отдел сотрудника', description: 'Можно оставить пустым, чтобы использовать ваш отдел', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        department_id: departmentIdNum,
        password: form.password.trim() || undefined,
      };
      const { data } = await api.post(ADMIN_ENDPOINTS.USERS, payload);
      setCredentialsNotice({
        username: data.user.username,
        email: data.user.email,
        password: data.temporary_password,
        message: 'Новый пользователь создан',
      });
      toast({ title: 'Пользователь создан', description: 'Передайте временный пароль сотруднику' });
      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to create user', error);
      toast({
        title: 'Не удалось создать пользователя',
        description: error?.response?.data?.detail || 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Скопировано' });
    } catch (_) {
      toast({ title: 'Не удалось скопировать', variant: 'destructive' });
    }
  };

  const openEditDialog = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({
      role: user.role,
      departmentId: user.department_id.toString(),
      isActive: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;

    const changes: Record<string, unknown> = {};
    if (editForm.role !== editUser.role) {
      changes.role = editForm.role;
    }

    if (editForm.departmentId) {
      const departmentIdNum = Number(editForm.departmentId);
      if (Number.isNaN(departmentIdNum) || departmentIdNum <= 0) {
        toast({ title: 'Неверный номер отдела', variant: 'destructive' });
        return;
      }
      if (departmentIdNum !== editUser.department_id) {
        changes.department_id = departmentIdNum;
      }
    }

    if (editForm.isActive !== editUser.is_active) {
      changes.is_active = editForm.isActive;
    }

    if (Object.keys(changes).length === 0) {
      toast({ title: 'Нет изменений для сохранения' });
      return;
    }

    setUpdating(true);
    try {
      await api.patch(ADMIN_ENDPOINTS.USER(editUser.id), changes);
      toast({ title: 'Данные пользователя обновлены' });
      setIsEditDialogOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Не удалось сохранить изменения',
        description: error?.response?.data?.detail || 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    setTogglingUserId(user.id);
    try {
      await api.patch(ADMIN_ENDPOINTS.USER(user.id), { is_active: !user.is_active });
      toast({ title: user.is_active ? 'Пользователь заблокирован' : 'Пользователь активирован' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Не удалось обновить статус',
        description: error?.response?.data?.detail || 'Повторите попытку',
        variant: 'destructive',
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  const requestDeleteUser = (u: AdminUser) => {
    setDeleteConfirmUser(u);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    if (deleteConfirmUser.id === user?.id) {
      toast({ title: 'Нельзя удалить самого себя', variant: 'destructive' });
      return;
    }
    setDeletingUserId(deleteConfirmUser.id);
    try {
      await api.delete(ADMIN_ENDPOINTS.USER(deleteConfirmUser.id));
      toast({ title: 'Пользователь удалён', description: `${deleteConfirmUser.username} больше не активен` });
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Не удалось удалить пользователя',
        description: error?.response?.data?.detail || 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    setResettingUserId(user.id);
    try {
      const { data } = await api.post(ADMIN_ENDPOINTS.RESET_PASSWORD(user.id));
      setCredentialsNotice({
        username: data.user.username,
        email: data.user.email,
        password: data.temporary_password,
        message: 'Пароль пользователя обновлён',
      });
      toast({ title: 'Пароль сброшен', description: 'Передайте новый пароль сотруднику' });
    } catch (error: any) {
      toast({
        title: 'Не удалось сбросить пароль',
        description: error?.response?.data?.detail || 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    } finally {
      setResettingUserId(null);
    }
  };

  const closeEditDialog = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditUser(null);
    }
  };

  const emptyState = !isLoading && users.length === 0;

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Панель администратора</p>
              <h1 className="text-2xl font-bold text-gray-900">Управление доступом</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Создавайте новые учётные записи и управляйте правами сотрудников. Новому пользователю автоматически выдаётся временный пароль.
          </p>
        </div>

        {credentialsNotice && credentialsNotice.password && (
          <Alert className="bg-emerald-50 border-emerald-100">
            <AlertDescription className="flex flex-col gap-2">
              <div className="font-semibold text-emerald-900">{credentialsNotice.message}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span>{credentialsNotice.username}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(credentialsNotice.username)}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy username</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <span>{credentialsNotice.email}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(credentialsNotice.email)}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy email</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Пароль: {credentialsNotice.password}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(credentialsNotice.password)}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy password</span>
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Поиск по логину или email"
                className="w-72"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {total}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Новый пользователь
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать пользователя</DialogTitle>
                <DialogDescription>
                  Укажите данные сотрудника. Если пароль не задан, система сгенерирует его автоматически.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="username">Логин</Label>
                  <Input id="username" value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
                </div>
                <div className="grid gap-2">
                  <Label>Роль</Label>
                  <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as AdminUser['role'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="editor">Редактор</SelectItem>
                      <SelectItem value="viewer">Наблюдатель</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="departmentId">ID отдела</Label>
                  <Input
                    id="departmentId"
                    type="number"
                    min={1}
                    value={form.departmentId}
                    onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Если оставить пустым, будет использован отдел администратора</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Пароль (необязательно)</Label>
                  <Input
                    id="password"
                    type="text"
                    placeholder="Оставьте пустым для автоматического пароля"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={creating}>
                  Отмена
                </Button>
                <Button onClick={handleCreateUser} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Создать'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Логин</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Отдел</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Загрузка пользователей…
                  </TableCell>
                </TableRow>
              )}

              {emptyState && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Пользователи не найдены
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.username}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                    <Badge className={`${roleBadges[item.role]} font-medium`}>
                      {roleLabels[item.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}>
                      {item.is_active ? 'Активен' : 'Заблокирован'}
                    </Badge>
                  </TableCell>
                  <TableCell>#{item.department_id}</TableCell>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Редактировать</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(item)}
                          disabled={togglingUserId === item.id}
                        >
                          {item.is_active ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              <span>Заблокировать</span>
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Активировать</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(item)}
                          disabled={resettingUserId === item.id}
                        >
                          {resettingUserId === item.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="mr-2 h-4 w-4" />
                          )}
                          <span>Сбросить пароль</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => requestDeleteUser(item)}
                          className="text-red-600 focus:text-red-600"
                          disabled={item.id === user?.id || deletingUserId === item.id}
                        >
                          {deletingUserId === item.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          <span>Удалить</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Delete confirmation */}
        <Dialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить пользователя?</DialogTitle>
              <DialogDescription>
                Пользователь будет удалён из базы данных. Действие необратимо.
              </DialogDescription>
            </DialogHeader>

            {deleteConfirmUser && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Пользователь:</span>{" "}
                  <span className="font-medium">{deleteConfirmUser.username}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{deleteConfirmUser.email}</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmUser(null)}>
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={!deleteConfirmUser || deletingUserId === deleteConfirmUser.id}
              >
                {deleteConfirmUser && deletingUserId === deleteConfirmUser.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {total > pageSize && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
              Назад
            </Button>
            <span className="text-sm text-muted-foreground">
              Страница {page} из {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Вперёд
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              {editUser ? `Настройки учётной записи ${editUser.username}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Роль</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm((prev) => ({ ...prev, role: value as AdminUser['role'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="editor">Редактор</SelectItem>
                  <SelectItem value="viewer">Наблюдатель</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDepartmentId">ID отдела</Label>
              <Input
                id="editDepartmentId"
                type="number"
                min={1}
                value={editForm.departmentId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium">Статус</p>
                <p className="text-xs text-muted-foreground">Управление активностью аккаунта</p>
              </div>
              <Switch checked={editForm.isActive} onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, isActive: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeEditDialog(false)} disabled={updating}>
              Отмена
            </Button>
            <Button onClick={handleUpdateUser} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
