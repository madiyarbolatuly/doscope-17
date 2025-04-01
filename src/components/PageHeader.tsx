
import React from 'react';
import { SearchBar } from './SearchBar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid, List, Plus, Upload } from 'lucide-react';
import { CategoryType } from '@/types/document';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  categoryType?: CategoryType;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
}

export function PageHeader({ 
  title, 
  description,
  children,
  categoryType,
  searchQuery, 
  setSearchQuery,
  viewMode,
  setViewMode
}: PageHeaderProps) {
  const getCategoryDescription = (type?: CategoryType) => {
    if (!type) return description;
    
    switch (type) {
      case 'all':
        return 'All documents in your workspace';
      case 'recent':
        return 'Recently accessed documents';
      case 'shared':
        return 'Documents shared with you';
      case 'favorites':
        return 'Your favorite documents';
      case 'trash':
        return 'Deleted documents';
      default:
        return `Documents in the ${type} category`;
    }
  };

  // Если children предоставлен, просто отображаем их вместо стандартных кнопок
  const renderActions = () => {
    if (children) {
      return children;
    }
    
    return (
      <div className="flex gap-2">
        <Button className="flex items-center gap-1">
          <Plus size={16} />
          <span>New</span>
        </Button>
        <Button variant="outline" className="flex items-center gap-1">
          <Upload size={16} />
          <span>Upload</span>
        </Button>
      </div>
    );
  };

  return (
    <div className="pb-4 border-b">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description || getCategoryDescription(categoryType)}</p>
        </div>
        {renderActions()}
      </div>

      {(searchQuery !== undefined && setSearchQuery && viewMode !== undefined && setViewMode) && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <SearchBar query={searchQuery} setQuery={setSearchQuery} />
          <div className="flex items-center gap-4">
            <Tabs defaultValue={viewMode} className="w-[160px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="grid" 
                  onClick={() => setViewMode('grid')}
                  className="flex items-center gap-1"
                >
                  <Grid size={16} />
                  <span>Grid</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-1"
                >
                  <List size={16} />
                  <span>List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
