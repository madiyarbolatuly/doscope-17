import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Share2, Download, FileText, File, FileImage, Folder, Calendar, ChevronRight, ChevronDown, FolderDown, Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ROOT } from "@/config/api";
import { downloadByFileId } from "@/services/downloadService";
import { api } from "@/services/apiclient";
// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
type SharedWithMeItem = {
  id: number;
  token: string;
  shared_with: string;
  filename: string;
  expires_at: string;     // ISO8601
  document_id: number;    // numeric id of root shared doc
  shared_by: string;
  created_at: string;
  file_type?: string;     // "folder" | ext-backed etc.
};

interface SharedDocCard {
  id: string;               // card id (from share id)
  name: string;
  type: "folder" | "file";
  documentId: number;       // numeric id (for /children and downloads)
  sharedBy: string;
  createdAt: string;
  expiresAt: string;        // ISO
  token: string;
}

interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  _nid: number;             // numeric id of this node
  _parentId: number | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────────────────────────
const fileTypeFromName = (name: string, forceFolder = false): "folder" | "file" => {
  if (forceFolder) return "folder";
  const lower = name.toLowerCase();
  return /\.(pdf|pptx?|xlsx?|docx?|png|jpe?g|gif|webp|bmp|tiff|zip)$/.test(lower) ? "file" : "folder";
};

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf": return <FileText className="h-8 w-8" />;
    case "image": return <FileImage className="h-8 w-8" />;
    case "folder": return <Folder className="h-8 w-8" />;
    default: return <File className="h-8 w-8" />;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Countdown (UI + logic)
// ──────────────────────────────────────────────────────────────────────────────
function useCountdown(targetIso: string) {
  const [now, setNow] = useState<number>(Date.now());
  const target = useMemo(() => {
    // Expect ISO8601 with timezone, e.g. "...Z"
    const t = Date.parse(targetIso); // returns ms since epoch or NaN
    return Number.isFinite(t) ? t : 0;
  }, [targetIso]);
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const msLeft = Math.max(0, target - now);
  const expired = msLeft <= 0;
  const s = Math.floor(msLeft / 1000);
  const dd = Math.floor(s / 86400);
  const hh = Math.floor((s % 86400) / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return { expired, dd, hh, mm, ss };
}

const CountdownBadge: React.FC<{ iso: string }> = ({ iso }) => {
  const { expired, dd, hh, mm, ss } = useCountdown(iso);
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
        expired ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }`}
      title={new Date(iso).toLocaleString()}
      aria-live="polite"
    >
      <Timer className="h-4 w-4" />
      {expired ? "Ссылка истекла" : `Осталось: ${dd ? dd + "д " : ""}${hh}ч ${mm}м ${ss}с`}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
const SharedDocuments: React.FC = () => {
  const { toast } = useToast();
  const token = localStorage.getItem("authToken") || "";
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cards, setCards] = useState<SharedDocCard[]>([]);

  // cache children per folder id
  const [childrenCache, setChildrenCache] = useState<Record<number, TreeNode[]>>({});

  const fetchSharedWithMe = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const { data } = await api.get<SharedWithMeItem[]>(`/sharing/shared-with-me`);
      const mapped: SharedDocCard[] = data.map((x) => ({
        id: String(x.id),
        name: x.filename,
        type: (x.file_type === "folder") ? "folder" : fileTypeFromName(x.filename),
        documentId: x.document_id,
        sharedBy: x.shared_by,
        createdAt: x.created_at,
        expiresAt: x.expires_at,
        token: x.token,
      }));
      setCards(mapped.sort((a,b) => (a.type===b.type ? a.name.localeCompare(b.name) : a.type==="folder" ? -1 : 1)));
    } catch (e) {
      console.error(e);
      toast({ title: "Ошибка", description: "Не удалось загрузить поделенные элементы", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { 
    const controller = new AbortController();
    fetchSharedWithMe(controller.signal);
    return () => controller.abort();
  }, [fetchSharedWithMe]);

  const filtered = useMemo(
    () => cards.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [cards, searchQuery]
  );

  const CardItem: React.FC<{
    card: SharedDocCard;
    fetchChildrenCached: (parentId: number) => Promise<TreeNode[]>;
    onDownload: (card: SharedDocCard, expired: boolean) => Promise<void>;
  }> = ({ card, fetchChildrenCached, onDownload }) => {
    const { expired } = useCountdown(card.expiresAt); // ✅ hook at top level of a component
    const isFolder = card.type === "folder";
  
    return (
      <Card className="group bg-white border-0 shadow-lg hover:shadow-2xl transition-all overflow-hidden">
        <CardContent className="p-0">
          {/* Preview */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {isFolder ? <Folder className="h-12 w-12 text-yellow-500" /> : <File className="h-12 w-12 text-gray-500" />}
            <div className="absolute top-3 left-3">
              <CountdownBadge iso={card.expiresAt} />
            </div>
            {expired && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center text-red-700 font-semibold">
                Срок доступа истёк
              </div>
            )}
          </div>
  
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2" title={card.name}>
                {card.name}
              </h3>
              <div className="text-sm text-gray-500">
                Поделился: <span className="font-medium">{card.sharedBy}</span>
              </div>
            </div>
  
            {/* Actions (download-only) */}
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60"
                disabled={expired}
                aria-disabled={expired}
                onClick={() => onDownload(card, expired)}
              >
                <Download className="h-5 w-5 mr-2" />
                {isFolder ? "Скачать всё (.zip)" : "Скачать файл"}
              </Button>
  
              {isFolder && (
                <FolderContents
                  rootId={card.documentId}
                  expired={expired}
                  fetchChildrenCached={fetchChildrenCached}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // children loader (direct children for a given folder id)
  const mapDocsToTree = (arr: any[]): TreeNode[] =>
    (arr || []).map((d: any) => ({
      id: String(d.id),
      name: d.name || d.title || "Без имени",
      type: (d.file_type === "folder") ? "folder" : "file",
      _nid: Number(d.id),
      _parentId: d.parent_id == null ? null : Number(d.parent_id),
    }));

  const fetchChildren = async (parentId: number): Promise<TreeNode[]> => {
    const controller = new AbortController();
    try {
      const res = await api.get(`/children/${parentId}`)
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      return mapDocsToTree(data);
    } catch (e) {
      console.error("children fetch failed", e);
      const msg = (e instanceof AxiosError && e.response?.status === 404)
        ? "Дерево документов не найдено" : "Не удалось загрузить содержимое папки";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
      return [];
    }
  };

  const fetchChildrenCached = async (parentId: number) => {
    if (childrenCache[parentId]) return childrenCache[parentId];
    const nodes = await fetchChildren(parentId);
    setChildrenCache(prev => ({ ...prev, [parentId]: nodes }));
    return nodes;
  };

  // downloads (download-only mode)
  const handleDownloadNode = async (node: TreeNode, expired: boolean) => {
    if (expired) return;
    try { await downloadByFileId(node._nid, token, node.name); }
    catch (e) {
      console.error("node download failed", e);
      toast({ title: "Ошибка", description: "Не удалось скачать файл", variant: "destructive" });
    }
  };
  const handleDownloadCard = async (card: SharedDocCard, expired: boolean) => {
    if (expired) return;
    try {
      // if folder, let backend zip it; if file, just stream file
      const suggested = card.type === "folder" ? `${card.name}.zip` : card.name;
      await downloadByFileId(card.documentId, token, suggested);
    } catch (e) {
      console.error("card download failed", e);
      toast({ title: "Ошибка", description: "Не удалось скачать", variant: "destructive" });
    }
  };

  // folder tree
  const FolderTree: React.FC<{ rootId: number; node: TreeNode; expired: boolean }> = ({ rootId, node, expired }) => {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<TreeNode[]>([]);
    const toggle = async () => {
      if (!expanded && node.type === "folder" && children.length === 0) {
        const list = await fetchChildrenCached(node._nid);
        setChildren(list);
      }
      setExpanded(!expanded);
    };

    return (
      <div className="ml-2">
        <div className="flex items-center gap-2 py-1">
          {node.type === "folder" ? (
            <button onClick={toggle} className="flex items-center gap-1 text-left hover:bg-gray-100 rounded px-1 py-0.5">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Folder className="h-5 w-5 text-yellow-500" />
              <span className="font-medium truncate max-w-[18rem]">{node.name}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <File className="h-5 w-5 text-gray-500" />
              <span className="truncate max-w-[18rem]">{node.name}</span>
              <Button
                size="sm"
                variant={expired ? "secondary" : "default"}
                className="ml-2"
                disabled={expired}
                onClick={() => handleDownloadNode(node, expired)}
              >
                <Download className="h-4 w-4 mr-1" /> Скачать
              </Button>
            </div>
          )}
        </div>
        {expanded && children.length > 0 && (
          <div className="ml-4">
            {children.map((c) => (
              <FolderTree key={c.id} rootId={rootId} node={c} expired={expired} />
            ))}
          </div>
        )}
        {expanded && node.type === "folder" && children.length === 0 && (
          <div className="ml-6 text-sm text-gray-500 py-1">Пусто</div>
        )}
      </div>
    );
  };

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
                <BreadcrumbPage className="text-gray-700">Поделенные (только скачивание)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Поделенные файлы</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Здесь отображается только содержимое, которым с вами поделились. Доступ ограничен по времени.
            </p>
          </div>

          <div className="w-full">
            <SearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              placeholder="Поиск по названию…"
              showFilterButton={false}
            />
          </div>
        </div>

        {/* Content */}
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Нет доступных ссылок</h3>
              <p className="text-gray-600">Активные поделенные папки и файлы появятся здесь</p>
            </div>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                fetchChildrenCached={fetchChildrenCached}
                onDownload={handleDownloadCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FolderContents: React.FC<{
  rootId: number;
  expired: boolean;
  fetchChildrenCached: (parentId: number) => Promise<TreeNode[]>;
}> = ({ rootId, expired, fetchChildrenCached }) => {
  const [open, setOpen] = useState(false);
  const [rootChildren, setRootChildren] = useState<TreeNode[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && !rootChildren) {
      setLoading(true);
      try {
        const direct = await fetchChildrenCached(rootId);
        setRootChildren(direct);
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  };

  return (
    <div className="space-y-3">
      <Button
        variant="secondary"
        className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all duration-300"
        onClick={toggle}
      >
        {open ? "Скрыть содержимое" : "Показать содержимое папки"}
      </Button>

      {open && (
        <div className="w-full mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-[50vh] overflow-auto">
          {loading ? (
            <div className="text-sm text-gray-500">Загрузка…</div>
          ) : rootChildren && rootChildren.length > 0 ? (
            rootChildren.map((child) => (
              <FolderTree key={child.id} node={child} expired={expired} fetchChildrenCached={fetchChildrenCached} />
            ))
          ) : (
            <div className="text-sm text-gray-500">Папка пуста</div>
          )}
        </div>
      )}
    </div>
  );
};

const FolderTree: React.FC<{
  node: TreeNode;
  expired: boolean;
  fetchChildrenCached: (parentId: number) => Promise<TreeNode[]>;
}> = ({ node, expired, fetchChildrenCached }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<TreeNode[]>([]);
  const { toast } = useToast();

  const toggle = async () => {
    if (!expanded && node.type === "folder" && children.length === 0) {
      const list = await fetchChildrenCached(node._nid);
      setChildren(list);
    }
    setExpanded(!expanded);
  };

  const onDownload = async () => {
    if (expired) return;
    try { await downloadByFileId(node._nid, localStorage.getItem("authToken") || "", node.name); }
    catch (e) {
      console.error(e);
      toast({ title: "Ошибка", description: "Не удалось скачать файл", variant: "destructive" });
    }
  };

  return (
    <div className="ml-2">
      <div className="flex items-center gap-2 py-1">
        {node.type === "folder" ? (
          <button onClick={toggle} className="flex items-center gap-1 text-left hover:bg-gray-100 rounded px-1 py-0.5">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Folder className="h-5 w-5 text-yellow-500" />
            <span className="font-medium truncate max-w-[18rem]">{node.name}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <File className="h-5 w-5 text-gray-500" />
            <span className="truncate max-w-[18rem]">{node.name}</span>
            <Button
              size="sm"
              variant={expired ? "secondary" : "default"}
              className="ml-2"
              disabled={expired}
              onClick={onDownload}
            >
              <Download className="h-4 w-4 mr-1" /> Скачать
            </Button>
          </div>
        )}
      </div>
      {expanded && children.length > 0 && (
        <div className="ml-4">
          {children.map((c) => (
            <FolderTree key={c.id} node={c} expired={expired} fetchChildrenCached={fetchChildrenCached} />
          ))}
        </div>
      )}
      {expanded && node.type === "folder" && children.length === 0 && (
        <div className="ml-6 text-sm text-gray-500 py-1">Пусто</div>
      )}
    </div>
  );
};

export default SharedDocuments;
