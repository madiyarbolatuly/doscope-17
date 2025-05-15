import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Check } from 'lucide-react';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Mock notifications just for display
  const notifications = [
    {
      id: '1',
      title: 'Document shared with you',
      description: 'Alex Johnson shared "Annual Report 2023.pdf" with you',
      date: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'Comment on your document',
      description: 'Sarah Miller commented on "Project Proposal.doc"',
      date: new Date(Date.now() - 86400000).toISOString(),
      read: true
    },
    {
      id: '3',
      title: 'Document approved',
      description: 'Your document "Financial Analysis.xlsx" was approved by David Chen',
      date: new Date(Date.now() - 172800000).toISOString(),
      read: false
    }
  ];
  
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Уведомления</h1>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Check size={16} />
          <span>Отметить все как прочитанные</span>
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="unread">Непрочитанные</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <div className="space-y-1">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-md border ${notification.read ? 'bg-background' : 'bg-accent'}`}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.description}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          <div className="space-y-1">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-md border ${notification.read ? 'bg-background' : 'bg-accent'}`}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.description}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;
