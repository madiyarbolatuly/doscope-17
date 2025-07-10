import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Plus, 
  Filter, 
  Download, 
  Archive, 
  Trash2,
  SortAsc,
  SortDesc
} from 'lucide-react';

type SortField = 'name' | 'modified' | 'size' | 'owner';
type SortOrder = 'asc' | 'desc';

interface DocumentControlsProps {
  selectedCount: number;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onBulkAction: (action: string) => void;
  onCreateDocument: () => void;
  onToggleFilters: () => void;
}

export function DocumentControls({
  selectedCount,
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange,
  onBulkAction,
  onCreateDocument,
  onToggleFilters
}: DocumentControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Selection Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 mr-4">
          <Badge variant="secondary">{selectedCount} выбрано</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Действия
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onBulkAction('download')}>
                <Download className="h-4 w-4 mr-2" />
                Скачать выбранные
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('archive')}>
                <Archive className="h-4 w-4 mr-2" />
                Архивировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onBulkAction('trash')}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {/* Sort Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-1" /> : <SortDesc className="h-4 w-4 mr-1" />}
            Сортировка
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
          <DropdownMenuCheckboxItem 
            checked={sortField === 'name'}
            onCheckedChange={() => onSortFieldChange('name')}
          >
            Название
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem 
            checked={sortField === 'modified'}
            onCheckedChange={() => onSortFieldChange('modified')}
          >
            Дата изменения
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem 
            checked={sortField === 'size'}
            onCheckedChange={() => onSortFieldChange('size')}
          >
            Размер
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem 
            checked={sortField === 'owner'}
            onCheckedChange={() => onSortFieldChange('owner')}
          >
            Владелец
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? 'По убыванию' : 'По возрастанию'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="outline" 
        size="sm"
        onClick={onToggleFilters}
      >
        <Filter className="h-4 w-4 mr-1" />
        Фильтры
      </Button>
      
      <Button 
        className="bg-blue-600 hover:bg-blue-700"
        onClick={onCreateDocument}
        size="sm"
      >
        <Plus className="h-4 w-4 mr-1" />
        Загрузить
      </Button>
    </div>
  );
}