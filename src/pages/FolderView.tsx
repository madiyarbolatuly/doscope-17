// src/pages/FolderView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document as UIDocument, CategoryType } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { ShareModal } from '@/components/ShareModal';
import { buildTree, TreeNode } from '@/utils/buildTree';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, FileText, File, FileSpreadsheet, FileImage, MoreVertical } from "lucide-react";
import { archiveDocument, toggleStar, renameDocument, deleteDocument } from '@/services/archiveService';
import { Table, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnhancedFolderTree } from '@/components/EnhancedFolderTree';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';

// НОВОЕ: берём ленивая подгрузка документов
import { useDocuments } from '@/hooks/useDocuments';

// Если у тебя есть helper apiUrl — оставляю, иначе замени на константы из config/api
declare function apiUrl(p: string): string;

interface BackendDocument {
  owner_id: string;
  name: string;
  file_path: string;
  created_at: string;
  size: number;
  file_type: string;
  tags: string[] | null;
  categories: string[] | null;
  status: string;
  file_hash: string;
  access_to: string[] | null;
  id: string;
  parent_id: string | null;
}

interface FolderInfo {
  id: string;
  name: string;
  parent_id: string | null;
  file_path: string;
}

// Размер в человекочитаемом виде
const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FolderView = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();

  const [category] = useState<CategoryType>('all');
  const [searchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [selectedDocument, setSelectedDocument] = useState<UIDocument | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const [shareDoc] = useState<UIDocument | null>(null);
  const [setIsShareOpen] = useState(false);

  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<FolderInfo[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  const token = localStorage.getItem('authToken');

  // НОВОЕ: ленивая подгрузка документов из папки (по курсору)
  const {
    docs: lazyDocs,            // документы из хука (твоя «ленивая» пагинация)
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    loading: docsLoading,
    refetch,                   // использовать после действий (archive/delete/rename)
  } = useDocuments(undefined, undefined, folderId);

  // НОВОЕ: "сторожок" для IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Маппинг документов из хука → тип, который ожидает текущий экран (UIDocument)
  const documents: UIDocument[] = useMemo(() => {
    return (lazyDocs ?? []).map((d) => {
      // d.modified может быть строкой — конвертим в Date
      const mod = d.modified ? new Date(d.modified) : new Date();
      return {
        id: d.id,
        name: d.name,
        title: d.name,
        type: (d as any).type ?? 'file', // если в хуке поле называется type
        size: (d as any).size ?? 'Unknown',
        created: mod,                    // нет отдельного created — используем modified
        modified: mod,
        tags: [],
        categories: (d as any).category ? [(d as any).category] : [],
        status: (d as any).status ?? 'draft',
        isArchived: (d as any).archived ?? false,
        favorited: (d as any).starred ?? false,
        path: '',
        parentId: null,
      } as UIDocument;
    });
  }, [lazyDocs]);

  // Дерево для сайдбара
  const treeData: TreeNode[] = useMemo(() => buildTree(documents), [documents]);

  // Загрузка метаданных папки и хлебных крошек (оставляем твой подход)
  const fetchFolderMeta = useCallback(async () => {
    if (!folderId) {
      setCurrentFolder(null);
      setBreadcrumbPath([]);
      return;
    }

    setMetaLoading(true);
    try {
      const folderResponse = await fetch(apiUrl(`/v2/metadata/${folderId}`), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (folderResponse.ok) {
        const folderData = await folderResponse.json();
        setCurrentFolder(folderData);
      }
      await buildBreadcrumbPath(folderId);
    } catch (e) {
      console.error('Error fetching folder meta:', e);
    } finally {
      setMetaLoading(false);
    }
  }, [folderId, token]);

  const buildBreadcrumbPath = async (currentFolderId: string) => {
    const path: FolderInfo[] = [];
    let currentId = currentFolderId;
    while (currentId) {
      try {
        const response = await fetch(apiUrl(`/v2/metadata/${currentId}`), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const folderData = await response.json();
          path.unshift(folderData);
          currentId = folderData.parent_id;
        } else {
          break;
        }
      } catch (error) {
        console.error('Error building breadcrumb:', error);
        break;
      }
    }
    setBreadcrumbPath(path);
  };

  useEffect(() => {
    fetchFolderMeta();
    // при смене папки стоит очистить выбор
    setSelectedDocumentIds([]);
  }, [fetchFolderMeta]);

  // Навигация
  const handleFolderClick = (folder: UIDocument) => {
    if (folder.type === 'folder') {
      navigate(`/?folderId=${folder.id}`);
    }
  };

  const handleFolderSelect = (id: string) => {
    navigate(`/?folderId=${id}`);
  };

  const handleBackToRoot = () => {
    navigate('/');
  };

  const handleBreadcrumbClick = (id: string) => {
    if (id === 'root') navigate('/');
    else navigate(`/?folderId=${id}`);
  };

  // Клики по документам
  const handleDocumentClick = (document: UIDocument) => {
    if (document.type === 'folder') {
      handleFolderClick(document);
    } else {
      setSelectedDocument(document);
      setShowSidebar(true);
    }
  };

  const handleDocumentSelect = (document: UIDocument) => {
    setSelectedDocumentIds(prev =>
      prev.includes(document.id)
        ? prev.filter(id => id !== document.id)
        : [...prev, document.id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocumentIds(documents.map(doc => doc.id));
  };

  const handleClearSelection = () => setSelectedDocumentIds([]);

  // Действия (после каждого — refetch(), чтобы подтянуть актуальную страницу)
  const handleDeleteDocument = async (document: UIDocument) => {
    try {
      await deleteDocument(document.id, token!);
      toast({ title: "Success", description: "Document deleted successfully" });
      await refetch();
    } catch {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  const handleArchiveDocument = async (document: UIDocument) => {
    try {
      await archiveDocument(document.id, token!);
      toast({ title: "Success", description: "Document archived successfully" });
      await refetch();
    } catch {
      toast({ title: "Error", description: "Failed to archive document", variant: "destructive" });
    }
  };

  const handleToggleFavorite = async (document: UIDocument) => {
    try {
      await toggleStar(document.id, token!);
      toast({ title: "Success", description: "Document favorited successfully" });
      await refetch();
    } catch {
      toast({ title: "Error", description: "Failed to favorite document", variant: "destructive" });
    }
  };

  const handleRenameDocument = async (document: UIDocument, newName: string) => {
    try {
      await renameDocument(document.id, newName, token!);
      toast({ title: "Success", description: "Document renamed successfully" });
      await refetch();
    } catch {
      toast({ title: "Error", description: "Failed to rename document", variant: "destructive" });
    }
  };

  const handleSort = (field: string) => {
    setSortBy(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      let aValue: any = (a as any)[sortBy as keyof UIDocument];
      let bValue: any = (b as any)[sortBy as keyof UIDocument];

      if (sortBy === 'created' || sortBy === 'modified') {
        aValue = (aValue as Date)?.getTime?.() ?? 0;
        bValue = (bValue as Date)?.getTime?.() ?? 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, sortBy, sortOrder]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return sortedDocuments;
    return sortedDocuments.filter(doc =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedDocuments, searchQuery]);

  const renderIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'folder':
        return <Folder className="h-5 w-5 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Скелетон загрузки
  if (docsLoading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Хлебные крошки */}
      <div className="flex items-center space-x-2 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToRoot}
          className="flex items-center space-x-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Root</span>
        </Button>

        {breadcrumbPath.map((folder) => (
          <React.Fragment key={folder.id}>
            <span className="text-gray-400">/</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBreadcrumbClick(folder.id)}
              className="hover:underline"
            >
              {folder.name}
            </Button>
          </React.Fragment>
        ))}
      </div>

      {/* Заголовок */}
      <PageHeader
        title={currentFolder?.name || 'Folder'}
        description={`Contents of ${currentFolder?.name || 'folder'}`}
      />

      {/* Контент */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={75}>
            <div className="h-full p-4">
              {viewMode === 'list' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDocumentIds.length === documents.length && documents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-gray-500">
                        {selectedDocumentIds.length} of {documents.length} selected
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={selectedDocumentIds.length === 0}
                    >
                      Clear Selection
                    </Button>
                  </div>

                  <Table>
  <TableHeader>…твой header…</TableHeader>

  {/* Виртуализируем только строки */}
  <DocList
    items={filteredDocuments}
    rowHeight={56}
    overscan={12}
    onNearEnd={() => {
      // Вместо отдельного sentinel: догружаем следующую страницу,
      // когда остаётся 10 элементов до конца
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }}
    renderRow={(document) => (
      <TableRow
        key={document.id}
        className={`cursor-pointer hover:bg-gray-50 ${
          selectedDocumentIds.includes(document.id) ? 'bg-blue-50' : ''
        }`}
        onClick={() => handleDocumentClick(document)}
      >
        <TableCell>
          <Checkbox
            checked={selectedDocumentIds.includes(document.id)}
            onCheckedChange={() => handleDocumentSelect(document)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
        <TableCell className="flex items-center space-x-2">
          {renderIcon(document.type)}
          <span className="font-medium">{document.name}</span>
        </TableCell>
        <TableCell className="capitalize">{document.type}</TableCell>
        <TableCell>{document.size}</TableCell>
        <TableCell>
          {document.created ? format(document.created, 'MMM dd, yyyy') : '—'}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggleFavorite(document)}>
                {document.favorited ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleArchiveDocument(document)}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteDocument(document)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )}
  />
</Table>

                  {/* НОВОЕ: сторожок для ленивой подгрузки */}
                  <div ref={sentinelRef} style={{ height: 1 }} />
                  {isFetchingNextPage && (
                    <div className="p-3 text-sm opacity-70">Loading more…</div>
                  )}
                </div>
              ) : (
                <DocumentGrid
                  documents={filteredDocuments}
                  onDocumentClick={handleDocumentClick}
                  onDocumentSelect={handleDocumentSelect}
                  selectedDocumentIds={selectedDocumentIds}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={25}>
            <div className="h-full p-4">
              <EnhancedFolderTree
                data={treeData}
                selectedId={folderId || null}
                onSelect={handleFolderSelect}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Metadata Sidebar */}
      {showSidebar && selectedDocument && (
        <MetadataSidebar
          document={selectedDocument}
          onClose={() => setShowSidebar(false)}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        onClose={() => setIsShareOpen(false)}
        document={shareDoc}
      />
    </div>
  );
};

export default FolderView;
