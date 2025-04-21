
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  notifyOnApprovalRequests: boolean;
  notifyOnComments: boolean;
  notifyOnMentions: boolean;
  notifyOnSystemUpdates: boolean;
  emailNotifications: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  
  // User details state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification settings state
  const [settings, setSettings] = useState<UserSettings>({
    notifyOnApprovalRequests: true,
    notifyOnComments: true,
    notifyOnMentions: true,
    notifyOnSystemUpdates: false,
    emailNotifications: true,
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, call API to update user profile
    toast({
      title: "Профиль обновлен",
      description: "Ваш профиль был успешно обновлен",
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }
    
    // In a real application, call API to change password
    toast({
      title: "Пароль изменен",
      description: "Ваш пароль был успешно изменен",
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleToggleSetting = (key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveNotificationSettings = () => {
    // In a real application, call API to save notification settings
    toast({
      title: "Настройки сохранены",
      description: "Ваши настройки уведомлений были сохранены",
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Настройки</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Аккаунт</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Профиль</CardTitle>
                <CardDescription>Обновите информацию вашего профиля</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Сохранить изменения</Button>
                </CardFooter>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Изменить пароль</CardTitle>
                <CardDescription>Обновите пароль вашего аккаунта</CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Текущий пароль</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Новый пароль</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Изменить пароль</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Настройки уведомлений</CardTitle>
                <CardDescription>Настройте уведомления, которые вы хотите получать</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Уведомления о запросах на утверждение</Label>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления, когда ваше утверждение требуется для документа
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnApprovalRequests}
                    onCheckedChange={() => handleToggleSetting('notifyOnApprovalRequests')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Уведомления о комментариях</Label>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления о новых комментариях к вашим документам
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnComments}
                    onCheckedChange={() => handleToggleSetting('notifyOnComments')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Уведомления об упоминаниях</Label>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления, когда вас упоминают в комментариях
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnMentions}
                    onCheckedChange={() => handleToggleSetting('notifyOnMentions')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Системные уведомления</Label>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления о системных обновлениях и проблемах
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnSystemUpdates}
                    onCheckedChange={() => handleToggleSetting('notifyOnSystemUpdates')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email уведомления</Label>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления на email в дополнение к уведомлениям в приложении
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleToggleSetting('emailNotifications')}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotificationSettings}>Сохранить настройки</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
