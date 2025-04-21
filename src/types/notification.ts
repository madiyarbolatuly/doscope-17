
export type NotificationType = 'approval_request' | 'comment' | 'mention' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  documentId?: string;
  createdAt: string;
  read: boolean;
}
