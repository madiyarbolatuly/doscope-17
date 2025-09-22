import React from 'react';
import { SearchBar } from './SearchBar';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid2X2, List, Info } from 'lucide-react';
import { CategoryType } from '@/types/document';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationBell } from './NotificationBell';
import { UserButton } from './UserButton';
import { ProjectSwitcher } from './ProjectSwitcher';
import type { Project } from './ProjectSwitcher'; // тип для onProjectCreate
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  categoryType?: CategoryType;

  searchQuery?: string;
  setSearchQuery?: (query: string) => void;

  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;

  // проекты: только имена (id, name)
  projects?: Array<{ id: string; name: string; userEmail?: string }>;
  selectedProjectId?: string | null;

  // Смена проекта обязательна — свитчер её вызывает всегда
  onProjectChange: (id: string, name: string) => void;

  // Создание нового проекта (корневая папка)
  onProjectCreate?: (p: Project) => void;

  className?: string;
  rightSlot?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  children,
  categoryType,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onProjectCreate,
  rightSlot,

  projects = [],
  selectedProjectId = null,
  onProjectChange,
  className,
}: PageHeaderProps) {
  const getCategoryDescription = (type?: CategoryType) => {
    if (!type) return description;
    switch (type) {
      case 'all':       return 'Все документы в вашем рабочем пространстве';
      case 'recent':    return 'Недавно открытые документы';
      case 'shared':    return 'Документы, которыми поделились с вами';
      case 'favorites': return 'Ваши избранные документы';
      case 'trash':     return 'Удаленные документы';
      default:          return `Документы в категории ${type}`;
    }
  };

  const renderActions = () => {
    if (children) return children;

    return (
      <div className="flex gap-2 items-center">
        <ProjectSwitcher
          projects={projects}
          selectedProjectId={selectedProjectId}
          onProjectChange={onProjectChange}
          onProjectCreate={onProjectCreate}
        />
        <NotificationBell />
        <UserButton />
        {rightSlot}
      </div>
    );
  };

  return (
    <div className={cn("pb-4 border-b border-blue-200 bg-blue-50 px-6 pt-4 shadow-sm rounded-b-md", className)}>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-blue-800">{title}</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={16} className="text-blue-400 hover:text-blue-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-white border border-blue-100 shadow-md">
                  <p className="text-xs text-blue-600">Electronic Document Management System</p>
                  <p className="text-xs text-blue-600">OpenAPI 3.1 Spec at /openapi.json</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-blue-600">
            {description || getCategoryDescription(categoryType)}
          </p>
        </div>
        {renderActions()}
      </div>

      {(searchQuery !== undefined && setSearchQuery && viewMode !== undefined && setViewMode) && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <SearchBar query={searchQuery} setQuery={setSearchQuery} />
          <div className="flex items-center gap-4">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
            >
              <ToggleGroupItem
                value="grid"
                aria-label="Сетка"
                className="text-blue-700 hover:bg-blue-100 data-[state=on]:bg-blue-200 data-[state=on]:text-blue-900"
              >
                <Grid2X2 className="h-4 w-4 mr-1" />
                <span>Сетка</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="list"
                aria-label="Список"
                className="text-blue-700 hover:bg-blue-100 data-[state=on]:bg-blue-200 data-[state=on]:text-blue-900"
              >
                <List className="h-4 w-4 mr-1" />
                <span>Список</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}
    </div>
  );
}
