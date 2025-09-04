import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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
import { downloadByFileName } from '@/services/downloadService';

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

const extractFilename = (headers: any, fallback: string) => {
  const cd: string | undefined = headers?.['content-disposition'] || headers?.get?.('content-disposition');
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
  const [subtreeCache, setSubtreeCache] = useState<Record<number, any[]>>({});

  const fetchSharedWithMe = async () => {
    setIsLoading(true);
    try {
      const resp = await axios.get<SharedWithMeItem[]>(`${API_ROOT}/sharing/shared-with-me`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      const now = new Date();
      const mapped: SharedDocument[] = (resp.data || [])
        .filter(item => new Date(item.expires_at) > now)
        .map((item): SharedDocument => {
          const type = fileTypeFromName(item.filename, item.file_type === 'folder');
          return {
            id: String(item.id),
            name: item.filename,
            type,
            size: '—',
            modified: item.created_at,
            owner: item.shared_by,
            category: '--',
            path: '',
            tags: [],
            favorited: false,
            sharedBy: item.shared_by,
            shareExpiration: item.expires_at,
            token: item.token,
            documentId: item.document_id,
          };
        });

      setDocuments(mapped);
    } catch (e: any) {
      console.error('shared-with-me error:', e);
      toast({ title: 'Ошибка', description: e?.response?.data?.detail || 'Не удалось загрузить «Поделенные со мной»', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSharedWithMe(); /* eslint-disable-next-line */ }, []);

  const filteredDocuments = useMemo(
    () => documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [documents, searchQuery]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Tree helpers — строго показываем ТОЛЬКО поддерево расшаренной папки
  // ────────────────────────────────────────────────────────────────────────────
  const fetchSubtreeOnce = async (rootId: number) => {
    if (subtreeCache[rootId]) return subtreeCache[rootId];
    const jwt = localStorage.getItem('authToken') || '';
    const resp = await axios.get<{ documents: any[] }>(`${API_ROOT}/metadata`, {
      headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/json' },
      params: { recursive: 'true', ancestor_id: rootId, limit: 1000, offset: 0 },
    });

    const docs = Array.isArray(resp.data?.documents) ? resp.data!.documents : [];

    // даже если сервер вернул "всё из БД", мы будем рисовать ТОЛЬКО узлы, достижимые из rootId
    setSubtreeCache(prev => ({ ...prev, [rootId]: docs }));
    return docs;
  };

  // получить прямых детей по parent_id из уже загруженного поддерева
  const getChildrenFromCache = (rootId: number, parentNid: number): TreeNode[] => {
    const docs = subtreeCache[rootId] || [];
    const children = docs.filter((d: any) => d.parent_id === parentNid);
    return children.map((d: any) => ({
      id: String(d.id),
      name: d.name || d.title || 'Без имени',
      type: d.file_type === 'folder' ? 'folder' : 'file',
      documentId: d.document_number ?? d.id,
      token: '',
      _nid: d.id,
      _parentId: d.parent_id ?? null,
    }));
  };

  // скачать один файл (по имени)
  const handleDownload = async (doc: SharedDocument | TreeNode) => {
    try {
      await downloadByFileName(doc.name, token);
    } catch (e: any) {
      console.error('Error downloading document:', e);
      toast({ title: 'Ошибка', description: e?.response?.status === 404 ? 'Файл не найден на сервере' : (e?.message || 'Не удалось скачать файл'), variant: 'destructive' });
    }
  };

  // скачать всё (ZIP) — серверный маршрут(ы)
  const handleDownloadAll = async (rootDoc: SharedDocument) => {
    const jwt = localStorage.getItem('authToken') || '';
    const candidates = [
      `${API_ROOT}/folder/${rootDoc.documentId}/download-zip`,
      `${API_ROOT}/folders/${rootDoc.documentId}/download-zip`,
      `${API_ROOT}/folder/${rootDoc.documentId}/download`,
      `${API_ROOT}/folders/${rootDoc.documentId}/download`,
      `${API_ROOT}/sharing/${rootDoc.token}/download-all`,
      `${API_ROOT}/zip?ancestor_id=${rootDoc.documentId}&recursive=true`,
    ];
    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/zip' }, responseType: 'blob' });
        const fileName = extractFilename(res.headers, `${rootDoc.name}.zip`);
        const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = blobUrl; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(blobUrl);
        return;
      } catch (e) { lastErr = e; }
    }
    console.error('download-all failed', lastErr);
    toast({ title: 'Ошибка', description: 'Не удалось скачать папку как архив', variant: 'destructive' });
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
        const list = getChildrenFromCache(rootId, node._nid);
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
          const direct = getChildrenFromCache(doc.documentId, doc.documentId);
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
              <Card key={doc.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  {/* Preview Section */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {doc.previewUrl ? (
                      <img src={doc.previewUrl} alt={doc.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50">
                        {getFileIcon(doc.type)}
                      </div>
                    )}

                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(doc)}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-lg transition-all duration-300 ${doc.favorited ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/80 hover:bg-white text-gray-600 hover:text-red-500'}`}
                    >
                      <Heart className={`h-5 w-5 ${doc.favorited ? 'fill-current' : ''}`} />
                    </Button>

                    {/* Preview Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <Button variant="secondary" size="lg" onClick={() => handlePreview(doc)} className="bg-white/90 hover:bg-white text-gray-900 font-semibold px-6 py-3 rounded-full shadow-lg">
                        <Eye className="h-5 w-5 mr-2" /> Предпросмотр
                      </Button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-4">
                    {/* File Name */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2" title={doc.name}>{doc.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{doc.size}</p>
                    </div>

                    {/* Shared By */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{(doc.sharedBy?.slice(0, 2) || 'U').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-gray-600">Поделился</p>
                        <p className="text-sm font-semibold text-gray-900">{doc.sharedBy}</p>
                      </div>
                    </div>

                    {/* Expiration Date */}
                    <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Действует до</p>
                        <p className="font-bold text-sm text-green-700">{formatExpirationDate(doc.shareExpiration)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {doc.type === 'folder' ? (
                      <FolderCardExtras doc={doc} />
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-5 w-5 mr-2" /> Скачать файл
                      </Button>
                    )}
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
