import React, { useState, useEffect } from 'react';
import { Document, MultipleSelectionActions } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { FolderPlus, Upload, Check, Trash, Download, Share2, X, ChevronDown, ChevronRight, ArchiveIcon } from 'lucide-react';
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
  onArchive?: (fileName: string) => void;
  onUnarchive?: (fileName: string) => void;
  toggleFavorite?: (documentId: string) => void;
}

interface TreeNode {
  document: Document;
  children: TreeNode[];
  isExpanded: boolean;
  level: number;
}

export function DocumentGrid({
  documents,
  onDocumentClick,
  onDocumentPreview,
  viewMode = 'grid',
  selectedDocument,
  onDocumentSelect,
  multipleSelection = true,
  selectionActions = {
    selectedIds: [],
    onArchiveSelected: () => { /* Archive logic */ },
    onRestoreSelected: () => { /* Unarchive logic */ },
    // ...other actions
  }
}: DocumentGridProps) {

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const buildTreeStructure = (docs: Document[]): TreeNode[] => {
    const folders = docs.filter(doc => doc.type === 'folder');
    const files = docs.filter(doc => doc.type !== 'folder');

    const tree: TreeNode[] = [];

    // Add all folders as top-level nodes
    folders.forEach(folder => {
      tree.push({
        document: folder,
        children: [], // Folders can have children but we'll simulate this
        isExpanded: expandedFolders.has(folder.id),
        level: 0
      });
    });

    // Add all files as top-level nodes
    files.forEach(file => {
      tree.push({
        document: file,
        children: [], // Files never have children
        isExpanded: false,
        level: 0
      });
    });

    return tree;
  };

  const treeNodes = buildTreeStructure(documents);
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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Handle multi-selection with shift key
  const handleDocumentSelect = (document: Document, index: number) => {
    if (!multipleSelection || !selectionActions) {
      onDocumentSelect(document);
      return;
    }

    if (isShiftPressed && lastSelectedIndex !== null) {
      // Find all documents between lastSelectedIndex and current index
      const startIdx = Math.min(lastSelectedIndex, index);
      const endIdx = Math.max(lastSelectedIndex, index);

      const docsBetween = treeNodes.slice(startIdx, endIdx + 1);
      const idsToAdd = docsBetween.map(node => node.document.id).filter(id => !selectionActions.selectedIds.includes(id));
      // Add all documents in between to selection
      if (selectionActions.selectedIds.includes(document.id)) {
        onDocumentSelect(document); // Toggle current document
      } else {
        // Add all documents in between to selection
        idsToAdd.forEach(id => {
          const doc = treeNodes.find(n => n.document.id === id)?.document;
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
          <Button size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Загрузить Файлы
          </Button>
        </div>
      </div>
    );
  }

  // Render selection actions bar when items are selected
  const renderSelectionActionsBar = () => {
    if (!multipleSelection || !selectionActions || selectionActions.selectedIds.length === 0) return null;

    // Determine favorite state for selected documents
    const selectedDocs = documents.filter(doc => selectionActions.selectedIds.includes(doc.id));
    const allFavorited = selectedDocs.length > 0 && selectedDocs.every(doc => doc.favorited || doc.starred);
    const allUnfavorited = selectedDocs.length > 0 && selectedDocs.every(doc => !(doc.favorited || doc.starred));

    // Helper to favorite/unfavorite all selected
    const handleFavoriteSelected = () => {
      if (typeof onToggleFavorite === 'function') {
        // Only favorite those not already favorited
        selectedDocs
          .filter(doc => !(doc.favorited || doc.starred))
          .forEach(doc => toggleFavorite(doc.id));
      } else if (selectionActions.onFavoriteSelected) {
        selectionActions.onFavoriteSelected();
      }
    };
    const handleUnfavoriteSelected = () => {
      if (typeof toggleFavorite === 'function') {
        // Only unfavorite those that are favorited
        selectedDocs
          .filter(doc => doc.favorited || doc.starred)
          .forEach(doc => toggleFavorite(doc.id));
      } else if (selectionActions.onUnfavoriteSelected) {
        selectionActions.onUnfavoriteSelected();
      }
    };

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
              <span className="hidden md:inline">Разархивировать</span>
            </Button>
          )}
         
          {selectionActions.onFavoriteSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFavoriteSelected}
              className="flex items-center gap-1"
              disabled={!allUnfavorited}
            >
              <Check size={16} />
              <span className="hidden md:inline">Добавить в избранное</span>
            </Button>
          )}
          {selectionActions.onUnfavoriteSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnfavoriteSelected}
              className="flex items-center gap-1"
              disabled={!allFavorited}
            >
              <X size={16} />
              <span className="hidden md:inline">Убрать из избранного</span>
            </Button>
          )}
         
        </div>
      </div>
    );
  };

  const renderTreeNode = (node: TreeNode, index: number) => {
    const isFolder = node.document.type === 'folder';
    const isSelected = multipleSelection && selectionActions
      ? selectionActions.selectedIds.includes(node.document.id)
      : selectedDocument?.id === node.document.id;

    if (viewMode === 'grid') {
      return (
        <div key={node.document.id} className="relative">
          {isFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -left-2 z-10 w-6 h-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.document.id);
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          <DocumentCard
            document={node.document}
            onClick={onDocumentClick}
            onPreview={onDocumentPreview}
            isSelected={isSelected}
            onSelect={() => handleDocumentSelect(node.document, index)}
            multipleSelection={multipleSelection}
          />
          {isFolder && node.isExpanded && (
            <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* Simulate folder content - in real app this would come from data */}
              <div className="text-sm text-muted-foreground p-2 border border-dashed rounded">
                Содержимое папки
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={node.document.id} className="relative">
        <div className="flex items-center">
          {isFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 mr-2"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.document.id);
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          <div className="flex-1">
            <DocumentListItem
              document={node.document}
              onClick={onDocumentClick}
              onPreview={onDocumentPreview}
              isSelected={isSelected}
              onSelect={() => handleDocumentSelect(node.document, index)}
              multipleSelection={multipleSelection}
            />
          </div>
        </div>
        {isFolder && node.isExpanded && (
          <div className="ml-8 mt-2 border-l border-muted pl-4">
            <div className="text-sm text-muted-foreground p-2 border border-dashed rounded">
              Содержимое папки: {node.document.name}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSelectionActionsBar()}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {treeNodes.map((node, index) => renderTreeNode(node, index))}
        </div>
      ) : (
        <div className="space-y-1">
          {treeNodes.map((node, index) => renderTreeNode(node, index))}
        </div>
      )}
    </div>
  );
}
