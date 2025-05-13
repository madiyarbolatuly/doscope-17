
import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { UserButton } from './UserButton';
import { FileText } from 'lucide-react';

export const HeaderNav: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-muted bg-background">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <div className="text-lg font-semibold">DocFlow EDMS</div>
      </div>
      
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            Documents
          </Link>
          <Link to="/archived" className="text-sm font-medium hover:text-primary transition-colors">
            Archived
          </Link>
          <Link to="/trash" className="text-sm font-medium hover:text-primary transition-colors">
            Trash
          </Link>
          <Link to="/notifications" className="text-sm font-medium hover:text-primary transition-colors">
            Notifications
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <NotificationBell />
          <UserButton />
        </div>
      </div>
    </header>
  );
};
