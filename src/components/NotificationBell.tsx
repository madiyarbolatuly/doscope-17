
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

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
];

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const handleViewAllNotifications = () => {
    navigate('/notifications');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="font-semibold">Уведомления</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Отметить все как прочитанные
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {notifications.slice(0, 5).map(notification => (
          <DropdownMenuItem
            key={notification.id}
            className={`px-4 py-3 cursor-pointer ${!notification.read ? 'bg-accent' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{notification.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-4 py-2 cursor-pointer" onClick={handleViewAllNotifications}>
          <span className="mx-auto font-medium">Просмотреть все уведомления</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
