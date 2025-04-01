
import React from 'react';
import { Document } from '@/types/document';
import { MetadataCard } from './MetadataCard';
import {
  FileText, File, FileSpreadsheet, FileImage, 
  Folder, X, Download, Share2, Star, Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface MetadataSidebarProps {
  document?: Document;
  onClose: () => void;
}

export function MetadataSidebar({ document, onClose }: MetadataSidebarProps) {
  if (!document) {
    return (
      <div className="h-full flex items-center justify-center border-l p-6">
        <p className="text-muted-foreground text-center">
          Выберите файл или папку для просмотра деталей
        </p>
      </div>
    );
  }

  const renderIcon = () => {
    switch (document.type) {
      case 'pdf':
        return <FileText className="h-16 w-16 text-red-500" />;
      case 'doc':
        return <FileText className="h-16 w-16 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-16 w-16 text-green-500" />;
      case 'image':
        return <FileImage className="h-16 w-16 text-purple-500" />;
      case 'folder':
        return <Folder className="h-16 w-16 text-yellow-500" />;
      default:
        return <File className="h-16 w-16 text-gray-500" />;
    }
  };

  const isFolder = document.type === 'folder';
  const fileExtension = document.name.split('.').pop()?.toUpperCase() || '';
  const modifiedDate = new Date(document.modified);
  
  return (
    <div className="h-full border-l bg-background overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium">Детали</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {document.thumbnail ? (
              <img 
                src={document.thumbnail} 
                alt={document.name} 
                className="max-h-28 object-contain" 
              />
            ) : renderIcon()}
          </div>
          
          <h3 className="text-lg font-medium">{document.name}</h3>
          <p className="text-sm text-muted-foreground">
            {isFolder ? 'Папка' : fileExtension}
          </p>
        </div>
        
        <div className="flex gap-2 justify-center">
          {!isFolder && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Скачать
            </Button>
          )}
          
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Поделиться
          </Button>
          
          <Button variant="outline" size="sm">
            <Star className="h-4 w-4 mr-2" />
            {document.favorited ? 'Убрать из избранного' : 'В избранное'}
          </Button>
          
          <Button variant="outline" size="sm" className="text-destructive border-destructive">
            <Trash className="h-4 w-4 mr-2" />
            Удалить
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Тип</span>
            <span className="text-sm font-medium">
              {isFolder ? 'Папка' : fileExtension}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Размер</span>
            <span className="text-sm font-medium">{document.size || 'Нет данных'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Владелец</span>
            <span className="text-sm font-medium">{document.owner}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Изменен</span>
            <span className="text-sm font-medium">{format(modifiedDate, 'dd.MM.yyyy HH:mm')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Расположение</span>
            <span className="text-sm font-medium">{document.path || '/'}</span>
          </div>
        </div>
        
        <Separator />
        
        <MetadataCard 
          title="Активность" 
          items={[
            { label: 'Открыто пользователем', value: document.owner },
            { label: 'Последнее изменение', value: format(modifiedDate, 'dd.MM.yyyy HH:mm') },
          ]} 
        />
      </div>
    </div>
  );
}
