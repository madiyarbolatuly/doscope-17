
import React, { useState, useEffect } from 'react';
import { Document, MultipleSelectionActions } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { FolderPlus, Upload, Check, Trash, Download, Share2, X, ChevronRight, ChevronDown, Home, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentListItem } from './DocumentListItem';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
  onDocumentPreview: (document: Document) => void;
  viewMode?: 'grid' | 'list';
  selectedDocument?: Document | null;
  onDocumentSelect: (document: Document) => void;
  multipleSelection?: boolean;
  selectionActions?: MultipleSelectionActions;
  currentPath?: Document[];
  onNavigateToFolder?: (folder: Document) => void;
  onNavigateUp?: () => void;
  onUploadFiles?: () => void;
}

interface TreeNode {
  document: Document;
  children: TreeNode[];
  isExpanded: boolean;
  level: number;
}

// Mock nested folder structure
const mockFolderStructure: { [key: string]: Document[] } = {
  'folder-1': [
    {
      id: 'subfolder-1-1',
      name: 'Project Documents',
      type: 'folder',
      modified: new Date().toISOString(),
      owner: 'John Doe',
      category: 'projects'
    },
    {
      id: 'file-1-1',
      name: 'Report.pdf',
      type: 'pdf',
      size: '2.1 MB',
      modified: new Date().toISOString(),
      owner: 'Jane Smith',
      category: 'reports'
    }
  ],
  'subfolder-1-1': [
    {
      id: 'file-2-1',
      name: 'Meeting Notes.doc',
      type: 'doc',
      size: '1.5 MB',
      modified: new Date().toISOString(),
      owner: 'Alice Johnson',
      category: 'meetings'
    },
    {
      id: 'file-2-2',
      name: 'Budget.xlsx',
      type: 'xlsx',
      size: '800 KB',
      modified: new Date().toISOString(),
      owner: 'Bob Wilson',
      category: 'finance'
    }
  ]
};

export function DocumentGrid({ 
  documents, 
  onDocumentClick, 
  onDocumentPreview,
  viewMode = 'grid',
  selectedDocument,
  onDocumentSelect,
  multipleSelection = false,
  selectionActions,
  currentPath = [],
  onNavigateToFolder,
  onNavigateUp,
  onUploadFiles
}: DocumentGridProps) {
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Add mock subfolders to documents if we're in a folder
  const documentsWithSubfolders = React.useMemo(() => {
    if (currentPath.length === 0) {
      // Root level - add some mock folders
      return [
        ...documents,
        {
          id: 'folder-1',
          name: 'Marketing Materials',
          type: 'folder' as const,
          modified: new Date().toISOString(),
          owner: 'Marketing Team',
          category: 'marketing' as const
        },
        {
          id: 'folder-2',
          name: 'Financial Reports',
          type: 'folder' as const,
          modified: new Date().toISOString(),
          owner: 'Finance Team',
          category: 'finance' as const
        }
      ];
    } else {
      // Inside a folder - get subfolder content
      const currentFolderId = currentPath[currentPath.length - 1]?.id;
      const subContent = mockFolderStructure[currentFolderId] || [];
      return [...documents, ...subContent];
    }
  }, [documents, currentPath]);

  const buildTreeStructure = (docs: Document[]): TreeNode[] => {
    return docs.map(doc => ({
      document: doc,
      children: [],
      isExpanded: expandedFolders.has(doc.id),
      level: 0
    }));
  };

  const treeNodes = buildTreeStructure(documentsWithSubfolders);

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

  const handleDocumentClick = (document: Document, index: number) => {
    if (document.type === 'folder') {
      onNavigateToFolder?.(document);
    } else {
      if (multipleSelection && isShiftPressed && lastSelectedIndex !== null) {
        const startIdx = Math.min(lastSelectedIndex, index);
        const endIdx = Math.max(lastSelectedIndex, index);
        
        const docsBetween = treeNodes.slice(startIdx, endIdx + 1);
        docsBetween.forEach(node => {
          if (!selectionActions?.selectedIds.includes(node.document.id)) {
            onDocumentSelect(node.document);
          }
        });
      } else {
        onDocumentSelect(document);
        onDocumentClick(document);
      }
      setLastSelectedIndex(index);
    }
  };

  const handleSelectAll = () => {
    selectionActions?.onSelectAll?.();
  };

  const handleClearSelection = () => {
    selectionActions?.onClearSelection?.();
  };

  const renderBreadcrumbs = () => {
    if (currentPath.length === 0) return null;

    return (
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateUp?.();
                }}
                className="flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                Root
              </BreadcrumbLink>
            </BreadcrumbItem>
            {currentPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === currentPath.length - 1 ? (
                    <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        // Navigate to this level
                      }}
                    >
                      {folder.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  };

  const renderToolbar = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onUploadFiles}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (!documentsWithSubfolders.length) {
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
          <Button size="sm" onClick={onUploadFiles}>
            <Upload className="h-4 w-4 mr-2" />
            Загрузить файлы
          </Button>
        </div>
      </div>
    );
  }

  const renderSelectionActionsBar = () => {
    if (!multipleSelection || !selectionActions || selectionActions.selectedIds.length === 0) return null;
    
    return (
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md mb-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={selectionActions.selectedIds.length === documentsWithSubfolders.length}
            onCheckedChange={() => {
              if (selectionActions.selectedIds.length === documentsWithSubfolders.length) {
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

  const renderTreeNode = (node: TreeNode, index: number) => {
    const isFolder = node.document.type === 'folder';
    const isSelected = multipleSelection && selectionActions
      ? selectionActions.selectedIds.includes(node.document.id)
      : selectedDocument?.id === node.document.id;

    if (viewMode === 'grid') {
      return (
        <div key={node.document.id} className="relative">
          <DocumentCard 
            document={node.document} 
            onClick={() => handleDocumentClick(node.document, index)}
            onPreview={onDocumentPreview}
            isSelected={isSelected}
            onSelect={() => onDocumentSelect(node.document)}
            multipleSelection={multipleSelection}
            hideSelectButton={true}
          />
        </div>
      );
    }

    return (
      <div key={node.document.id} className="relative">
        <DocumentListItem 
          document={node.document} 
          onClick={() => handleDocumentClick(node.document, index)}
          onPreview={onDocumentPreview}
          isSelected={isSelected}
          onSelect={() => onDocumentSelect(node.document)}
          multipleSelection={multipleSelection}
          hideSelectButton={true}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderToolbar()}
      {renderBreadcrumbs()}
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
