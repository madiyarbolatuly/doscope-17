import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShareModal } from '@/components/ShareModal';
import { buildTree, TreeNode } from '@/utils/buildTree';
import { Button } from '@/components/ui/button';
import { Share } from "lucide-react";
import { archiveDocument, unarchiveDocument, getArchivedDocuments, toggleStar, renameDocument, deleteDocument } from '@/services/archiveService';
import { durableUploadFolder } from "@/services/durableUpload";
import { FOLDERS_ENDPOINTS } from '@/config/api';

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, File, FileSpreadsheet, FileImage, Folder, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentMeta } from "@/hooks/useDocuments";
import { DOCUMENT_ENDPOINTS } from '@/config/api';
import { buildDwgOpenUrl } from "@/utils/openInAcad";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnhancedFolderTree } from '@/components/EnhancedFolderTree';
import { useLocation } from 'react-router-dom';
import { API_ROOT } from '@/config/api';


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

interface UploadStats {
  totalBytes: number;
  uploadedBytes: number;
  startedAt: number;
  speedBps: number;
  etaSec: number;
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
  const treeData: TreeNode[] = React.useMemo(() => buildTree(documents), [documents]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [folderId, setFolderId] = useState<string | null>(null);
  const location = useLocation();
  const [folders, setFolders] = useState<Document[]>([]); // holds folders for the tree
  const PAGE_SIZE = 100;
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [overallPct, setOverallPct] = useState(0);
  const abortRef = React.useRef<AbortController | null>(null);
  const reqSeq = React.useRef(0);
  const qs = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    recursive: "false",
    ...(folderId ? { parent_id: String(folderId) } : {}),
  });
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
useEffect(() => {
  const q = new URLSearchParams(location.search);
  const fid = q.get("folderId");       // string | null

  if (fid !== null) {
    // explicit folder in URL wins
    if (fid !== folderId) setFolderId(fid);
    return;
  }

  // no folderId in URL → if we have saved projectRootId, go there
  if (folderId == null && projectRootId) {
    navigate(`/?folderId=${projectRootId}`, { replace: true });
    setFolderId(projectRootId);
  } else if (folderId === undefined) {
    // first mount, no project root → show root `/`
    setFolderId(null);
  }
}, [location.search, projectRootId, navigate]); // ← note: no folderId here to avoid loops

const makeOptimisticDocs = (files: File[], parentId: string | null): Document[] =>
  files.map((f, i) => ({
    id: `temp:${Date.now()}:${i}`,
    name: (f as any).relativePath || f.name,             // для folder upload берём относительный путь
    type: 'file',                                        // можно уточнять по f.type (mime)
    size: `${(f.size/(1024*1024)).toFixed(2)} MB`,
    modified: new Date().toISOString(),
    owner: 'me',
    category: 'uncategorized',
    path: null,
    tags: [],
    parent_id: parentId,
    archived: false,
    starred: false,
  
    uploading: true,
  }));

const [isUploading, setIsUploading] = useState(false);
const [uploadStats, setUploadStats] = useState({
  totalBytes: 0,
  uploadedBytes: 0,
  startedAt: 0,
  speedBps: 0,
  etaSec: 0,
});
const clearFolderSelection = useCallback(() => {
  setFolderId(null);
  setCurrentProject(null);           // у тебя уже есть этот хелпер
  navigate("/", { replace: true });  // убираем ?folderId=...
}, [navigate]);

const mapBackendDoc = (doc: DocumentMeta): Document => ({
  id: String(doc.id),
  name: doc.name || "Unnamed Document",
  type:
    doc.file_type === "folder" ? "folder" :
    doc.file_type?.includes("pdf") ? "pdf" :
    doc.file_type?.includes("doc") ? "doc" :
    doc.file_type?.includes("xls") ? "xlsx" :
    doc.file_type?.includes("pptx") ? "pptx" :
    doc.file_type?.includes("ppt") ? "ppt" :
    doc.file_type?.includes("png") ? "png" :
    doc.file_type?.includes("image") ? "image" :
    doc.file_type?.includes("zip") ? "zip" : "file",
  size: doc.file_type === "folder"
    ? "--"
    : doc.size != null
      ? `${(Number(doc.size)/(1024*1024)).toFixed(2)} MB`
      : "Unknown",
  modified: doc.created_at,
  owner: doc.owner_id,
  category: doc.categories?.[0] || "uncategorized",
  path: doc.file_path ?? null,
  tags: doc.tags || [],
  parent_id: doc.parent_id ? String(doc.parent_id) : null,

  archived: Boolean(doc.is_archived),
  starred: Boolean(doc.is_favourited),
});


const formatBytes = (n: number) => {
  if (!n) return "0 B";
  const u = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(n)/Math.log(1024));
  return `${(n/Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
};
const formatDuration = (s: number) => {
  if (!isFinite(s) || s <= 0) return "—";
  const m = Math.floor(s/60), sec = Math.floor(s%60);
  return m ? `${m}м ${sec}с` : `${sec}с`;
};


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
useEffect(() => {
  if (isLoading) return;
  if (!projectRootId) return;

  const exists = documents.some(d => d.id === projectRootId && d.type === 'folder');
  if (!exists) {
    clearFolderSelection();
    toast({
      title: "Проект недоступен",
      description: "Сохранённая корневая папка больше не существует.",
    });
  }
}, [isLoading, documents, projectRootId, clearFolderSelection]);

const tryFetch = useCallback(async () => {
  const qs = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    recursive: "false",
  });

  if (folderId != null) qs.set("parent_id", String(folderId));
  if (projectRootId) qs.set("root_id", String(projectRootId)); // ⟵ ДОБАВИТЬ

  const controller = new AbortController();
  abortRef.current = controller;

  const res = await fetch(`/api/v2/metadata?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: controller.signal,
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  const rows = Array.isArray(data?.documents) ? data.documents : [];
  const total = typeof data?.total_count === "number" ? data.total_count : rows.length;
  return { rows, total };
}, [PAGE_SIZE, offset, folderId, projectRootId, token]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!hasMore) return;        // keep this
    if (isLoading) return;       // now safe because we abort on folder change
  
    setIsLoading(true);
    const mySeq = ++reqSeq.current;
  
    try {
      const { rows, total } = await tryFetch();
  
      // map/filter
      const isArchived = (r: DocumentMeta) => r.is_archived === true || r.status === "archived";
      const isDeleted  = (r: DocumentMeta) => !!r.deleted_at || r.status === "deleted";
      const filtered = rows.filter((r: DocumentMeta) => !isArchived(r) && !isDeleted(r));
      const mapped: Document[] = filtered.map(mapBackendDoc);
  
      // ignore stale response (aborted or superseded by newer folderId/offset)
      if (mySeq !== reqSeq.current) return;
  
      // append if offset > 0, replace if offset === 0
      setDocuments(prev => offset === 0 ? mapped : [...prev, ...mapped]);
  
      if (totalCount === null) setTotalCount(total);
      setHasMore(offset + rows.length < total);  // compute purely; do NOT setOffset here
    } catch (e: unknown) {
      if ((e as any)?.name === 'AbortError') return; // user navigated, ignore
      console.error(e);
      toast({
        title: "Ошибка загрузки",
        description: `Метаданные не получены (${e instanceof Error ? e.message : "unknown"}).`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, offset, totalCount, tryFetch, toast]);
  


// 1) Синхронизируем folderId с projectRootId
useEffect(() => {
  if (!folderId && projectRootId) {
    navigate(`/?folderId=${projectRootId}`);
    setFolderId(projectRootId);
  }
}, [projectRootId, folderId, navigate]);
// сбрасываем список при смене папки
useEffect(() => {
  // allow root: folderId can be null; we still reset
  // abort the previous request so it can't finish late
  if (abortRef.current) {
    abortRef.current.abort();
    abortRef.current = null;
  }
  setIsLoading(false);   // ← IMPORTANT so the next fetch can start immediately
  setDocuments([]);
  setOffset(0);
  setTotalCount(null);
  setHasMore(true);
}, [folderId]);

// главный загрузчик
useEffect(() => {
  if (folderId === undefined) return; // not initialized yet
  fetchDocuments();
}, [folderId, offset, fetchDocuments]);

// 3) Проверка, что папка существует
useEffect(() => {
  if (!folderId) return;
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(
       DOCUMENT_ENDPOINTS.METADATA_DETAIL(String(folderId)),
       {
         headers: {
           Authorization: `Bearer ${token}`,
           Accept: "application/json",
         },
         signal: controller.signal,   // allow cancel
       }
     );
     // treat 404 as “not found”, and 409 as “conflict / inaccessible”
     if (!res.ok && (res.status === 404 || res.status === 409)) {
        toast({
          title: "Папка не найдена",
          description: `ID ${folderId} недействителен. Возвращаемся в корень.`,
          variant: "destructive",
        });
        clearFolderSelection();
      }
    } catch (err) {
       if ((err as any)?.name === "AbortError") return;  // aborted
    }
  })();

}, [folderId, token, clearFolderSelection]);


  
  
useEffect(() => {
  const onScroll = () => {
    if (!hasMore || isLoading) return;
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
    if (nearBottom) {
      setOffset(prev => prev + PAGE_SIZE);   // ← trigger loader effect
    }
  };
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}, [hasMore, isLoading, PAGE_SIZE]);

  
  const isOfficeEditable = (doc: Document) =>
    ['docx', 'xlsx', 'pptx', 'ppt'].includes(doc.type);
  
 // stays as a global fetch; re-run if project scope changes
const fetchFolderTree = useCallback(async () => {
  const qs = new URLSearchParams({
    limit: "100000",
    offset: "0",
    recursive: "true",
    only_folders: "true",
    // if your backend supports scoping by project:
    ...(projectRootId ? { root_id: String(projectRootId) } : {}),
  });

  const res = await fetch(`/api/v2/metadata?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();

  const mapped: Document[] = (data.documents || [])
    .map(mapBackendDoc)
    .filter(d => d.type === "folder");

  setFolders(mapped);
}, [token, projectRootId]);

useEffect(() => { fetchFolderTree(); }, [fetchFolderTree]);


  
  
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

   const handleFileUpload = async (files: File[], destFolderId?: string) => {
    if (!files?.length) return;
  
    const totalBytes = files.reduce((a, f) => a + (f.size || 0), 0);
    setIsUploading(true);
    setUploadStats({ totalBytes, uploadedBytes: 0, startedAt: Date.now(), speedBps: 0, etaSec: 0 });
  
    try {
      await durableUploadFolder(
        files,
        token!,
        { base: "/api/v2", folderId: destFolderId ?? folderId ?? undefined, projectRootId },
        {
          targetBatchMB: 100,
          maxFilesPerBatch: 250,
          concurrency: 3,
          timeoutMs: 10 * 60 * 1000,
          onProgress: (pct) => {
            setOverallPct(pct);
            setUploadStats(prev => {
              const uploadedBytes = Math.round(totalBytes * (pct / 100));
              const elapsedSec = (Date.now() - (prev.startedAt || Date.now())) / 1000;
              const speedBps = elapsedSec > 0 ? uploadedBytes / elapsedSec : 0;
              const remaining = Math.max(totalBytes - uploadedBytes, 0);
              const etaSec = speedBps > 0 ? Math.ceil(remaining / speedBps) : 0;
              return { ...prev, uploadedBytes, speedBps, etaSec };
            });
          }
        }
      );
      toast({ title: "Успех", description: `Загружено: ${files.length} файл(ов)` });
      await hardReloadDocuments(); 
    } catch (err: unknown) {
      console.error(err);
      toast({ title: "Ошибка загрузки", description: err instanceof Error ? err.message : "Не удалось загрузить файлы", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setOverallPct(0);
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
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: 'Ошибка предпросмотра',
        description:
          err instanceof Error ? err.message : 'Не удалось загрузить предпросмотр',
        variant: 'destructive',
      });
    }
  };
  

  function filenameFromDisposition(h: Headers, fallback: string) {
    const cd = h.get("content-disposition") || "";
    // examples: attachment; filename="foo.pdf"; filename*=UTF-8''foo.pdf
    const mStar = cd.match(/filename\*\s*=\s*[^']*''([^;]+)/i);
    if (mStar) {
      try { return decodeURIComponent(mStar[1]); } catch {}
    }
    const m = cd.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i);
    if (m) return (m[1] || m[2] || "").trim();
    return fallback;
  }const handleDownloadFile = async (doc: Document) => {
    try {
      // Prefer download by numeric ID (server zips folders automatically)
      const candidates: string[] = [
        `/api/v2/file/${encodeURIComponent(doc.id)}/download`,               // by id  (file OR folder→zip)
        `/api/v2/file/${encodeURIComponent(doc.name)}/download`,             // by name (if still supported)
        doc.path ? `/api/v2/file/download?path=${encodeURIComponent(doc.path)}` : ""
      ].filter(Boolean);
  
      let lastStatus = 0, lastUrl = "";
  
      for (const url of candidates) {
        lastUrl = url;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "*/*",
          },
        });
  
        lastStatus = res.status;
        if (!res.ok) {
          // 404 → try next strategy; any other error → stop
          if (res.status === 404) continue;
          break;
        }
  
        // If server ever returns a JSON with a signed URL, handle it:
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json")) {
          const data = await res.json().catch(() => null);
          const directUrl = typeof data === "string" ? data : data?.url;
          if (!directUrl) throw new Error("Пустой ответ при скачивании.");
          const a = document.createElement("a");
          a.href = directUrl;
          a.download = doc.name; // fallback if server doesn’t set Content-Disposition
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast({ title: "Скачивание", description: `Начато: ${doc.name}` });
          return;
        }
  
        // Normal case: stream returned (file or zip)
        const blob = await res.blob();
        // Use server-provided filename if present (respects folder→zip naming)
        const suggested = filenameFromDisposition(res.headers, doc.name);
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = suggested;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
  
        toast({ title: "Скачивание", description: `Начато: ${suggested}` });
        return;
      }
  
      throw new Error(`Download failed (${lastStatus}) via ${lastUrl}`);
    } catch (e: unknown) {
      console.error(e);
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось скачать",
        variant: "destructive",
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
          (file as any).relativePath = path + file.name;
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
      
    }});
  };

  const handleDropWithFolders = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  
    const filesToUpload: File[] = [];
    const items = e.dataTransfer?.items;
  
    // извлекаем файлы + заполняем relativePath (как у вас было)
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const dtItem = items[i];
        const entry =
          typeof (dtItem as DataTransferItem).webkitGetAsEntry === 'function'
            ? (dtItem as DataTransferItem).webkitGetAsEntry()
            : undefined;
        if (entry) {
          await traverseFileTree(entry, '', filesToUpload);
        } else {
          const file = dtItem.getAsFile?.();
          if (file) {
            (file as any).relativePath = (file as any).webkitRelativePath || file.name;
            filesToUpload.push(file);
          }
        }
      }
    }
  
    if (filesToUpload.length === 0) {
      const fallback = Array.from(e.dataTransfer.files || []);
      fallback.forEach((file) => {
        (file as any).relativePath = (file as any).webkitRelativePath || file.name;
      });
      filesToUpload.push(...fallback);
    }
    if (filesToUpload.length === 0) return;
  
    // ---------- OPTIMISTIC UI: показать сразу в текущей папке ----------
    const optimistic = makeOptimisticDocs(filesToUpload, folderId ? String(folderId) : null);
    setDocuments(prev => [...optimistic, ...prev]);
  
    // ---------- реальная загрузка (как у вас было) ----------
    const totalBytes = filesToUpload.reduce((a, f) => a + (f.size || 0), 0);
    setIsUploading(true);
    setUploadStats({
      totalBytes,
      uploadedBytes: 0,
      startedAt: Date.now(),
      speedBps: 0,
      etaSec: 0,
    });
  
    try {
      await durableUploadFolder(
        filesToUpload,
        token!,
        { base: '/api/v2', folderId: folderId ?? undefined, projectRootId },
        {
          targetBatchMB: 100,
          maxFilesPerBatch: 250,
          concurrency: 3,
          timeoutMs: 10 * 60 * 1000,
          onProgress: (pct) => {
            setOverallPct(pct);
            setUploadStats(prev => {
              const uploadedBytes = Math.round(totalBytes * (pct / 100));
              const elapsedSec = (Date.now() - (prev.startedAt || Date.now())) / 1000;
              const speedBps = elapsedSec > 0 ? uploadedBytes / elapsedSec : 0;
              const remaining = Math.max(totalBytes - uploadedBytes, 0);
              const etaSec = speedBps > 0 ? Math.ceil(remaining / speedBps) : 0;
              return { ...prev, uploadedBytes, speedBps, etaSec };
            });
          }
        }
      );
  
      toast({ title: "Успех", description: `Загружено: ${filesToUpload.length} файл(ов)` });
  
      // ---------- жёсткий рефетч, чтобы подхватить реальные id/метаданные ----------
      await hardReloadDocuments();
  
      // удалить оптимистичные «временные» документы
      setDocuments(prev => prev.filter(d => !String(d.id).startsWith('temp:')));
    } catch (err: unknown) {
      // на ошибке убираем оптимистичные добавления
      setDocuments(prev => prev.filter(d => !String(d.id).startsWith('temp:')));
      console.error(err);
      toast({
        title: "Ошибка загрузки",
        description: err instanceof Error ? err.message : "Не удалось загрузить",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setOverallPct(0);
    }
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
      await axios.delete(`/api/v2/${document.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      

      toast({
        title: "Success",
        description: `Document moved to bin`,
      });

      // Refresh document list
      await hardReloadDocuments();
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
  // ✅ После архивации
const handleArchiveDocument = async (document: Document) => {
  try {
    await archiveDocument(document.id, token!);
    toast({ title: "Success", description: `Document "${document.name}" archived` });
    await hardReloadDocuments();   // 👈
  } catch (error: any) {
    console.error(error);
    toast({ title: "Error", description: error.message || "Failed to archive document", variant: "destructive" });
  }
};


  // Unarchive document
  const handleUnarchiveDocument = async (document: Document) => {
    try {
      await unarchiveDocument(document.id, token!);
      
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
  // ✅ После переименования
const handleRenameDocument = async (document: Document, newName: string) => {
  try {
    await renameDocument(document.id, newName, token!);
    toast({ title: "Success", description: `Document renamed to "${newName}"` });
    await hardReloadDocuments();   // 👈 обновляем список полностью
  } catch (error: any) {
    console.error(error);
    toast({ title: "Error", description: error.message || "Failed to rename document", variant: "destructive" });
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
    if (document.type === "folder") {
      if (currentFolderId === document.id) {
        // если второй раз нажали на ту же папку → уходим в корень
        navigate("/");
        setCurrentFolderId(null);
      } else {
        // первый клик по папке → заходим внутрь
        navigate(`/?folderId=${document.id}`);
        setCurrentFolderId(document.id);
      }
    } else {
      setSelectedDocument(document);
      setShowSidebar(true);
    }
  };

  const expandedKey = React.useMemo(
    () => `expanded:${projectRootId ?? 'global'}`,
    [projectRootId]
  );
  
  const [expandedIds, setExpandedIds] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(expandedKey) || '[]'); } catch { return []; }
  });
  React.useEffect(() => {
    localStorage.setItem(expandedKey, JSON.stringify(expandedIds));
  }, [expandedIds, expandedKey]);
  
  
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
    if (selectedDocumentIds.length === filteredDocuments.length) {
      setSelectedDocumentIds([]);
      setSelectedDocument(null);
      setShowSidebar(false);
    } else {
      const ids = filteredDocuments.map(d => d.id);  // ⟵ только видимые
      setSelectedDocumentIds(ids);
      if (!selectedDocument && ids.length > 0) {
        const first = documents.find(d => d.id === ids[0])!;
        setSelectedDocument(first);
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
      formData.append('files', file, (file as File).relativePath || file.name);
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

  const hardReloadDocuments = async () => {
    setIsLoading(true);
    try {
      const { rows, total } = await tryFetch();
      const filtered = rows.filter((r: any) => !r.is_archived && !r.deleted_at);
      const mapped: Document[] = filtered.map(mapBackendDoc); // твой маппер
      
      setDocuments(mapped); // 👈 перезаписываем полностью, а не мерджим
      setTotalCount(total);
      setHasMore(mapped.length < total);
      setOffset(mapped.length);
    } finally {
      setIsLoading(false);
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

// было: фильтрация по folderId
// const visibleDocuments = useMemo(() => {
//   const inScope = documents.filter(d => !d.archived);
//   if (!folderId) return inScope.filter(d => d.parent_id === null);
//   return inScope.filter(d => d.parent_id === String(folderId));
// }, [documents, folderId]);
const visibleDocuments = useMemo(() => {
  const inScope = documents.filter(d => !d.archived);

  if (!folderId) {
    // root → показываем документы без родителя
    return inScope.filter(d => !d.parent_id || d.parent_id === "null");
  }

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
const folderTreeData = useMemo(() => buildTree(folders), [folders]);
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' as const };

const byId = useMemo(() => {
  const m = new Map<string, Document>();
  folders.forEach(f => m.set(f.id, f));
  documents.forEach(d => m.set(d.id, d)); // files in current folder
  return m;
}, [folders, documents]);

const getNode = (id: string) => byId.get(id);


const handleTreeAction = async (action: string, nodeId: string, data?: any) => {
  // If you still need some metadata (e.g., name for a toast), use getNode:
  const node = getNode(nodeId);

  try {
    switch (action) {
      case 'rename': {
        const newName = data?.newName?.trim();
        if (!newName) return { ok: false, message: 'Нет нового имени' };
        await axios.put(`/api/v2/metadata/${nodeId}`, { name: newName }, { headers });
        await fetchFolderTree();   // refresh tree
        if (folderId === node?.parent_id) await hardReloadDocuments(); // optional: refresh list if visible
        return { ok: true, message: 'Переименовано' };
      }

      case 'move': {
        const targetFolderId = data?.targetFolderId ?? null;
        await axios.put(`/api/v2/metadata/${nodeId}`, { parent_id: targetFolderId }, { headers });
        await fetchFolderTree();
        if (folderId === node?.parent_id || folderId === targetFolderId) await hardReloadDocuments();
        return { ok: true, message: 'Перемещено' };
      }

      case 'download': {
        // Don’t rely on a full Document object; download by id
        const res = await fetch(`/api/v2/file/${encodeURIComponent(nodeId)}/download`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const blob = await res.blob();
        const suggested = (res.headers.get("content-disposition") || "").match(/filename="([^"]+)"/)?.[1]
          || (node?.name ? `${node.name}.zip` : 'download.zip');
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href; a.download = suggested; document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(href);
        return { ok: true };
      }

      case 'archive': {
        await archiveDocument(nodeId, token!);
        await fetchFolderTree();
        if (folderId === node?.parent_id) await hardReloadDocuments();
        return { ok: true, message: 'В архиве' };
      }

      case 'favorite': {
        const res = await fetch(`/api/v2/metadata/${nodeId}/star`, { method: 'PUT', headers });
        if (!res.ok) throw new Error('Toggle failed');
        if (folderId === node?.parent_id) await hardReloadDocuments();
        return { ok: true, message: 'Избранное обновлено' };
      }

      case 'delete': {
        await axios.delete(`/api/v2/${nodeId}`, { headers });
        await fetchFolderTree();
        if (folderId === node?.parent_id) await hardReloadDocuments();
        return { ok: true, message: 'Удалено' };
      }

      case 'share': {
        if (!node) return { ok: false, message: 'Документ не найден' };
        // Assuming TreeNode has enough properties to be treated as a Document for sharing
        openShare(node as Document);
        return { ok: true };
      }

     // inside handleTreeAction → case 'create-subfolder'
// inside handleTreeAction → case 'create-subfolder' (localhost-friendly)

case 'create-subfolder': {
  const folderName = String(data?.folderName ?? '').trim();
  if (!folderName) return { ok: false, message: 'Имя папки пустое' };

  // parent_id: число либо null для корня
  const payload = {
    name: folderName,
    parent_id: Number.isFinite(+nodeId) ? +nodeId : null,
  };

  await axios.post(FOLDERS_ENDPOINTS.CREATE, payload, {
    headers: {
      ...headers, // Authorization
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  
  

  await fetchFolderTree();
  return { ok: true };
}
      default:
        return { ok: false, message: 'Не реализовано' };
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
    setCurrentProject(id);         // фиксируем выбранный проект (localStorage)
    setFolderId(id);               // открываем корневую папку проекта
    navigate(`/?folderId=${id}`);  // обновляем URL
  }}
  onProjectCreate={(p) => {
    // сразу перейти в новый проект
    setCurrentProject(p.id);
    setFolderId(p.id);
    navigate(`/?folderId=${p.id}`);
    // по желанию: жестко перезагрузить текущий список
    // await hardReloadDocuments();
  }}
/>

      </div>
  {/* left pane: folder tree  <nav className="w-64 overflow-auto h-screen p-2">*/}
  
  

 <div className="flex flex-1 overflow-hidden bg-dots">
  <nav className="w-64 overflow-y-auto border-r bg-white p-2 shadow-inner">
  <EnhancedFolderTree
  data={folderTreeData}
  selectedId={folderId}
  expandedIds={expandedIds}                     // ⬅️ контролируем раскрытие
  onSelect={(id) => {
    setFolderId(id);
    navigate(`/?folderId=${id}`);
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
                    className="flex items-center gap-2">
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
                     Загрузка документов…
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-4 text-muted-foreground">
                      Загрузка документов…
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
                            asChild
                          >
                            <a
                              href={buildDwgOpenUrl(document)}
                              // keep the menu from hijacking the click / parent row handlers
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              rel="noopener"
                            >
                              Редактировать
                            </a>
                          </DropdownMenuItem>
                          
                            )}
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
            className="absolute top-4 right-4 z-70 bg-white rounded-full p-2 shadow hover:bg-gray-200"
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
    {isUploading && (
      <div className="fixed right-4 bottom-4 z-[70] w-96 rounded-xl border bg-white/95 shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Загрузка… {overallPct}%</div>
          <div className="text-xs text-muted-foreground">
            ETA {formatDuration(uploadStats.etaSec)}
          </div>
        </div>

        <div className="h-2 w-full rounded bg-gray-200 overflow-hidden mb-2">
          <div
            className="h-2 bg-blue-600 transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        <div className="text-xs text-muted-foreground">
          {formatBytes(uploadStats.uploadedBytes)} / {formatBytes(uploadStats.totalBytes)}
          {" • "}
          {formatBytes(uploadStats.speedBps)}/s
        </div>
      </div>
    )}
     
    </div>
  );
};

export default Index;