import React, { useState, useEffect } from 'react';
import { Document, MultipleSelectionActions } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { FolderPlus, Upload, Check, Trash, Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentListItem } from './DocumentListItem';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
  onDocumentPreview: (document: Document) => void;
  viewMode?: 'grid' | 'list';
  selectedDocument?: Document | null;
  onDocumentSelect: (document: Document) => void;
  multipleSelection?: boolean;
  selectionActions?: MultipleSelectionActions;
}

export function DocumentGrid({ 
  documents, 
  onDocumentClick, 
  onDocumentPreview,
  viewMode = 'grid',
  selectedDocument,
  onDocumentSelect,
  multipleSelection = false,
  selectionActions
}: DocumentGridProps) {
  // Separate folders and files
  const folders = documents.filter(doc => doc.type === 'folder');
  const files = documents.filter(doc => doc.type !== 'folder');
  
  // For shift+click functionality
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Event listeners for shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle multi-selection with shift key
  const handleDocumentSelect = (document: Document, index: number) => {
    if (!multipleSelection || !selectionActions) {
      onDocumentSelect(document);
      return;
    }

    if (isShiftPressed && lastSelectedIndex !== null) {
      // Find all documents between lastSelectedIndex and current index
      const allDocs = [...folders, ...files];
      const startIdx = Math.min(lastSelectedIndex, index);
      const endIdx = Math.max(lastSelectedIndex, index);
      
      const docsBetween = allDocs.slice(startIdx, endIdx + 1);
      const idsToAdd = docsBetween.map(doc => doc.id).filter(id => !selectionActions.selectedIds.includes(id));
      
      // Add all documents in between to selection
      if (selectionActions.selectedIds.includes(document.id)) {
        onDocumentSelect(document); // Toggle current document
      } else {
        // Add all documents in between to selection
        idsToAdd.forEach(id => {
          const doc = allDocs.find(d => d.id === id);
          if (doc) onDocumentSelect(doc);
        });
      }
    } else {
      // Regular toggle selection
      onDocumentSelect(document);
      setLastSelectedIndex(index);
    }
  };

  const handleSelectAll = () => {
    selectionActions?.onSelectAll?.();
  };

  const handleClearSelection = () => {
    selectionActions?.onClearSelection?.();
  };

  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">Документы не найдены</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Нет документов, соответствующих вашему поиску или фильтру. Измените параметры поиска или добавьте новые документы.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            Создать папку
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Загрузить файлы
          </Button>
        </div>
      </div>
    );
  }

  // Render selection actions bar when items are selected
  const renderSelectionActionsBar = () => {
    if (!multipleSelection || !selectionActions || selectionActions.selectedIds.length === 0) return null;
    
    return (
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md mb-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={selectionActions.selectedIds.length === documents.length}
            onCheckedChange={() => {
              if (selectionActions.selectedIds.length === documents.length) {
                handleClearSelection();
              } else {
                handleSelectAll();
              }
            }}
          />
          <span className="text-sm font-medium">
            {selectionActions.selectedIds.length} выбранно
          </span>
        </div>
        <div className="flex gap-2">
          {selectionActions.onClearSelection && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearSelection}
              className="flex items-center gap-1"
            >
              <X size={16} />
              <span className="hidden md:inline">Отмена</span>
            </Button>
          )}
          {selectionActions.onDownloadSelected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectionActions.onDownloadSelected}
              className="flex items-center gap-1"
            >
              <Download size={16} />
              <span className="hidden md:inline">Скачать</span>
            </Button>
          )}
          {selectionActions.onShareSelected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={e => { e.stopPropagation(); selectionActions.onShareSelected(); }}
              className="flex items-center gap-1"
            >
              <Share2 size={16} />
              <span className="hidden md:inline">Поделиться</span>
            </Button>
          )}
          {selectionActions.onRestoreSelected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectionActions.onRestoreSelected}
              className="flex items-center gap-1"
            >
              <Check size={16} />
              <span className="hidden md:inline">Восстановить</span>
            </Button>
          )}
          {selectionActions.onDeleteSelected && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={selectionActions.onDeleteSelected}
              className="flex items-center gap-1"
            >
              <Trash size={16} />
              <span className="hidden md:inline">Удалить</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSelectionActionsBar()}
      {viewMode === 'grid' ? (
        <div className="space-y-6">
          {folders.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">Папки</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.map((folder, index) => (
                  <DocumentCard 
                    key={folder.id} 
                    document={folder} 
                    onClick={onDocumentClick}
                    onPreview={onDocumentPreview}
                    isSelected={
                      multipleSelection && selectionActions
                        ? selectionActions.selectedIds.includes(folder.id)
                        : selectedDocument?.id === folder.id
                    }
                    onSelect={() => handleDocumentSelect(folder, index)}
                    multipleSelection={multipleSelection}
                  />
                ))}
              </div>
            </div>
          )}
          {files.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">Файлы</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <DocumentCard 
                    key={file.id} 
                    document={file} 
                    onClick={onDocumentClick}
                    onPreview={onDocumentPreview}
                    isSelected={
                      multipleSelection && selectionActions
                        ? selectionActions.selectedIds.includes(file.id)
                        : selectedDocument?.id === file.id
                    }
                    onSelect={() => handleDocumentSelect(file, folders.length + index)}
                    multipleSelection={multipleSelection}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {folders.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-2">Папки</h2>
              <div className={cn("rounded-md border")}> 
                {folders.map((folder, index) => (
                  <DocumentListItem 
                    key={folder.id} 
                    document={folder} 
                    onClick={onDocumentClick}
                    onPreview={onDocumentPreview}
                    isSelected={
                      multipleSelection && selectionActions
                        ? selectionActions.selectedIds.includes(folder.id)
                        : selectedDocument?.id === folder.id
                    }
                    onSelect={() => handleDocumentSelect(folder, index)}
                    multipleSelection={multipleSelection}
                  />
                ))}
              </div>
            </div>
          )}
          {files.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-2">Файлы</h2>
              <div className={cn("rounded-md border")}> 
                {files.map((file, index) => (
                  <DocumentListItem 
                    key={file.id} 
                    document={file} 
                    onClick={onDocumentClick}
                    onPreview={onDocumentPreview}
                    isSelected={
                      multipleSelection && selectionActions
                        ? selectionActions.selectedIds.includes(file.id)
                        : selectedDocument?.id === file.id
                    }
                    onSelect={() => handleDocumentSelect(file, folders.length + index)}
                    multipleSelection={multipleSelection}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
