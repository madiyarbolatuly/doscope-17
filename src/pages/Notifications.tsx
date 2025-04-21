
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Search, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

type NotificationType = 'approval_request' | 'comment' | 'mention' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  documentId?: string;
  createdAt: string;
  read: boolean;
}

// Mock notifications data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'approval_request',
    title: 'Запрос на утверждение',
    description: 'Alex Johnson запросил утверждение "Annual Report 2023.pdf"',
    documentId: '1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'comment',
    title: 'Новый комментарий',
    description: 'Sarah Miller прокомментировал "Project Proposal.doc"',
    documentId: '2',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'mention',
    title: 'Вас упомянули',
    description: 'David Chen упомянул вас в "Financial Analysis.xlsx"',
    documentId: '3',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'Обновление системы',
    description: 'Система обнаружила проблемы с загрузкой документа "Marketing Presentation.ppt"',
    documentId: '4',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
  {
    id: '5',
    type: 'approval_request',
    title: 'Запрос на утверждение',
    description: 'Emily Wang запросил утверждение "Product Roadmap.pdf"',
    documentId: '5',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    read: false,
  },
  {
    id: '6',
    type: 'system',
    title: 'Обновление системы',
    description: 'Новая версия системы доступна',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    read: true,
  },
  {
    id: '7',
    type: 'comment',
    title: 'Новый комментарий',
    description: 'Michelle Lee прокомментировал "Design Assets"',
    documentId: '6',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    read: true,
  },
];

const getBadgeVariant = (type: NotificationType) => {
  switch (type) {
    case 'approval_request':
      return 'default';
    case 'comment':
      return 'secondary';
    case 'mention':
      return 'outline';
    case 'system':
      return 'destructive';
    default:
      return 'default';
  }
};

const getTypeLabel = (type: NotificationType) => {
  switch (type) {
    case 'approval_request':
      return 'Утверждение';
    case 'comment':
      return 'Комментарий';
    case 'mention':
      return 'Упоминание';
    case 'system':
      return 'Система';
    default:
      return type;
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'unread' && !notification.read) ||
                      (activeTab === 'read' && notification.read) ||
                      notification.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate to the relevant document if documentId exists
    if (notification.documentId) {
      navigate(`/document/${notification.documentId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Уведомления</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Отметить все как прочитанные
            </Button>
            <Button variant="outline" onClick={handleClearAll}>
              <Trash className="mr-2 h-4 w-4" />
              Очистить все
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск уведомлений..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="unread">
              Непрочитанные
              <Badge variant="secondary" className="ml-2">
                {notifications.filter(n => !n.read).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="read">Прочитанные</TabsTrigger>
            <TabsTrigger value="approval_request">Утверждения</TabsTrigger>
            <TabsTrigger value="comment">Комментарии</TabsTrigger>
            <TabsTrigger value="system">Система</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'all' ? 'Все уведомления' : 
                   activeTab === 'unread' ? 'Непрочитанные уведомления' : 
                   activeTab === 'read' ? 'Прочитанные уведомления' : 
                   `Уведомления типа "${getTypeLabel(activeTab as NotificationType)}"`}
                </CardTitle>
                <CardDescription>
                  {filteredNotifications.length} уведомлений
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b last:border-0 ${!notification.read ? 'bg-accent/50' : ''} cursor-pointer`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getBadgeVariant(notification.type)}>
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <h3 className="font-medium">{notification.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredNotifications.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Нет уведомлений
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
