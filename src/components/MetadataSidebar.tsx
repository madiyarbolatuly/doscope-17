import React, { useState } from 'react';
import { Document } from '@/types/document';
import { MetadataCard } from './MetadataCard';
import {
  FileText, File, FileSpreadsheet, FileImage, 
  Folder, X, Download, Share2, Star, Trash, Edit, Check, Download as DownloadIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';


interface MetadataSidebarProps {
  document?: Document;
  previewUrl?: string | null;
  onClose: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onUpdateMetadata?: (id: string, name: string, tags?: string[], categories?: string[]) => Promise<void>;
  onShare?: () => void;
  token?: string;
}

export function MetadataSidebar({ 
  document,
  previewUrl,
  onClose,
  onDownload,
  onDelete,
  onShare,
  onUpdateMetadata,
  token
}: MetadataSidebarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center border-l p-6">
        <p className="text-muted-foreground text-center">
          Select a file or folder to view its details
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

  const handleStartEdit = () => {
    setNewName(document.name);
    setIsEditingName(true);
  };

  const handleSaveEdit = async () => {
    if (!document.id || !onUpdateMetadata || newName.trim() === '') return;
    
    setIsSaving(true);
    try {
      await onUpdateMetadata(document.id, newName);
      setIsEditingName(false);
    } catch (error) {
      console.error('Error saving document name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  const isFolder = document.type === 'folder';
  const fileExtension = document.name.split('.').pop()?.toUpperCase() || '';
  const modifiedDate = document.modified ? new Date(document.modified) : new Date();
  
  return (
    <div className="h-full border-l bg-background overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium">Детали</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Preview section for PDF or Images */}
        {previewUrl && !previewError && (document.type === 'pdf' || document.type === 'image') && (
          <div className="max-h-[300px] overflow-hidden rounded-md border mb-4">
            {/* blob URL here */}
            {document.type === 'pdf' ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-[300px]"
                title={document.name}
                onError={handlePreviewError}
                allowFullScreen

              />
            ) : (
              <img
                src={previewUrl}
                alt={document.name}
                className="max-h-[300px] w-full object-contain"
                onError={handlePreviewError}
              />
            )}
          </div>
        )}

        
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
          
          {isEditingName ? (
            <div className="flex items-center gap-2 mb-2">
              <Input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full"
                autoFocus
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-medium">{document.name}</h3>
              <Button variant="ghost" size="icon" onClick={handleStartEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            {isFolder ? 'Folder' : fileExtension}
          </p>
        </div>
        
        <div className="flex gap-2 justify-center">
          {!isFolder && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDownload}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Скачать
            </Button>
          )}
            <Button 
              variant="outline" 
          
              className="flex items-center gap-1">
                <Share2 size={16} />
                <span className="hidden md:inline">Поделиться</span>
             </Button>
            
          <Button variant="outline" size="sm">
            <Star className="h-4 w-4 mr-2" />
            {document.favorited ? 'Убрать' : 'В избранное'}
          </Button>
          
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive border-destructive"
              onClick={onDelete}
            >
              <Trash className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          )}
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
            <span className="text-sm font-medium">{document.size || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Владелец</span>
            <span className="text-sm font-medium">{document.owner}</span>
            </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Изменён</span>
            <span className="text-sm font-medium">{format(modifiedDate, 'MMM d, yyyy h:mm a')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Расположение</span>
            <span className="text-sm font-medium">{document.path || '/'}</span>
          </div>
          
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Теги</span>
              <div className="flex gap-1 flex-wrap">
                {document.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="text-xs bg-muted px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        <MetadataCard 
          title="Активность" 
          items={[
            { label: 'Последний доступ', value: document.owner },
            { label: 'Последнее изменение', value: format(modifiedDate, 'MMM d, yyyy h:mm a') },
          ]} 
        />
      </div>
    </div>
  );
}
