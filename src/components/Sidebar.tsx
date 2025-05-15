import React from 'react';
import { cn } from '@/lib/utils';
import {
  FileText, Clock, Users, Star, Trash2,
  Settings, PlusCircle,
  HardDrive, FolderOpen,
  Archive, Bell, Upload, Search
} from 'lucide-react';
import { CategoryType } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  activeCategory?: CategoryType;
  onCategoryChange?: (category: CategoryType) => void;
}

interface SidebarItem {
  id: CategoryType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  path?: string;
}

export function Sidebar({ activeCategory = 'all', onCategoryChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems: SidebarItem[] = [
    { id: 'all', label: 'Все документы', icon: <FileText size={18} />, path: '/'  },
    { id: 'recent', label: 'Недавние', icon: <Clock size={18} /> },
    { id: 'shared', label: 'Общие', icon: <Users size={18} /> },
    { id: 'favorites', label: 'Избранное', icon: <Star size={18} /> },
    { id: 'trash', label: 'Корзина', icon: <Trash2 size={18} />, path: '/trash' },
  ];

 /*  const categoryItems: SidebarItem[] = [
    { id: 'managers', label: 'Руководители', icon: <FolderOpen size={18} /> },
    { id: 'development', label: 'Отдел развития', icon: <FolderOpen size={18} /> },
    { id: 'procurement', label: 'Прокюрмент', icon: <FolderOpen size={18} /> },
    { id: 'electrical', label: 'Электрические сети', icon: <FolderOpen size={18} /> },
    { id: 'weakening', label: 'Слаботочные системы', icon: <FolderOpen size={18} /> },
    { id: 'interface', label: 'Отдел интерфейс', icon: <FolderOpen size={18} /> },
    { id: 'pse', label: 'PSE DCC', icon: <FolderOpen size={18} /> },
  ];
 */

  const toolItems: SidebarItem[] = [
    { id: 'upload' as CategoryType, label: 'Загрузить', icon: <Upload size={18}/>, path: '/fileupload' },
    { id: 'archive' as CategoryType, label: 'Архив', icon: <Archive size={18} />, path: '/archived' },
    { id: 'notifications' as CategoryType, label: 'Уведомления', icon: <Bell size={18} />, badge: '3', path: '/notifications' },
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (onCategoryChange) {
      onCategoryChange(item.id);
    }
  };

  const isActive = (item: SidebarItem) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return activeCategory === item.id;
  };

  return (
    <div className="w-64 flex-shrink-0 h-full bg-sidebar border-r border-sidebar-border hidden md:block">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <div className="text-lg font-semibold">DocFlow EDMS</div>
        </div>
        <button
          className="w-full flex items-center mt-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 rounded-md mb-6 transition-colors"
          onClick={() => navigate('/fileupload')}
        >
          <PlusCircle size={18} />
          <span>Новый документ</span>
        </button>

        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                isActive(item) ? "active bg-gray-100 dark:bg-gray-800" : ""
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
{/* 
        <div className="mt-8 mb-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
            Категории
          </h2>
          <nav className="space-y-1">
            {categoryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                  isActive(item) ? "active bg-gray-100 dark:bg-gray-800" : ""
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
 */}
        <div className="mt-8 mb-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
            Инструменты
          </h2>
          <nav className="space-y-1">
            {toolItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "sidebar-item w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
                  isActive(item) ? "active bg-gray-100 dark:bg-gray-800" : ""
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
          <span>Настройки</span>
        </button>
      </div>
    </div>
  );
}
