
import { Notification } from '@/types/notification';

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
];

// Get all notifications
export const getNotifications = async (): Promise<Notification[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_NOTIFICATIONS];
};

// Mark notification as read
export const markAsRead = async (id: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real app, this would make an API call to update the notification status
  console.log(`Marking notification ${id} as read`);
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real app, this would make an API call to update all notifications
  console.log('Marking all notifications as read');
};

// Delete a notification
export const deleteNotification = async (id: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real app, this would make an API call to delete the notification
  console.log(`Deleting notification ${id}`);
};

// Clear all notifications
export const clearAllNotifications = async (): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real app, this would make an API call to clear all notifications
  console.log('Clearing all notifications');
};
