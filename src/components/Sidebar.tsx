import React from 'react';
import { cn } from '@/lib/utils';
import {
  FileText, Clock, Users, Star, Trash2,
  Settings, PlusCircle,
  HardDrive, FolderOpen,
  Archive, Bell, Upload, Search, ClipboardList, Send, AlertCircle
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
    { id: 'shared', label: 'Общие', icon: <Users size={18} /> , path: '/shared'},
    { id: 'favorites', label: 'Избранное', icon: <Star size={18} />, path: '/favorites' },
    { id: 'archive' as CategoryType, label: 'Архив', icon: <Archive size={18} />, path: '/archived' },
    { id: 'trash', label: 'Корзина', icon: <Trash2 size={18} />, path: '/trash' },
 
  ];


  const toolItems: SidebarItem[] = [
    { id: 'review', label: 'Ревью', icon: <ClipboardList size={18} />, path: '/review' },
    { id: 'transmittals', label: 'Трансмиталлы', icon: <Send size={18} />, path: '/transmittals' },
    { id: 'issues', label: 'Замечания', icon: <AlertCircle size={18} />, path: '/issues' },
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
  <div className="w-64 flex-shrink-0 h-full bg-gradient-to-b from-blue-50 via-white to-blue-100 border-r border-blue-200 hidden md:block shadow-lg">
    <div className="p-5">
      <div className="flex items-center gap-2">
        <img src="public/gq-contract.png" alt="GQ Contract" className="h-10 ml-2" />
      </div>

      <button
        className="w-full flex items-center mt-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg mb-6 shadow transition-colors duration-200"
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
              "sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
              isActive(item)
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 mb-2">
        <h2 className="text-xs uppercase tracking-wider text-blue-400 font-semibold px-3 mb-2">
          Инструменты
        </h2>
        <nav className="space-y-1">
          {toolItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "sidebar-item w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all",
                isActive(item)
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto bg-blue-200 text-blue-800">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
          
        </nav>
        
      </div>
      
    </div>
          <div className="absolute to-blue-100 bottom-0 w-64 p-4 border-t">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">
        <Settings size={18} />
        <span>Настройки</span>
      </button>
    </div>
    
  </div>
);
}