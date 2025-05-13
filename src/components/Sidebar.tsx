
import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText, Clock, Users, Star, Trash2, 
  Settings, PlusCircle, 
  HardDrive, Folder, FolderOpen,
  Archive, Bell, Upload, Search
} from 'lucide-react';
import { CategoryType } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

interface SidebarItem {
  id: CategoryType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  path?: string; // Add path for navigation
}

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const navigate = useNavigate();
  
  const mainNavItems: SidebarItem[] = [
    { id: 'all', label: 'All Documents', icon: <FileText size={18} /> },
    { id: 'recent', label: 'Recent', icon: <Clock size={18} /> },
    { id: 'shared', label: 'Shared', icon: <Users size={18} /> },
    { id: 'favorites', label: 'Favorites', icon: <Star size={18} /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 size={18} />, path: '/trash' },
  ];

  const categoryItems: SidebarItem[] = [
    { id: 'managers', label: 'Managers', icon: <FolderOpen size={18} /> },
    { id: 'development', label: 'Development', icon: <FolderOpen size={18} /> },
    { id: 'procurement', label: 'Procurement', icon: <FolderOpen size={18} /> },
    { id: 'electrical', label: 'Electrical Systems', icon: <FolderOpen size={18} /> },
    { id: 'weakening', label: 'Weakening Systems', icon: <FolderOpen size={18} /> },
    { id: 'interface', label: 'Interface Dept', icon: <FolderOpen size={18} /> },
    { id: 'pse', label: 'PSE DCC', icon: <FolderOpen size={18} /> },
  ];

  const toolItems: SidebarItem[] = [
    { id: 'upload' as CategoryType, label: 'Upload', icon: <Upload size={18} /> },
    { id: 'search' as CategoryType, label: 'Search', icon: <Search size={18} /> },
    { id: 'archive' as CategoryType, label: 'Archive', icon: <Archive size={18} /> },
    { id: 'notifications' as CategoryType, label: 'Notifications', icon: <Bell size={18} />, badge: '3' },
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.path) {
      navigate(item.path);
    } else {
      onCategoryChange(item.id);
    }
  };

  return (
    <div className="w-64 flex-shrink-0 h-screen bg-sidebar border-r border-sidebar-border hidden md:block">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-8">
          <HardDrive className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">DocFlow EDMS</h1>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>

        <button className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 rounded-md mb-6 transition-colors">
          <PlusCircle size={18} />
          <span>New Document</span>
        </button>

        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                activeCategory === item.id ? "active bg-gray-100 dark:bg-gray-800" : ""
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
                onClick={() => handleItemClick(item)}
                className={cn(
                  "sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                  activeCategory === item.id ? "active bg-gray-100 dark:bg-gray-800" : ""
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 mb-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
            Tools
          </h2>
          <nav className="space-y-1">
            {toolItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "sidebar-item w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
                  activeCategory === item.id ? "active bg-gray-100 dark:bg-gray-800" : ""
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
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
