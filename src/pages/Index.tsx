import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShareModal } from '@/components/ShareModal';
import { buildTree, TreeNode } from '@/utils/buildTree';
import { useShare } from '@/hooks/useShare';
import { Button } from '@/components/ui/button';
import { Plus, Share } from "lucide-react";
import { archiveDocument, unarchiveDocument, getArchivedDocuments, toggleStar, renameDocument, deleteDocument } from '@/services/archiveService';

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, File, FileSpreadsheet, FileImage, Folder, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnhancedFolderTree } from '@/components/EnhancedFolderTree';
import { mockDocuments} from '@/pages/mdocuments'
import { useLocation } from 'react-router-dom';


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


const Index = () => {
  const [category] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [progress, setProgress] = useState(0); // Add this line
  const treeData: TreeNode[] = React.useMemo(() => buildTree(documents), [documents]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [folderId, setFolderId] = useState<string | null>(null);
  const location = useLocation();
  const isAtRoot = location.pathname === '/';
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  const token = localStorage.getItem('authToken')
  

  // Синхронизируем выбранную папку с URL. Сначала ищем параметр ?folderId=...,
  // если его нет – пытаемся извлечь идентификатор из пути /folder/{id}.
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromQuery = searchParams.get('folderId');
    if (fromQuery) {
      setFolderId(fromQuery);
      return;
    }
    const match = location.pathname.match(/\/folder\/([^/]+)/);
    if (match && match[1]) {
      setFolderId(match[1]);
    } else {
      setFolderId(null); // ни параметры, ни путь не указывают на папку
    }
  }, [location.pathname, location.search]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v2/metadata?limit=50&offset=0", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      const docsKey = Object.keys(data).find(key => Array.isArray(data[key]));

      if (docsKey && Array.isArray(data[docsKey])) {
        const transformedDocuments: Document[] = data[docsKey].map((doc: BackendDocument) => ({
          id: doc.id,
          name: doc.name ? decodeURIComponent(doc.name) : 'Unnamed Document',
          type: doc.file_type === 'folder'
            ? 'folder'
            : doc.file_type?.includes('pdf') ? 'pdf'
            : doc.file_type?.includes('doc') ? 'doc'
            : doc.file_type?.includes('xls') ? 'xlsx'
            : doc.file_type?.includes('pptx') ? 'pptx'
            : doc.file_type?.includes('ppt') ? 'ppt'
            : doc.file_type?.includes('png') ? 'png'
            : doc.file_type?.includes('image') ? 'image'
            : 'file',
          size: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : (doc.file_type === 'folder' ? '--' : 'Unknown'),
          modified: doc.created_at,
          owner: doc.owner_id,
          category: doc.categories?.[0] || 'uncategorized',
          path: doc.file_path,
          tags: doc.tags || [],
          parent_id: doc.parent_id ?? null,
          archived: doc.status === 'archived',
          starred: false,
        }));
        
     const combined = [...transformedDocuments, ...mockDocuments];
     setDocuments(combined);      
} else {
        console.log('No real documents found');
        setDocuments(mockDocuments);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      console.log('Using due to API error');
      setDocuments(mockDocuments);
      toast({
        title: "Info",
        description: "Files loaded from DB",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  

  const { createShareLink, shareWithUsers, loading: shareLoading, error: shareError } = useShare();

  // Handler that you’ll pass down to your grid/item “Share” button:
  const openShare = (doc: Document) => {
    setShareDoc(doc);
    setIsShareOpen(true);
   };

  const closeShareModal = () => {
    setShareDoc(null);
    setIsShareOpen(false);
  };


  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Preview document

  const handleFileUpload = async (files: File[], folderId?: string) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, (file as any).relativePath || file.webkitRelativePath || file.name);
    });

    try {
      const response = await axios.post("/api/v2/upload-folder-bulk", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s) successfully`,
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handleShareNode = (nodeId: string) => {
    const doc = documents.find(d => d.id === nodeId);
    if (doc) {
      openShare(doc);
    }
  };
  const handlePreviewFile = async (document: Document) => {
    try {
      const encoded = encodeURIComponent(document.name);
      // 1) Fetch with auth header
      const res = await fetch(`/api/v2/preview/${encoded}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Preview fetch failed');

      // 2) Read it as a Blob
      const blob = await res.blob();

      // 3) Create an object URL so the browser can render it
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      setSelectedDocument(document);
      setShowSidebar(true);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Не удалось загрузить предпросмотр',
        variant: 'destructive',
      });
    }
  };

  // Download document
  const handleDownloadFile = async (doc: Document) => {
    try {
      const encodedFileName = encodeURIComponent(doc.name);
      const downloadUrl = `/api/v2/file/${encodedFileName}/download`;

      const response = await fetch(downloadUrl, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast({
        title: "Success",
        description: `Downloading: ${doc.name}`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  

  // Upload document
  const traverseFileTree = async (
    item: FileSystemEntry,
    path = '',
    fileList: File[] = []
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        const fileEntry = item as FileSystemFileEntry;
        fileEntry.file((file) => {
          (file as File & { relativePath?: string }).relativePath = path + file.name;
          fileList.push(file);
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + '/', fileList);
          }
          resolve();
        });
      }
    });
  };
  const handleDropWithFolders = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  
    const filesToUpload: File[] = [];
    const items = e.dataTransfer.items;
  
    // Traverse the dropped items – supports nested folders via webkitGetAsEntry
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const dtItem = items[i];
        const entry =
          typeof (dtItem as any).webkitGetAsEntry === 'function'
            ? (dtItem as any).webkitGetAsEntry()
            : undefined;
        if (entry) {
          await traverseFileTree(entry, '', filesToUpload);
        } else {
          const file = dtItem.getAsFile?.();
          if (file) {
            (file as File & { relativePath?: string }).relativePath =
              (file as any).webkitRelativePath || file.name;
            filesToUpload.push(file);
          }
        }
      }
    }
  
    // Fallback: use dataTransfer.files if needed
    if (filesToUpload.length === 0) {
      const fallback = Array.from(e.dataTransfer.files || []);
      fallback.forEach((file) => {
        (file as File & { relativePath?: string }).relativePath =
          (file as any).webkitRelativePath || file.name;
      });
      filesToUpload.push(...fallback);
    }
  
    if (filesToUpload.length === 0) return;
  
    const formData = new FormData();
    filesToUpload.forEach((file) => {
      const rp =
        (file as any).relativePath ||
        (file as any).webkitRelativePath ||
        file.name;
      formData.append('files', file, rp);
    });
  
    // Send to backend
    await axios.post('/api/v2/upload-folder-bulk', formData, {
      headers: { Authorization: `Bearer ${token}` },
      onUploadProgress: (p) => {
        const percent = p.total
          ? Math.round((p.loaded * 100) / p.total)
          : 0;
        setProgress(percent);
      },
    });
  };
  

  // Rename/update document metadata
  const handleUpdateMetadata = async (documentId: string, newName: string, tags?: string[], categories?: string[]) => {
    try {
      const response = await axios.put(`/api/v2/metadata/${documentId}`, {
        name: newName,
        tags: tags,
        categories: categories
      }, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      toast({
        title: "Success",
        description: `Document updated successfully`,
      });

      // Refresh document list
      fetchDocuments();

      // If this is the selected document, update it
      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument({
          ...selectedDocument,
          name: newName,
          tags: tags || selectedDocument.tags,
          category: categories && categories.length > 0 ? categories[0] : selectedDocument.category,
        });
      }
    } catch (error) {
      console.error('Error updating document metadata:', error);
      toast({
        title: "Error",
        description: "Failed to update document metadata",
        variant: "destructive"
      });
    }
  };

  // Delete document (move to bin)
  const handleDeleteDocument = async (document: Document) => {
    try {
      // Encode the file name properly for the URL
      const encodedFileName = encodeURIComponent(document.name);
      await axios.delete(`/api/v2/${encodedFileName}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      toast({
        title: "Success",
        description: `Document moved to bin`,
      });

      // Refresh document list
      fetchDocuments();

      // If this document was selected, clear selection
      if (selectedDocument && selectedDocument.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to move document to bin",
        variant: "destructive"
      });
    }
  };

  // Archive document
  const handleArchiveDocument = async (document: Document) => {
    try {
      await archiveDocument(document.name, token!);
      
      toast({
        title: "Success",
        description: `Document "${document.name}" archived successfully`,
      });

      // Refresh document list
      fetchDocuments();

      // If this document was selected, clear selection
      if (selectedDocument && selectedDocument.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } catch (error: any) {
      console.error('Error archiving document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to archive document",
        variant: "destructive"
      });
    }
  };

  // Unarchive document
  const handleUnarchiveDocument = async (document: Document) => {
    try {
      await unarchiveDocument(document.name, token!);
      
      toast({
        title: "Success",
        description: `Document "${document.name}" unarchived successfully`,
      });

      // Refresh document list
      fetchDocuments();

      // If this document was selected, clear selection
      if (selectedDocument && selectedDocument.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } catch (error: any) {
      console.error('Error unarchiving document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unarchive document",
        variant: "destructive"
      });
    }
  };

  // Toggle favorite/star status
  const handleToggleFavorite = async (document: Document) => {
    try {
      await toggleStar(document.name, token!);
      
      toast({
        title: "Success",
        description: `Document "${document.name}" ${document.starred ? 'unstarred' : 'starred'} successfully`,
      });

      // Refresh document list
      fetchDocuments();
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to toggle favorite status",
        variant: "destructive"
      });
    }
  };

  // Rename document
  const handleRenameDocument = async (document: Document, newName: string) => {
    try {
      await renameDocument(document.id, newName, token!);
      
      toast({
        title: "Success",
        description: `Document renamed to "${newName}" successfully`,
      });

      // Refresh document list
      fetchDocuments();
    } catch (error: any) {
      console.error('Error renaming document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to rename document",
        variant: "destructive"
      });
    }
  };

  // Archive selected documents
  const handleArchiveSelected = async () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));

    let successCount = 0;
    let failCount = 0;

    for (const doc of selectedDocs) {
      try {
        await archiveDocument(doc.name, token!);
        successCount++;
      } catch (error: any) {
        console.error(`Error archiving document ${doc.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `Archived ${successCount} document(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
      
      // Clear selection and refresh
      setSelectedDocumentIds([]);
      fetchDocuments();
    } else {
      toast({
        title: "Error",
        description: "Failed to archive any documents",
        variant: "destructive"
      });
    }
  };
  const Caret = ({ direction }: { direction: 'asc' | 'desc' }) => (
    <span className="text-xs">{direction === 'asc' ? '▲' : '▼'}</span>
  );

  const handleDocumentClick = (document: Document) => {
    if (document.type === 'folder') {
      // Navigate to folder view
      navigate(`/folder/${document.id}`);
    } else {
      setSelectedDocument(document);
      setShowSidebar(true);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    if (selectedDocumentIds.includes(document.id)) {
      setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== document.id));
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } else {
      setSelectedDocumentIds([...selectedDocumentIds, document.id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocumentIds.length === documents.length) {
      setSelectedDocumentIds([]);
      setSelectedDocument(null);
      setShowSidebar(false);
    } else {
      setSelectedDocumentIds(documents.map(doc => doc.id));
      if (!selectedDocument && documents.length > 0) {
        setSelectedDocument(documents[0]);
        setShowSidebar(true);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedDocumentIds([]);
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const handleDeleteSelected = async () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));

    let successCount = 0;
    let failCount = 0;

    for (const doc of selectedDocs) {
      try {
        const encodedFileName = encodeURIComponent(doc.name);
        await axios.delete(`/api/v2/${encodedFileName}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        successCount++;
      } catch (error) {
        console.error(`Error deleting document ${doc.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `${successCount} document(s) moved to bin`,
      });

      // Refresh document list
      fetchDocuments();
    }

    if (failCount > 0) {
      toast({
        title: "Error",
        description: `Failed to move ${failCount} document(s) to bin`,
        variant: "destructive"
      });
    }

    setSelectedDocumentIds([]);
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const handleDownloadSelected = () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));

    for (const doc of selectedDocs) {
      handleDownloadFile(doc);
    }
  };

  const handleShareSelected = () => {
    if (selectedDocumentIds.length > 0) {
      const doc = documents.find(d => d.id === selectedDocumentIds[0]);
      if (doc) openShare(doc);
    }
  };

  const handleSelectDestination = (destination: 'downloads' | 'new') => {
    toast({
      title: "Folder selected",
      description: destination === 'downloads' ? "Selected Downloads folder" : "Selected New folder",
    });
  };

  const handleCreateFolder = () => {
    toast({
      title: "Creating folder",
      description: "Creating new folder",
    });
  };

  const handleUploadToDestination = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const formData = new FormData();

    fileList.forEach(file => {
      formData.append('files', file, (file as File & { relativePath?: string }).relativePath || file.name);
    });

    try {
      const response = await axios.post("/api/v2/upload", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s) successfully`,
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handleCloseSidebar = () => {
    setSelectedDocument(null);
    setPreviewUrl(null);
    setShowSidebar(false);
  };

  const getCategoryTitle = (type: CategoryType): string => {
    switch (type) {
      case 'all':
        return 'Все документы';
      case 'recent':
        return 'Недавние документы';
      case 'shared':
        return 'Общие документы';
      case 'favorites':
        return 'Избранные документы';
      case 'trash':
        return 'Корзина';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Drag and drop handlers for a dedicated drop area
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => c + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c - 1;
      if (next <= 0) {
        setIsDragging(false);
        return 0;
      }
      return next;
    });
  };

/** visible in the table / grid */
const visibleDocuments = React.useMemo(() => {
  const nonArchivedDocs = documents.filter(d => !d.archived);

  if (!folderId) {
    return nonArchivedDocs.filter(d => d.parent_id === null);
  }

  return nonArchivedDocs.filter(d => {
    if (d.parent_id == null) return false;
    return String(d.parent_id) === String(folderId);
  });
}, [documents, folderId]);


  const handleDragOverArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropArea = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragging(false);
    await handleDropWithFolders(e);
  };

  const toggleFavorite = useCallback(async (documentId: string) => {
    const docIndex = documents.findIndex(doc => doc.id === documentId);
    if (docIndex === -1) return;

    const prevStarred = documents[docIndex].starred;

    const updatedDocs = [...documents];
    updatedDocs[docIndex] = {
      ...updatedDocs[docIndex],
      starred: !prevStarred,
    };
    setDocuments(updatedDocs);

    try {
      const url = `/v2/metadata/${documentId}/star`;
      const response = await fetch(url, { method: 'PUT' });
      if (!response.ok) throw new Error('Toggle favorite failed');
      await response.json();
      toast({ title: 'Success', description: 'Favorite status updated', variant: 'default' });
      fetchDocuments();
    } catch (error) {
      const revertedDocs = [...documents];
      revertedDocs[docIndex] = {
        ...revertedDocs[docIndex],
        starred: prevStarred,
      };
      setDocuments(revertedDocs);
      toast({ title: 'Error', description: `Failed to update favorite status: ${error.message}`, variant: 'destructive' });
    }
  }, [documents, fetchDocuments]);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      case 'folder':
        return <Folder className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const searchableKeys = ['name', 'type', 'owner', 'modified',];

const searchDocuments = (documents: DocumentType[], query: string) => {
  return documents.filter(doc =>
    searchableKeys.some(key => {
      const value = doc[key as keyof typeof doc];
      if (Array.isArray(value)) {
        return value.some(val => val.toLowerCase().includes(query));
      }
      return typeof value === 'string' && value.toLowerCase().includes(query);
    })
  );
};

 // 🔄 replace your existing filteredDocuments declaration with this
const filteredDocuments = React.useMemo(() => {
  const q = searchQuery.trim().toLowerCase();

  // ── 1) no query  →  just show the current folder view
  if (q === '') return visibleDocuments;

  // ── 2) with query →  search in *all* docs, not only the visible ones
  return documents.filter(doc =>
    searchableKeys.some(key => {
      const val = doc[key as keyof Document];
      if (Array.isArray(val)) {
        return val.some(v => v.toLowerCase().includes(q));
      }
      return typeof val === 'string' && val.toLowerCase().includes(q);
    })
  );
}, [documents, visibleDocuments, searchQuery]);


const toBytes = (size: string): number => {
  const [num, unit = 'B'] = size.split(' ');
  const n = parseFloat(num);
  switch (unit) {
    case 'MB': return n * 1_048_576;
    case 'KB': return n * 1_024;
    default:   return isNaN(n) ? 0 : n; // «B» или «--»
  }
};

 const sortedDocuments = React.useMemo(() => {
  return [...filteredDocuments].sort((a, b) => {
    let valA: string | number = a[sortBy] as any;
    let valB: string | number = b[sortBy] as any;

    // особый случай — размер
    if (sortBy === 'size') {
      valA = toBytes(a.size);
      valB = toBytes(b.size);
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });
}, [filteredDocuments, sortBy, sortOrder]);
  const folderTreeData: TreeNode[] = React.useMemo(() => {
    const folders = documents.filter(doc => doc.type === 'folder');
    return buildTree(folders);
  }, [documents]);



  return (
 <div className="flex flex-col h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
    <div className=" border-b shrink-0 bg-white/90 backdrop-blur-sm shadow-sm">

        {/*</div><div className="flex items-center justify-between mb-4">*/}
        <PageHeader
          
          title={getCategoryTitle(category)}
          categoryType={category}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          
        />
      </div>
  {/* left pane: folder tree  <nav className="w-64 overflow-auto h-screen p-2">*/}
  
  

 <div className="flex flex-1 overflow-hidden bg-dots">
      <nav className="w-64 overflow-y-auto border-r bg-white p-2 shadow-inner">
     <EnhancedFolderTree
        data={folderTreeData}
        selectedId={folderId}
        onSelect={(id) => {
      // если кликнули по той же папке ─ снимаем выбор
       setFolderId(prev => (prev === id ? null : id));

    }}      onFileUpload={handleFileUpload}
            onShare={handleShareNode}
            />
  </nav>
      <div className="flex-1 p-4 overflow-y-auto relative bg-gray-50 bg-dots">
      {/* Header with Upload Button */}
      
    
      {/* Drag-and-drop overlay */}
      <div
        className={`fixed inset-0 z-50${isDragging ? '' : ' hidden'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOverArea}
        onDrop={handleDropArea}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100/50 border-4 border-dashed border-blue-400 flex items-center justify-center">
            <p className="text-lg font-semibold text-blue-600">Перетащите файлы для загрузки</p>
          </div>
        )}
      </div>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOverArea}
        onDrop={handleDropArea}
      >
        {viewMode === 'list' ? (
          <div className="mt-4 ">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedDocumentIds.length === filteredDocuments.length && filteredDocuments.length > 0}
                  onCheckedChange={handleSelectAll}
                  
                />
                   <span className="text-sm text-muted-foreground" >
    {selectedDocumentIds.length > 0
      ? `${selectedDocumentIds.length} selected`
      : `Showing ${filteredDocuments.length} items`}
  
                </span>
              </div>
               {selectedDocumentIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveSelected}
                    className="flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
                    </svg>
                    Архивировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareSelected}
                    className="flex items-center gap-2"
                  >
                    <Share className="h-4 w-4" />
                    Поделиться
                  </Button>
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedDocumentIds.length === filteredDocuments.length && filteredDocuments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                    Name {sortBy === 'name' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('description')} className="cursor-pointer">
                    Description {sortBy === 'description' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('version')} className="cursor-pointer">
                    Version {sortBy === 'version' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('size')} className="cursor-pointer">
                    Size {sortBy === 'size' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('modified')} className="cursor-pointer">
                    Last updated {sortBy === 'modified' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('owner')} className="cursor-pointer">
                    Updated by {sortBy === 'owner' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-4">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-4 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDocuments.map((document) => (
                    <TableRow 
                      key={document.id}
                      className="hover:bg-accent/50 cursor-pointer"
                      onClick={() => handleDocumentClick(document)}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedDocumentIds.includes(document.id)}
                          onCheckedChange={() => handleDocumentSelect(document)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {renderIcon(document.type)}
                          <span className="font-medium">{document.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">--</span>
                      </TableCell>
                      <TableCell>
                        {document.type === 'folder' ? (
                          <span className="text-muted-foreground">--</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            V1
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{document.size}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {format(new Date(document.modified), 'MMM d, yyyy HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-medium">
                            MS
                          </div>
                          <span className="text-sm">Madiyar Saduakas</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openShare(document);
                        }}
                        className="h-8 w-8"
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                            <DropdownMenuItem onClick={() => handlePreviewFile(document)}>
                              Просмотр
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadFile(document)}>
                              Скачать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openShare(document)}>
                              Поделиться
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.archived ? handleUnarchiveDocument(document) : handleArchiveDocument(document)}>
                              {document.archived ? 'Разархивировать' : 'Архивировать'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFavorite(document)}>
                              {document.starred ? 'Убрать из избранного' : 'Добавить в избранное'}
                            </DropdownMenuItem> 
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteDocument(document)}
                            >
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
        ) : (
          <div className="mt-4 animate-fade-in">
            <DocumentGrid
              documents={documents}
              onDocumentClick={handleDocumentClick}
              onDocumentPreview={handlePreviewFile}
              viewMode={viewMode}
              selectedDocument={selectedDocument}
              onDocumentSelect={handleDocumentSelect}
              multipleSelection={true}
              selectionActions={{
                selectedIds: selectedDocumentIds,
                onSelectAll: handleSelectAll,
                onClearSelection: handleClearSelection,
                onDeleteSelected: handleDeleteSelected,
                onDownloadSelected: handleDownloadSelected,
                onShareSelected: handleShareSelected,
                onArchiveSelected: handleArchiveSelected
              }}
              toggleFavorite={toggleFavorite}
            />
          </div>
        )}
      </div>          </div>

      {isShareOpen && shareDoc && (
        <ShareModal
          document={shareDoc}
          onClose={() => setIsShareOpen(false)}
        />
      )}
      {previewUrl && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <button
            className="absolute top-4 right-4 z-60 bg-white rounded-full p-2 shadow hover:bg-gray-200"
            onClick={() => { setPreviewUrl(null); }}
          >
            <span className="sr-only">Закрыть предпросмотр</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {selectedDocument.type === 'pdf' ? (
            <iframe
              src={`${previewUrl}#toolbar=0`}
              className="w-[90vw] h-[90vh] bg-white rounded shadow-xl"
              title={selectedDocument.name}
            />
          ) : selectedDocument.type === 'image' ? (
            <img
              src={previewUrl}
              alt={selectedDocument.name}
              className="max-h-[90vh] max-w-[90vw] rounded shadow-xl bg-white"
            />
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-white mb-4">Предпросмотр</div>
              <iframe
                src={previewUrl}
                className="w-[1000px] h-[90vh] border-none"
                allowFullScreen
                title={selectedDocument.name || 'Document Preview'}
              />
            </div>
          )}
        </div>
      )}
      {/* Metadata sidebar only if not previewing */}
      {!previewUrl && showSidebar && selectedDocument && (
       <div className="w-128 border bg-gradient-to-b from-gray-50 via-white to-gray-100 fixed right-0 top-56 h-full z-40 shadow-lg rounded-l-xl">
          <MetadataSidebar
            document={selectedDocument}
            previewUrl={previewUrl}
            onClose={handleCloseSidebar}
            onDownload={selectedDocument ? () => handleDownloadFile(selectedDocument) : undefined}
            onDelete={selectedDocument ? () => handleDeleteDocument(selectedDocument) : undefined}
            onUpdateMetadata={handleUpdateMetadata}
            token={token}
          />
        </div>
        
      )}
      </div>
     
    </div>
  );
};

export default Index;
