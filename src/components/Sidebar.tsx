
import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText, Clock, Users, Star, Trash2, 
  FolderOpen, Settings, PlusCircle, 
  HardDrive, FileArchive
} from 'lucide-react';
import { CategoryType } from '@/types/document';

interface SidebarProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

interface SidebarItem {
  id: CategoryType;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const mainNavItems: SidebarItem[] = [
    { id: 'all', label: 'All Documents', icon: <FileText size={18} /> },
    { id: 'recent', label: 'Recent', icon: <Clock size={18} /> },
    { id: 'shared', label: 'Shared with me', icon: <Users size={18} /> },
    { id: 'favorites', label: 'Favorites', icon: <Star size={18} /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 size={18} /> },
  ];

  const categoryItems: SidebarItem[] = [
    { id: 'contracts', label: 'Contracts', icon: <FileText size={18} /> },
    { id: 'invoices', label: 'Invoices', icon: <FileArchive size={18} /> },
    { id: 'reports', label: 'Reports', icon: <FolderOpen size={18} /> },
    { id: 'hr', label: 'HR Documents', icon: <FileText size={18} /> },
  ];

  return (
    <div className="w-64 flex-shrink-0 h-screen bg-sidebar border-r border-sidebar-border hidden md:block">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-8">
          <HardDrive className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">DocManager</h1>
        </div>

        <button className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 rounded-md mb-6 transition-colors">
          <PlusCircle size={18} />
          <span>New Document</span>
        </button>

        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onCategoryChange(item.id)}
              className={cn(
                "sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                activeCategory === item.id ? "active" : ""
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 mb-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
            Categories
          </h2>
          <nav className="space-y-1">
            {categoryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onCategoryChange(item.id)}
                className={cn(
                  "sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                  activeCategory === item.id ? "active" : ""
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="absolute bottom-0 w-64 p-4 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-sidebar-accent rounded-md transition-colors">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
