import React from 'react';
import { cn } from '@/lib/utils';
import {
  FileText, Users, Star, Trash2, Settings, PlusCircle, Archive,
  ClipboardList, Send, AlertCircle, ShieldCheck
} from 'lucide-react';
import { CategoryType } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();

  const role = user?.role ?? 'viewer';

  // viewers see only Shared
  const visibleItems: SidebarItem[] =
    role === 'viewer'
      ? [{ id: 'shared', label: 'Общие', icon: <Users size={18} />, path: '/shared' }]
      : [
          { id: 'all', label: 'Все документы', icon: <FileText size={18} />, path: '/' },
          { id: 'shared', label: 'Общие', icon: <Users size={18} />, path: '/shared' },
          { id: 'favorites', label: 'Избранное', icon: <Star size={18} />, path: '/favorites' },
          { id: 'archive' as CategoryType, label: 'Архив', icon: <Archive size={18} />, path: '/archived' },
          { id: 'trash', label: 'Корзина', icon: <Trash2 size={18} />, path: '/trash' },
        ];

  const toolItems: SidebarItem[] = [
    { id: 'review', label: 'Ревью', icon: <ClipboardList size={18} />, path: '/review' },
    { id: 'transmittals', label: 'Трансмиталлы', icon: <Send size={18} />, path: '/transmittals' },
    { id: 'issues', label: 'Замечания', icon: <AlertCircle size={18} />, path: '/issues' },
  ];

  const visibleTools: SidebarItem[] = role === 'viewer' ? [] : toolItems;
  const adminItems: SidebarItem[] =
    role === 'admin'
      ? [{ id: 'usersmanagement' as CategoryType, label: 'Пользователи', icon: <ShieldCheck size={18} />, path: '/usersmanagement' }]
      : [];

  const handleItemClick = (item: SidebarItem) => {
    if (role === 'viewer' && item.id !== 'shared') {
      navigate('/shared', { replace: true });
      return;
    }
    if (item.path) navigate(item.path);
    else if (onCategoryChange) onCategoryChange(item.id);
  };

  const isActive = (item: SidebarItem) =>
    item.path ? location.pathname === item.path : activeCategory === item.id;

  // 👇 add top margin to the nav if viewer (since “New document” button is hidden)
  const navClass = cn('space-y-1', role === 'viewer' ? 'mt-6' : '');

  return (
    <div className="relative w-64 flex-shrink-0 h-full bg-gradient-to-b from-blue-50 via-white to-blue-100 border-r border-blue-200 hidden md:block shadow-lg">
      <div className="p-5">
        {/* 👇 add mb-4 (or mb-6) under the logo to prevent overlap */}
        <div className="flex items-center gap-2 mb-4">
          {/* also fix the public path */}
          <img src="/gq-contract.png" alt="GQ Contract" className="h-10 ml-2" />
        </div>

        {/* hide for viewer; otherwise keeps the natural spacing */}
        {role !== 'viewer' && (
          <button
            className="w-full flex items-center mt-2 gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg mb-6 shadow transition-colors duration-200"
            onClick={() => navigate('/fileupload')}
          >
            <PlusCircle size={18} />
            <span>Новый документ</span>
          </button>
        )}

        {/* 👇 use navClass instead of bare 'space-y-1' */}
        <nav className={navClass}>
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                'sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                isActive(item) ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 mb-2">
        {role !== 'viewer' && (
          <h2 className="text-xs uppercase tracking-wider text-blue-400 font-semibold px-3 mb-2">
            Инструменты
          </h2>
        )}
          <nav className="space-y-1">
            {visibleTools.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'sidebar-item w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all',
                  isActive(item) ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
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

        {adminItems.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs uppercase tracking-wider text-blue-400 font-semibold px-3 mb-2">
              Администрирование
            </h2>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    isActive(item)
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* bottom settings — hidden for viewer */}
      {role !== 'viewer' && (
        <div className="absolute bottom-0 w-64 p-4 border-t bg-white/50 backdrop-blur">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">
            <Settings size={18} />
            <span>Настройки</span>
          </button>
        </div>
      )}
    </div>
  );
}
