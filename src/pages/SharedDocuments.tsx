import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Share2, Download, FileText, File, FileImage, Folder, Eye, Calendar, Heart, ChevronRight, ChevronDown, FolderDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ROOT } from '@/config/api';
import type { Document } from '@/types/document';
import { downloadByFileId, downloadByFileName } from '@/services/downloadService';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
interface TreeNode {
  id: string;                    // string id for React key
  name: string;
  type: 'folder' | 'file';
  documentId: string | number;   // UUID or numeric id from backend
  token: string;
  _nid: number;                  // numeric id from backend
  _parentId: number | null;      // numeric parent id
}

type SharedWithMeItem = {
  id: number;
  token: string;
  shared_with: string;
  filename: string;
  expires_at: string;
  document_id: number;           // numeric id of shared root
  shared_by: string;
  created_at: string;
  file_type?: string;
};

interface SharedDocument extends Document {
  sharedBy: string;
  shareExpiration: string;   // ISO
  token: string;
  documentId: number;        // numeric id of the root shared document
  previewUrl?: string;
  favorited?: boolean;
}
// Helpers to distinguish the union type you pass to handleDownload
const isTreeNode = (x: unknown): x is TreeNode => typeof (x as TreeNode)?._nid === 'number';
const isSharedDoc = (x: unknown): x is SharedDocument => typeof (x as SharedDocument)?.documentId === 'number';

// ──────────────────────────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────────────────────────
const fileTypeFromName = (name: string, forceFolder = false): Document['type'] => {
  if (forceFolder) return 'folder';
  const parts = name.split('.');
  const last = parts[parts.length - 1].toLowerCase();
  const knownExts = ['pdf','ppt','pptx','xls','xlsx','doc','docx','png','jpg','jpeg','gif','webp','bmp','tiff','zip'];
  if (knownExts.includes(last)) {
    if (['png','jpg','jpeg','gif','webp','bmp','tiff'].includes(last)) return 'image';
    if (['xls','xlsx'].includes(last)) return 'xlsx';
    if (['ppt','pptx'].includes(last)) return 'ppt';
    if (['doc','docx'].includes(last)) return 'doc';
    if (last === 'pdf') return 'pdf';
    if (last === 'zip') return 'zip';
    return 'file';
  }
  return 'folder';
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
    case 'ppt': return <FileText className="h-8 w-8 text-orange-500" />;
    case 'image': return <FileImage className="h-8 w-8 text-purple-500" />;
    case 'folder': return <Folder className="h-8 w-8 text-yellow-500" />;
    default: return <File className="h-8 w-8 text-gray-500" />;
  }
};

const formatExpirationDate = (expiration: string) => {
  const expirationDate = new Date(expiration);
  return expirationDate.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const extractFilename = (headers: Record<string, string> | Headers, fallback: string) => {
  const cd: string | undefined = (headers as Record<string, string>)?.['content-disposition'] || (headers as Headers)?.get?.('content-disposition');
  if (!cd) return fallback;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
  const raw = decodeURIComponent((match?.[1] || match?.[2] || '').trim());
  return raw || fallback;
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
const SharedDocuments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const token = localStorage.getItem('authToken') || '';

  // cache for each shared folder: full subtree docs array (flat) keyed by root numeric id
  const [subtreeCache, setSubtreeCache] = useState<Record<number, Document[]>>({});

  const fetchSharedWithMe = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<SharedWithMeItem[]>(`${API_ROOT}/sharing/shared-with-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const enriched = await Promise.all(
        response.data.map(async (item) => {
          // For each shared item, try to fetch its metadata if it's a root folder
          // so we can display its actual name and type, not just the share name
          let actualDoc: Document | null = null;
          try {
            const docResponse = await axios.get<Document>(`${API_ROOT}/documents/${item.document_id}/metadata`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            actualDoc = docResponse.data;
          } catch (docError) {
            console.warn(`Could not fetch metadata for document ${item.document_id}:`, docError);
            // If metadata fetching fails, fall back to the shared item's filename and a generic type
          }

          return {
            id: String(item.id),
            name: actualDoc?.name || item.filename,
            type: actualDoc?.file_type === 'folder' ? 'folder' : fileTypeFromName(item.filename),
            size: '', // Placeholder, actual size would be from metadata
            modified: actualDoc?.modified || item.created_at,
            owner: actualDoc?.owner || item.shared_by,
            owner_id: actualDoc?.owner_id || '',
            category: 'shared',
            shared: true,
            favorited: actualDoc?.favorited || false,
            thumbnail: actualDoc?.thumbnail || '',
            path: actualDoc?.path || '',
            file_path: actualDoc?.file_path || '',
            dueDate: '',
            engineer: '',
            linkedAssets: [],
            tags: actualDoc?.tags || [],
            archived: actualDoc?.archived || false,
            starred: actualDoc?.starred || false,
            created_at: item.created_at,
            parent_id: actualDoc?.parent_id || undefined,
            version: actualDoc?.version || '',
            file_type: actualDoc?.file_type || fileTypeFromName(item.filename),
            status: actualDoc?.status || 'approved',

            sharedBy: item.shared_by,
            shareExpiration: item.expires_at,
            token: item.token,
            documentId: item.document_id,
            previewUrl: '',
          };
        })
      );
      setDocuments(enriched);
    } catch (err: unknown) {
      console.error('Error fetching shared documents:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить документы, которыми поделились',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { fetchSharedWithMe(); }, [fetchSharedWithMe, token]);

  const filteredDocuments = useMemo(
    () => documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [documents, searchQuery]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Tree helpers — строго показываем ТОЛЬКО поддерево расшаренной папки
  // ────────────────────────────────────────────────────────────────────────────
  const fetchSubtreeOnce = async (rootId: number): Promise<Document[]> => {
    if (subtreeCache[rootId]) {
      return subtreeCache[rootId] as Document[]; // Already loaded
    }

    try {
      const response = await axios.get(`${API_ROOT}/documents/tree/${rootId}/subtree`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const docs = response.data.items as Document[];
      // даже если сервер вернул "всё из БД", мы будем рисовать ТОЛЬКО узлы, достижимые из rootId
      setSubtreeCache(prev => ({ ...prev, [rootId]: docs }));
      return docs;
    } catch (e: unknown) {
      console.error('Error fetching subtree:', e);
      const msg = (e instanceof AxiosError && e.response?.status === 404) ? 'Дерево документов не найдено' : (e instanceof Error ? e.message : 'Не удалось загрузить дерево документов');
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
      return [];
    }
  };

  // получить прямых детей по parent_id из уже загруженного поддерева
  const getChildrenFromCache = (rootId: number, parentNids: (number | null)[]): TreeNode[] => {
    const docs = subtreeCache[rootId] || [];
    const children = docs.filter((d: Document) => parentNids.includes(d.parent_id === undefined ? null : parseInt(d.parent_id)));
    return children.map((d: Document) => ({
      id: String(d.id),
      name: d.name || 'Без имени',
      type: d.file_type === 'folder' ? 'folder' : 'file',
      documentId: d.id, // Use d.id as documentId
      token: '',
      _nid: parseInt(d.id), // Parse d.id to number for _nid
      _parentId: d.parent_id === undefined ? null : parseInt(d.parent_id), // Parse d.parent_id to number or null
    }));
  };

  // скачать один файл (ID → fallback name)
const handleDownload = async (doc: SharedDocument | TreeNode) => {
  try {
    // Prefer numeric ID:
    // - TreeNode: use _nid (DB id of that node)
    // - SharedDocument (root file share): use documentId
    if (isTreeNode(doc)) {
      await downloadByFileId(doc._nid, token, doc.name);
      return;
    }
    if (isSharedDoc(doc)) {
      await downloadByFileId(doc.documentId, token, doc.name);
      return;
    }

    // Fallback by name (exact name incl. extension, unique in user scope)
    await downloadByFileName((doc as SharedDocument).name, token);
  } catch (e: unknown) {
    console.error('Error downloading document:', e);
    const msg =
      (e instanceof AxiosError && e.response?.status === 404)
        ? 'Файл не найден на сервере'
        : (e instanceof Error ? e.message : 'Не удалось скачать файл');
    toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
  }
};


  // скачать всё (ZIP) — серверный маршрут(ы)
  // скачать всю папку (сервер сам вернёт .zip)
const handleDownloadAll = async (rootDoc: SharedDocument) => {
  try {
    await downloadByFileId(rootDoc.documentId, token, `${rootDoc.name}.zip`);
  } catch (e: unknown) {
    console.error('download-all failed', e);
    toast({
      title: 'Ошибка',
      description: (e instanceof AxiosError && e.response?.data?.detail) || 'Не удалось скачать папку как архив',
      variant: 'destructive',
    });
  }
};

  // ────────────────────────────────────────────────────────────────────────────
  // Tree UI: используем ТОЛЬКО дочерние элементы от текущего узла
  // ────────────────────────────────────────────────────────────────────────────
  const FolderTree: React.FC<{ rootId: number; node: TreeNode }> = ({ rootId, node }) => {
    const [expanded, setExpanded] = React.useState(false);
    const [children, setChildren] = React.useState<TreeNode[]>([]);

    const toggleExpand = async () => {
      if (!expanded && node.type === 'folder' && children.length === 0) {
        // гарантируем, что поддерево загружено
        await fetchSubtreeOnce(rootId);
        // берём ТОЛЬКО детей этого узла
        const list = getChildrenFromCache(rootId, [node._nid]);
        setChildren(list);
      }
      setExpanded(!expanded);
    };

    return (
      <div className="ml-2">
        <div className="flex items-center gap-2 py-1">
          {node.type === 'folder' ? (
            <button onClick={toggleExpand} className="flex items-center gap-1 text-left hover:bg-gray-100 rounded px-1 py-0.5">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Folder className="h-5 w-5 text-yellow-500" />
              <span className="font-medium truncate max-w-[18rem]">{node.name}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 group">
              {(() => {
                const lower = node.name.toLowerCase();
                if (lower.endsWith('.pdf')) return <FileText className="h-5 w-5 text-red-500" />;
                if (/\.(png|jpg|jpeg|gif|webp|bmp|tiff)$/.test(lower)) return <FileImage className="h-5 w-5 text-purple-500" />;
                return <File className="h-5 w-5 text-gray-500" />;
              })()}
              <span className="truncate max-w-[18rem]">{node.name}</span>
              <Button size="sm" className="ml-2 opacity-90 group-hover:opacity-100" onClick={() => handleDownload(node)}>
                <Download className="h-4 w-4 mr-1" /> Скачать
              </Button>
            </div>
          )}
        </div>
        {expanded && children.length > 0 && (
          <div className="ml-4">
            {children.map((child) => (
              <FolderTree key={child.id} rootId={rootId} node={child} />
            ))}
          </div>
        )}
        {expanded && node.type === 'folder' && children.length === 0 && (
          <div className="ml-6 text-sm text-gray-500 py-1">Пусто</div>
        )}
      </div>
    );
  };

  // карточная секция для папки: две кнопки (скачать всё + показать содержимое) и дерево
  const FolderCardExtras: React.FC<{ doc: SharedDocument }> = ({ doc }) => {
    const [open, setOpen] = React.useState(false);
    const [rootChildren, setRootChildren] = React.useState<TreeNode[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [downloadingAll, setDownloadingAll] = React.useState(false);

    const toggle = async () => {
      if (!open && !rootChildren) {
        setLoading(true);
        try {
          const flat = await fetchSubtreeOnce(doc.documentId);
          // корневые дети — where parent_id == doc.documentId
          const direct = getChildrenFromCache(doc.documentId, [doc.documentId, null]);
          setRootChildren(direct);
        } finally {
          setLoading(false);
        }
      }
      setOpen(!open);
    };

    const onDownloadAll = async () => {
      try {
        setDownloadingAll(true);
        await handleDownloadAll(doc);
      } finally {
        setDownloadingAll(false);
      }
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={onDownloadAll}
            disabled={downloadingAll}
          >
            <FolderDown className="h-5 w-5 mr-2" />
            {downloadingAll ? 'Готовим архив…' : 'Скачать всё (.zip)'}
          </Button>
          <Button
            variant="secondary"
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all duration-300"
            onClick={toggle}
          >
            {open ? 'Скрыть содержимое' : 'Показать содержимое папки'}
          </Button>
        </div>

        {open && (
          <div className="w-full mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-[60vh] overflow-auto">            {loading ? (
              <div className="text-sm text-gray-500">Загрузка…</div>
            ) : rootChildren && rootChildren.length > 0 ? (
              rootChildren.map((child) => (
                <FolderTree key={child.id} rootId={doc.documentId} node={child} />
              ))
            ) : (
              <div className="text-sm text-gray-500">Папка пуста</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handlePreview = (document: SharedDocument) => {
    toast({ title: 'Предпросмотр', description: `Открытие ${document.name}` });
    console.log('Preview shared doc:', document);
  };

  const handleToggleFavorite = (document: SharedDocument) => {
    setDocuments(prev => prev.map(d => d.id === document.id ? { ...d, favorited: !d.favorited } : d));
    const fav = !document.favorited;
    toast({ title: fav ? 'Добавлено в избранное' : 'Удалено из избранного', description: `${document.name} ${fav ? 'добавлен в' : 'удалён из'} избранного` });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Render (весь текущий стиль сохранён)
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
<div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-blue-600 hover:text-blue-800">Документы</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-700">Поделенные документы</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Поделенные файлы</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Здесь отображаются файлы и папки, которыми с вами поделились</p>
          </div>

          <div className="w-full">
            <SearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              placeholder="Поиск файлов..."
              showFilterButton={false}
            />
          </div>
        </div>

        {/* Скелет/пустой/список */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Share2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Загружаем…</h3>
              <p className="text-gray-600">Пожалуйста, подождите</p>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Файлы не найдены</h3>
              <p className="text-gray-600">Поделенные с вами активные файлы будут отображаться здесь</p>
            </div>
          </div>
        ) : (
           <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => (
              <Card 
              key={doc.id} 
              className="group relative hover:shadow-xl transition-all duration-300 bg-white border rounded-2xl overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Preview */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {doc.previewUrl ? (
                    <img src={doc.previewUrl} alt={doc.name} 
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {getFileIcon(doc.type)}
                    </div>
                  )}
            
                  {/* Top actions */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="rounded-full bg-white/80 hover:bg-white"
                      onClick={() => handleToggleFavorite(doc)}
                    >
                      <Heart className={`h-5 w-5 ${doc.favorited ? "text-red-500 fill-red-500" : "text-gray-600"}`} />
                    </Button>
            
                    <Button size="icon" variant="ghost" className="rounded-full bg-white/80 hover:bg-white">
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
            
                {/* Content */}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{doc.name}</h3>
                  <p className="text-sm text-gray-500">{doc.sharedBy}</p>
            
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">до {formatExpirationDate(doc.shareExpiration)}</span>
                    <Button size="sm" onClick={() => handleDownload(doc)} className="bg-blue-500 text-white rounded-lg px-3">
                      <Download className="h-4 w-4 mr-1" /> Скачать
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedDocuments;