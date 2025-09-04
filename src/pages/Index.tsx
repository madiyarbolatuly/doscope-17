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
import { createFolderApi } from "@/hooks/folders";

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
  is_archived?: boolean;      
  is_favourited?: boolean;   
  deleted_at?: string | null; 
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
// current selected project (top-level folder)
const [projectRootId, setProjectRootId] = useState<string | null>(() =>
  localStorage.getItem("projectRootId")
);

// helper to keep state + storage in sync
const setCurrentProject = (id: string | null) => {
  setProjectRootId(id);
  if (id) localStorage.setItem("projectRootId", id);
  else localStorage.removeItem("projectRootId");
};

  
// projects = top-level folders (parent_id === null)
const projects = useMemo(
  () =>
    documents
      .filter(d => d.type === "folder" && d.parent_id === null)
      .map(d => ({ id: d.id, name: d.name, userEmail: "" })), // fill email if you have it
  [documents]
);

  // Синхронизируем выбранную папку с URL. Сначала ищем параметр ?folderId=...,
  // если его нет – пытаемся извлечь идентификатор из пути /folder/{id}.
  useEffect(() => {
    if (!folderId && projectRootId) {
      navigate(`/?folderId=${projectRootId}`);
      setFolderId(projectRootId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectRootId]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
  
    // util: keep only nodes in the subtree of rootId (client-side fallback)
    const filterSubtree = (rows: BackendDocument[], rootId: string) => {
      const want = new Set<string>([String(rootId)]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const r of rows) {
          const pid = r.parent_id != null ? String(r.parent_id) : null;
          if (pid && want.has(pid) && !want.has(String(r.id))) {
            want.add(String(r.id));
            changed = true;
          }
        }
      }
      return rows.filter(
        (r) => want.has(String(r.id)) || (r.parent_id && want.has(String(r.parent_id)))
      );
    };
  
    const tryFetch = async (params: Record<string, string>) => {
      const qs = new URLSearchParams({ limit: "1400", offset: "0", ...params });
      const res = await fetch(`/api/v2/metadata?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      return (Array.isArray(data?.documents) ? data.documents : []) as BackendDocument[];
    };
  
    try {
      let rows: BackendDocument[] = [];
      if (!projectRootId) {
        rows = await tryFetch({ recursive: "true" });
      } else {
        rows = await tryFetch({ recursive: "true", ancestor_id: String(projectRootId) });
        // 👇 include root-level too
        rows = rows.concat(await tryFetch({ parent_id: null }));
      }
      
   
      // ⬇️ NEW: drop archived & deleted items before mapping
      const isArchived = (r: BackendDocument) =>
        r.is_archived === true || r.status === "archived";
  
      const isDeleted = (r: BackendDocument) =>
        !!r.deleted_at || r.status === "deleted";
  
      rows = rows.filter((r) => !isArchived(r) && !isDeleted(r));
  
      const mapped: Document[] = rows.map((doc) => ({
        id: String(doc.id),
        // ⬇️ don't decode: names may not be percent-encoded
        name: doc.name || "Unnamed Document",
        type:
          doc.file_type === "folder"
            ? "folder"
            : doc.file_type?.includes("pdf")
            ? "pdf"
            : doc.file_type?.includes("doc")
            ? "doc"
            : doc.file_type?.includes("xls")
            ? "xlsx"
            : doc.file_type?.includes("pptx")
            ? "pptx"
            : doc.file_type?.includes("ppt")
            ? "ppt"
            : doc.file_type?.includes("png")
            ? "png"
            : doc.file_type?.includes("image")
            ? "image"
            : doc.file_type?.includes("zip")
            ? "zip"
            : doc.file_type?.includes("rar")
            ? "rar"

            : "file",
        size:
          doc.file_type === "folder"
            ? "--"
            : doc.size != null
            ? `${(Number(doc.size) / (1024 * 1024)).toFixed(2)} MB`
            : "Unknown",
        modified: doc.created_at,
        owner: doc.owner_id,
        category: doc.categories?.[0] || "uncategorized",
        path: doc.file_path ?? null,
        tags: doc.tags || [],
        parent_id: doc.parent_id != null ? String(doc.parent_id) : null,
        archived: isArchived(doc),          // will be false for the kept rows
        starred: Boolean(doc.is_favourited) // preserve favourite if backend returns it
      }));
  
      setDocuments(mapped);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Ошибка загрузки",
        description: `Метаданные не получены (${e?.message ?? "unknown"}).`,
        variant: "destructive",
      });
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, projectRootId, toast]);
  
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  const isOfficeEditable = (doc: Document) =>
    ['docx', 'xlsx', 'pptx', 'ppt'].includes(doc.type);
  
// guess the ext for the OnlyOffice config
const guessOnlyOfficeExt = (doc: Document): 'docx' | 'xlsx' | 'pptx' => {
  const lower = (doc.name || '').toLowerCase();
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.xlsx')) return 'xlsx';
  if (lower.endsWith('.pptx')) return 'pptx';
  // fallback from your mapped `type`
  if (doc.type === 'xlsx') return 'xlsx';
  if (doc.type === 'pptx' || doc.type === 'ppt') return 'pptx';
  return 'docx';
};

const handleEdit = (doc: Document) => {
  console.log('[handleEdit]', doc.id, doc.name);

  if (!isOfficeEditable(doc)) return;
  const ext = guessOnlyOfficeExt(doc);

  const search = new URLSearchParams({
    ext,
    title: doc.name,
  }).toString();

  navigate(`/edit/${encodeURIComponent(doc.id)}?${search}`);
};



  const openShare = (doc: Document) => {
    setShareDoc(doc);
    setIsShareOpen(true);
   };



  // Preview document
  async function uploadFilesInBatches(
    files: File[],
    token: string,
    batchSize = 20,
    concurrency = 3
  ) {
    const queue: Promise<any>[] = [];
  
    for (let i = 0; i < files.length; i += batchSize) {
      const chunk = files.slice(i, i + batchSize);
      const formData = new FormData();
      chunk.forEach(file => {
        formData.append("files", file, (file as any).relativePath || file.webkitRelativePath || file.name);
      });
      const url = folderId
      ? `/api/v2/upload-folder-bulk?parent_id=${folderId}`
      : (projectRootId
          ? `/api/v2/upload-folder-bulk?parent_id=${projectRootId}`
          : `/api/v2/upload-folder-bulk`);
  
      const req = axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
          onUploadProgress: (p) => {
            const percent = p.total ? Math.round((p.loaded * 100) / p.total) : 0;
            console.log(`Batch ${i / batchSize + 1} progress: ${percent}%`);
          },
        }
      );
      
      queue.push(req);
  
      if (queue.length >= concurrency) {
        await Promise.all(queue);
        queue.length = 0;
      }
    }
  
    if (queue.length > 0) {
      await Promise.all(queue);
    }
  }
  

  const handleFileUpload = async (files: File[], folderId?: string) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, (file as any).relativePath || file.webkitRelativePath || file.name);
    });

    try {
      const url = folderId
      ? `/api/v2/upload-folder-bulk?parent_id=${folderId}`
      : (projectRootId
          ? `/api/v2/upload-folder-bulk?parent_id=${projectRootId}`
          : `/api/v2/upload-folder-bulk`);
    
    const response = await axios.post(url, formData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
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
    // Helper to try multiple endpoints (ID → name → path → file route)
    const buildCandidates = () => {
      const byId = document.id ? [`/api/v2/preview/${encodeURIComponent(document.id)}`] : [];
      const byName = document.name ? [
        `/api/v2/preview/name/${encodeURIComponent(document.name)}`,
        `/api/v2/preview/${encodeURIComponent(document.name)}`,
        `/api/v2/file/${encodeURIComponent(document.name)}/preview`,
      ] : [];
      const byPath = document.path ? [
        `/api/v2/preview?path=${encodeURIComponent(document.path)}`,
        `/api/v2/file/preview?path=${encodeURIComponent(document.path)}`
      ] : [];
      return [...byId, ...byName, ...byPath];
    };
  
    const candidates = buildCandidates();
    if (candidates.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Нет доступного идентификатора для предпросмотра',
        variant: 'destructive',
      });
      return;
    }
  
    try {
      // Revoke any previous URL to avoid memory leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl);
  
      let blob: Blob | null = null;
      let lastStatus = 0;
      let lastUrl = '';
  
      for (const url of candidates) {
        lastUrl = url;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        lastStatus = res.status;
  
        if (res.ok) {
          // Some servers send JSON with a signed URL; handle that too
          const ct = (res.headers.get('content-type') || '').toLowerCase();
          if (ct.includes('application/json')) {
            try {
              const data = await res.json();
              if (data?.url) {
                setPreviewUrl(data.url); // direct signed URL
                setSelectedDocument(document);
                setShowSidebar(true);
                return;
              }
            } catch {
              /* fall through to blob */
            }
          }
          blob = await res.blob();
          break;
        }
  
        // For 404 specifically, try next candidate; for other errors break early
        if (res.status !== 404) break;
      }
  
      if (!blob) {
        throw new Error(`Preview fetch failed (${lastStatus}) via ${lastUrl}`);
      }
  
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setSelectedDocument(document);
      setShowSidebar(true);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Ошибка предпросмотра',
        description:
          typeof err?.message === 'string' ? err.message : 'Не удалось загрузить предпросмотр',
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
    await uploadFilesInBatches(filesToUpload, token!, 25, 3); 

    // ✅ Refresh after upload
    fetchDocuments();
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
      navigate(`/?folderId=${document.id}`);
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

  // Use "starred" consistently in your Document shape
const handleToggleFavorite = async (doc: Document) => {
  const idx = documents.findIndex(d => d.id === doc.id);
  if (idx === -1) return;

  // optimistic UI
  const prev = documents[idx].starred ?? false;
  const nextDocs = [...documents];
  nextDocs[idx] = { ...nextDocs[idx], starred: !prev };
  setDocuments(nextDocs);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  // Server expects NAME, not ID. Try both base paths in case you have a proxy.
  const candidates = [
    
    `/api/v2/metadata/${doc.id}/star`,
  ];

  try {
    let ok = false;
    let lastStatus = 0;

    for (const url of candidates) {
      const res = await fetch(url, { method: 'PUT', headers });
      lastStatus = res.status;
      if (res.ok) { ok = true; break; }
      if (![404, 405].includes(res.status)) break; // real error → stop trying
    }

    if (!ok) {
      // revert
      const reverted = [...documents];
      reverted[idx] = { ...reverted[idx], starred: prev };
      setDocuments(reverted);
      throw new Error(`Toggle failed (status ${lastStatus}). Ensure the API exposes PUT /v2/metadata/{name}/star on port 8080 or proxy to it.`);
    }
  } catch (e: any) {
    const reverted = [...documents];
    reverted[idx] = { ...reverted[idx], starred: prev };
    setDocuments(reverted);
    toast({
      title: 'Ошибка',
      description: e?.message || 'Не удалось обновить избранное',
      variant: 'destructive',
    });
  }
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
const visibleDocuments = useMemo(() => {
  const inScope = documents.filter(d => !d.archived); // docs are already limited to the project
  if (!folderId) return inScope.filter(d => d.parent_id === null); // show project root
  return inScope.filter(d => d.parent_id === String(folderId));
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

 // 🔄 replace your existing filteredDocuments declaration with this
 const filteredDocuments = React.useMemo(() => {
  const base = visibleDocuments;                      // ⟵ use only the current folder's items
  const q = searchQuery.trim().toLowerCase();
  if (!q) return base;

  return base.filter(doc =>
    ['name','type','owner','modified'].some((key) => {
      const v = (doc as any)[key];
      if (Array.isArray(v)) return v.some((s) => String(s).toLowerCase().includes(q));
      return typeof v === 'string' && v.toLowerCase().includes(q);
    })
  );
}, [visibleDocuments, searchQuery]);



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
    // 1. Сначала сравнение по типу: папки всегда выше
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    // 2. Внутри группы сортировка по выбранному полю
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
  // build relationships using all docs first
  const full = buildTree(documents);
  // then remove files from the rendered tree
  const stripFiles = (nodes: TreeNode[] = []): TreeNode[] =>
    nodes
      .filter(n => n.type === 'folder')
      .map(n => ({ ...n, children: stripFiles(n.children || []) }));
  return stripFiles(full);
}, [documents]);

const handleTreeAction = async (action: string, nodeId: string, data?: any) => {
  // Special case: creating a root folder uses parent_id = null
  const isRoot = nodeId === 'root';
  const node = documents.find(d => d.id === nodeId);

  // Axios instance-like headers
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' as const };

  try {
    switch (action) {
      // ---------- core metadata via PUT /api/v2/metadata/:id ----------
      case 'rename': {
        if (!node) return { ok: false, message: 'Узел не найден' };
        const newName = data?.newName?.trim();
        if (!newName) return { ok: false, message: 'Нет нового имени' };

        await axios.put(`/api/v2/metadata/${nodeId}`, { name: newName }, { headers });
        await fetchDocuments();
        return { ok: true, message: 'Переименовано' };
      }

      case 'move': {
        if (!node) return { ok: false, message: 'Узел не найден' };
        // null → в корень
        const targetFolderId = data?.targetFolderId ?? null;
        await axios.put(`/api/v2/metadata/${nodeId}`, { parent_id: targetFolderId }, { headers });
        await fetchDocuments();
        return { ok: true, message: 'Перемещено' };
      }

      // ---------- create subfolder ----------
      case "create-subfolder": {
        const folderName: string = data?.folderName?.trim();
        if (!folderName) return { ok: false, message: "Имя папки пустое" };

        // root => null, otherwise convert to number
        const parent_id =
          nodeId === "root" ? null : Number(nodeId);

        if (parent_id !== null && Number.isNaN(parent_id)) {
          return { ok: false, message: "Некорректный ID папки" };
        }

        await createFolderApi(token, { name: folderName, parent_id });
        await fetchDocuments();
        return { ok: true, message: "Папка создана" };
      }
      // ---------- share / download ----------
      case 'share': {
        if (!node) return { ok: false, message: 'Узел не найден' };
        handleShareNode(nodeId);
        return { ok: true };
      }

      case 'download': {
        if (!node) return { ok: false, message: 'Узел не найден' };
        await handleDownloadFile(node);
        return { ok: true };
      }

      // ---------- archive / favorite / delete (use your existing helpers) ----------
      case 'archive': {
        if (!node) return { ok: false, message: 'Узел не найден' };
        await handleArchiveDocument(node);
        return { ok: true, message: 'В архиве' };
      }

      case 'favorite': {
        const doc = documents.find(d => d.id === nodeId);
        if (!doc) return { ok: false, message: 'Документ не найден' };
        await handleToggleFavorite(doc);
        return { ok: true, message: 'Избранное обновлено' };
      }

      case 'delete': {
        if (!node) return { ok: false, message: 'Узел не найден' };
        await handleDeleteDocument(node);
        return { ok: true, message: 'Удалено' };
      }

      // ---------- not implemented ----------
      case 'upload':
      default:
        return false; // the row will show a "not implemented" toast
    }
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Ошибка' };
  }
};

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

  // ✅ NEW
  projects={projects}
  selectedProjectId={projectRootId}
  onProjectChange={(id) => {
    setCurrentProject(id);
    setFolderId(id);
    navigate(`/?folderId=${id}`);
    // If your API supports server-side scoping (e.g., ?root_id=),
    // you could trigger fetchDocuments() that queries only that tree.
  }}
/>

      </div>
  {/* left pane: folder tree  <nav className="w-64 overflow-auto h-screen p-2">*/}
  
  

 <div className="flex flex-1 overflow-hidden bg-dots">
  <nav className="w-64 overflow-y-auto border-r bg-white p-2 shadow-inner">
  <EnhancedFolderTree
  data={folderTreeData}
  selectedId={folderId}
  onSelect={(id) => {
    setFolderId(prev => (prev === id ? null : id));
    if (id) navigate(`/?folderId=${id}`); else navigate(`/`);
  }}
  onFileUpload={handleFileUpload}
  onAction={handleTreeAction}
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
                        <div className={`flex items-center gap-3 ${document.type === 'folder' ? 'text-blue-600 font-semibold' : ''}`}>
                          {renderIcon(document.type)}
                          <span className="font-medium">
                            {document.type === 'folder' ? `${document.name}/` : document.name}
                          </span>
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
                          {document.modified
                            ? format(new Date(document.modified), "dd.MM.yyyy HH:mm")
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-medium">
                            a
                          </div>
                          <span className="text-sm">akmaral.alibekova</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                          {document.type !== 'folder' &&
                            <DropdownMenuItem onClick={() => handlePreviewFile(document)}>
                              Просмотр
                            </DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => handleDownloadFile(document)}>
                              Скачать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openShare(document)}>
                              Поделиться
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.archived ? handleUnarchiveDocument(document) : handleArchiveDocument(document)}>
                              {document.archived ? 'Разархивировать' : 'Архивировать'}
                            </DropdownMenuItem>
                            {document.type !== 'folder' && (
                             <DropdownMenuItem
                             onSelect={(e) => {
                               e.preventDefault();    // keep the menu from stealing focus
                               e.stopPropagation();   // avoid row onClick
                               handleEdit(document);  // navigate to /edit/:id?ext=...&title=...
                             }}
                           >
                             Редактировать
                           </DropdownMenuItem>
                          
                            )}
                            <DropdownMenuItem onClick={() => toggleFavorite(document.name)}>
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
              documents={sortedDocuments}     // ⟵ was `documents`
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
            onToggleFavorite={handleToggleFavorite}   // ✅ pass down
            token={token}
          />

        </div>
        
      )}
      </div>
     
    </div>
  );
};

export default Index;
