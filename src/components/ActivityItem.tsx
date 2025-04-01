import React from 'react';
import { Eye, FileEdit, MessageSquare, Upload, Download, Trash, RefreshCw, Share } from 'lucide-react';
import { format } from 'date-fns';

export interface Activity {
  id: string;
  user: string;
  action: 'viewed' | 'modified' | 'commented' | 'uploaded' | 'deleted' | 'restored' | 'downloaded' | 'shared';
  date: string;
  timestamp?: string; // Added to support both date and timestamp fields
}

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.action) {
      case 'viewed':
        return <Eye className="h-4 w-4" />;
      case 'modified':
        return <FileEdit className="h-4 w-4" />;
      case 'commented':
        return <MessageSquare className="h-4 w-4" />;
      case 'uploaded':
        return <Upload className="h-4 w-4" />;
      case 'downloaded':
        return <Download className="h-4 w-4" />;
      case 'deleted':
        return <Trash className="h-4 w-4" />;
      case 'restored':
        return <RefreshCw className="h-4 w-4" />;
      case 'shared':
        return <Share className="h-4 w-4" />;
      default:
        return <FileEdit className="h-4 w-4" />;
    }
  };

  const getActionText = () => {
    switch (activity.action) {
      case 'viewed':
        return 'viewed this document';
      case 'modified':
        return 'modified this document';
      case 'commented':
        return 'commented on this document';
      case 'uploaded':
        return 'uploaded this document';
      case 'deleted':
        return 'deleted this document';
      case 'restored':
        return 'restored this document';
      case 'downloaded':
        return 'downloaded this document';
      case 'shared':
        return 'shared this document';
      default:
        return 'interacted with this document';
    }
  };

  return (
    <div className="flex items-start gap-3 pb-3 border-b last:border-b-0">
      <div className="bg-primary/10 rounded-full p-2">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.user}</span> {getActionText()}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(activity.date || activity.timestamp || ''), 'MMM d, yyyy h:mm a')}
        </p>
      </div>
    </div>
  );
}
