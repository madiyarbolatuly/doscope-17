// SharedDocuments.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/services/apiclient";
import { useToast } from "@/hooks/use-toast";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Share2, Download, File, FileImage, FileText, Folder, Timer, ChevronDown, ChevronRight, Eye
} from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { downloadByFileId } from "@/services/downloadService";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
type SharedWithMeItem = {
  id: number;
  token: string;
  shared_with: string;
  filename: string;
  expires_at: string;
  document_id: number;
  shared_by: string;
  created_at: string;
  file_type?: string; // "folder" | file ext inferred server-side
};

interface SharedDocCard {
  id: string;               // share id (stringified)
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
  _nid: number;
  _parentId: number | null;
}

type RoDoc = {
  id: number;
  name: string;
  type: "folder" | "file";
  sizeText: string;
  modified: string | null;
  owner?: string | null;
  parent_id: number | null;
};

// ──────────────────────────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────────────────────────
const fileTypeFromName = (name: string, forceFolder = false): "folder" | "file" => {
  if (forceFolder) return "folder";
  const lower = name.toLowerCase();
  return /\.(pdf|pptx?|xlsx?|docx?|png|jpe?g|gif|webp|bmp|tiff|zip|7z|rar|dwg)$/.test(lower) ? "file" : "folder";
};

const getFileIcon = (kind: "pdf" | "image" | "folder" | "default") => {
  switch (kind) {
    case "pdf": return <FileText className="h-8 w-8" />;
    case "image": return <FileImage className="h-8 w-8" />;
    case "folder": return <Folder className="h-8 w-8" />;
    default: return <File className="h-8 w-8" />;
  }
};

const renderIcon = (type: "folder" | "file", name?: string) => {
  if (type === "folder") return <Folder className="h-5 w-5 text-yellow-500" />;
  const n = (name || "").toLowerCase();
  if (n.endsWith(".pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (/\.(png|jpe?g|gif|webp|bmp|tiff)$/i.test(n)) return <FileImage className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

const fmtBytes = (n?: number | null) => {
  if (!n || n <= 0) return "—";
  const u = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(n)/Math.log(1024));
  return `${(n/Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
};

// ──────────────────────────────────────────────────────────────────────────────
// Countdown
// ──────────────────────────────────────────────────────────────────────────────
function useCountdown(targetIso: string) {
  const [now, setNow] = useState<number>(Date.now());
  const target = useMemo(() => {
    const t = Date.parse(targetIso);
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
// Folder tree (для компактного предпросмотра из карточки — оставляем как было)
// ──────────────────────────────────────────────────────────────────────────────
const FolderTree = React.memo(function FolderTree({
  node,
  expired,
  fetchChildrenCached,
}: {
  node: TreeNode;
  expired: boolean;
  fetchChildrenCached: (parentId: number) => Promise<TreeNode[]>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<TreeNode[]>([]);

  const toggle = useCallback(async () => {
    if (!expanded && node.type === "folder" && children.length === 0) {
      const list = await fetchChildrenCached(node._nid);
      setChildren(list);
    }
    setExpanded((e) => !e);
  }, [expanded, node.type, children.length, fetchChildrenCached, node._nid]);

  const onDownload = useCallback(async () => {
    if (expired) return;
    const token = localStorage.getItem("authToken") || "";
    await downloadByFileId(node._nid, token, node.name);
  }, [expired, node._nid, node.name]);

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
});

// ──────────────────────────────────────────────────────────────────────────────
// Read-only Folder Browser (НОВЫЙ режим, как в Index, но только preview + download)
// ──────────────────────────────────────────────────────────────────────────────
const ReadOnlyFolderView: React.FC<{
  rootId: number;
  rootName: string;
  expired: boolean;
  onExit: () => void;
}> = ({ rootId, rootName, expired, onExit }) => {
  const token = localStorage.getItem("authToken") || "";
  const { toast } = useToast();

  const [currentId, setCurrentId] = useState<number>(rootId);
  const [path, setPath] = useState<Array<{ id: number; name: string }>>([{ id: rootId, name: rootName }]);
  const [items, setItems] = useState<RoDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "size" | "modified">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const mapDoc = (d: any): RoDoc => {
    const type: "folder" | "file" = d.file_type === "folder" ? "folder" : "file";
    const sizeText = type === "folder" ? "—" : fmtBytes(typeof d.size === "number" ? d.size : null);
    return {
      id: Number(d.id),
      name: d.name || d.title || "Без имени",
      type,
      sizeText,
      modified: d.created_at || d.modified_at || null,
      owner: d.owner_id || null,
      parent_id: d.parent_id == null ? null : Number(d.parent_id),
    };
  };

  const fetchFolderItems = useCallback(async (parentId: number) => {
    setLoading(true);
    try {
      // можно также использовать /children/{id}, но тут берём metadata для размера/дат
      const qs = new URLSearchParams({
        limit: "1000",
        offset: "0",
        recursive: "false",
        parent_id: String(parentId),
      });
      const res = await fetch(`/api/v2/metadata?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const docs = Array.isArray(data?.documents) ? data.documents : [];
      const mapped = docs.map(mapDoc);
      // Папки первыми
      mapped.sort((a: RoDoc, b: RoDoc) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1));
      setItems(mapped);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Ошибка", description: "Не удалось получить содержимое папки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchFolderItems(currentId);
  }, [currentId, fetchFolderItems]);

  const onEnterFolder = (id: number, name: string) => {
    setCurrentId(id);
    setPath((p) => [...p, { id, name }]);
  };

  const onCrumb = (id: number, index: number) => {
    setCurrentId(id);
    setPath((p) => p.slice(0, index + 1));
  };

  const onPreview = useCallback(async (doc: RoDoc) => {
    if (expired || doc.type !== "file") return;
    try {
      const res = await fetch(`/api/v2/preview/${encodeURIComponent(doc.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // fallback: иногда приходит JSON с подписанным URL
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (!ct.includes("application/json")) throw new Error(String(res.status));
        const data = await res.json();
        if (data?.url) {
          window.open(data.url, "_blank", "noopener");
          return;
        }
        throw new Error("Нет URL предпросмотра");
      }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (data?.url) {
          window.open(data.url, "_blank", "noopener");
          return;
        }
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      // URL.revokeObjectURL позднее — вкладка теперь владеет
    } catch (e: any) {
      console.error(e);
      toast({ title: "Ошибка предпросмотра", description: e?.message || "Не удалось открыть предпросмотр", variant: "destructive" });
    }
  }, [expired, token, toast]);

  const onDownload = useCallback(async (doc: RoDoc) => {
    if (expired) return;
    await downloadByFileId(doc.id, token, doc.type === "folder" ? `${doc.name}.zip` : doc.name);
  }, [expired, token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.name.toLowerCase().includes(q));
  }, [items, search]);

  const toBytesForSort = (s: string) => {
    if (s === "—") return -1;
    const m = s.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
    if (!m) return 0;
    const num = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    const mul = unit === "B" ? 1 : unit === "KB" ? 1024 : unit === "MB" ? 1024 ** 2 : unit === "GB" ? 1024 ** 3 : 1024 ** 4;
    return num * mul;
  };

  const sorted = useMemo(() => {
    const arr = [...filtered];
    // Папки выше файлов
    arr.sort((a, b) => (a.type === b.type ? 0 : a.type === "folder" ? -1 : 1));
    arr.sort((a, b) => {
      let A: any, B: any;
      if (sortBy === "name") { A = a.name.toLowerCase(); B = b.name.toLowerCase(); }
      else if (sortBy === "size") { A = toBytesForSort(a.sizeText); B = toBytesForSort(b.sizeText); }
      else { A = a.modified || ""; B = b.modified || ""; }
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const SortHead: React.FC<{ id: "name" | "size" | "modified"; children: React.ReactNode }> = ({ id, children }) => (
    <TableHead
      onClick={() => {
        if (sortBy === id) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortBy(id); setSortDir("asc"); }
      }}
      className="cursor-pointer select-none"
      title="Сортировать"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortBy === id ? <span className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span> : null}
      </span>
    </TableHead>
  );

  return (
    <div className="w-full">
      {/* Header & controls */}
      <div className="mb-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onExit(); }}>
                Поделенные
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {path.map((p, idx) => (
              <React.Fragment key={p.id}>
                {idx < path.length - 1 ? (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onCrumb(p.id, idx); }}>
                        {p.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{p.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </React.Fragment>
            ))}
             </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Содержимое: {path[path.length - 1]?.name}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onExit}>Назад к ссылкам</Button>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar
              query={search}
              setQuery={setSearch}
              placeholder="Поиск внутри папки…"
              showFilterButton={false}
            />
          </div>
        </div>

      {/* List (read-only) */}
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHead id="name">Название</SortHead>
              <SortHead id="size">Размер</SortHead>
              <SortHead id="modified">Обновлён</SortHead>
              <TableHead className="w-56 text-right pr-6">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="p-6 text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            ) : sorted.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="p-6 text-center text-muted-foreground">Пусто</TableCell></TableRow>
            ) : sorted.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <div
                    className={`flex items-center gap-3 ${it.type === "folder" ? "text-blue-600 font-semibold cursor-pointer" : ""}`}
                    onClick={() => it.type === "folder" ? onEnterFolder(it.id, it.name) : undefined}
                    title={it.name}
                  >
                    {renderIcon(it.type, it.name)}
                    <span className="truncate">{it.type === "folder" ? `${it.name}/` : it.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{it.sizeText}</TableCell>
                <TableCell className="text-muted-foreground">
                  {it.modified ? new Date(it.modified).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2">
                    {it.type !== "folder" && (
                      <Button size="sm" variant="outline" disabled={expired} onClick={() => onPreview(it)}>
                        <Eye className="h-4 w-4 mr-1" /> Просмотр
                      </Button>
                    )}
                    <Button size="sm" disabled={expired} onClick={() => onDownload(it)}>
                      <Download className="h-4 w-4 mr-1" /> Скачать
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Компактное содержимое папки из карточки (оставляем для «быстрого взгляда»)
// ──────────────────────────────────────────────────────────────────────────────
const FolderContents = React.memo(function FolderContents({
  rootId,
  expired,
  fetchChildrenCached,
  open,
  onToggleOpen,
  onOpenAsList, // ← НОВОЕ: переключиться в режим списка
}: {
  rootId: number;
  expired: boolean;
  fetchChildrenCached: (parentId: number) => Promise<TreeNode[]>;
  open: boolean;
  onToggleOpen: () => void;
  onOpenAsList: () => void;
}) {
  const [rootChildren, setRootChildren] = useState<TreeNode[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (!open && !rootChildren) {
      setLoading(true);
      try {
        const direct = await fetchChildrenCached(rootId);
        setRootChildren(direct);
      } finally {
        setLoading(false);
      }
    }
    onToggleOpen();
  }, [open, rootChildren, fetchChildrenCached, rootId, onToggleOpen]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all duration-300"
          onClick={toggle}
        >
          {open ? "Скрыть содержимое" : "Быстрый просмотр"}
        </Button>
        <Button
          variant="outline"
          className="w-full font-semibold py-3 rounded-xl border border-gray-200"
          onClick={onOpenAsList}
        >
          Открыть как список
        </Button>
      </div>

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
});

// ──────────────────────────────────────────────────────────────────────────────
// Карточка
// ──────────────────────────────────────────────────────────────────────────────
const CardItem = React.memo(function CardItem({
  card,
  fetchChildrenCached,
  onDownload,
  open,
  onToggleOpen,
  onOpenAsList,
}: {
  card: SharedDocCard;
  fetchChildrenCached: (parentId: number) => Promise<TreeNode[]>;
  onDownload: (card: SharedDocCard, expired: boolean) => Promise<void>;
  open: boolean;
  onToggleOpen: () => void;
  onOpenAsList: () => void;
}) {
  const { expired } = useCountdown(card.expiresAt);
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
              Поделился: <span className="font-medium">{card.sharedBy || "admin"}</span>
            </div>
          </div>

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
                open={open}
                onToggleOpen={onToggleOpen}
                onOpenAsList={onOpenAsList}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// Страница
// ──────────────────────────────────────────────────────────────────────────────
const SharedDocuments: React.FC = () => {
  const { toast } = useToast();
  const token = localStorage.getItem("authToken") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cards, setCards] = useState<SharedDocCard[]>([]);
  const [browseRoot, setBrowseRoot] = useState<{ id: number; name: string; expiresAt: string } | null>(null);

  // keep open/closed state per documentId to avoid collapsing on re-render
  const [openByCard, setOpenByCard] = useState<Record<number, boolean>>({});

  // children cache per folder id
  const [childrenCache, setChildrenCache] = useState<Record<number, TreeNode[]>>({});

  const fetchSharedWithMe = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchSharedWithMe();
  }, [fetchSharedWithMe]);

  const filtered = useMemo(
    () => cards.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [cards, searchQuery]
  );

  // children loader
  const mapDocsToTree = (arr: any[]): TreeNode[] =>
    (arr || []).map((d: any) => ({
      id: String(d.id),
      name: d.name || d.title || "Без имени",
      type: (d.file_type === "folder") ? "folder" : "file",
      _nid: Number(d.id),
      _parentId: d.parent_id == null ? null : Number(d.parent_id),
    }));

  const fetchChildren = useCallback(async (parentId: number): Promise<TreeNode[]> => {
    const res = await api.get(`/children/${parentId}`);
    const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
    return mapDocsToTree(data);
  }, []);

  const browseIso = browseRoot?.expiresAt ?? "1970-01-01T00:00:00Z"; 
  const { expired: browseExpired } = useCountdown(browseIso);

  const fetchChildrenCached = useCallback(async (parentId: number) => {
    if (childrenCache[parentId]) return childrenCache[parentId];
    const nodes = await fetchChildren(parentId);
    setChildrenCache(prev => ({ ...prev, [parentId]: nodes }));
    return nodes;
  }, [childrenCache, fetchChildren]);

  // downloads
  const handleDownloadCard = useCallback(async (card: SharedDocCard, expired: boolean) => {
    if (expired) return;
    const suggested = card.type === "folder" ? `${card.name}.zip` : card.name;
    await downloadByFileId(card.documentId, token, suggested);
  }, [token]);

  // controlled open state handlers
  const isOpen = useCallback((docId: number) => !!openByCard[docId], [openByCard]);
  const toggleOpen = useCallback((docId: number) => {
    setOpenByCard(prev => ({ ...prev, [docId]: !prev[docId] }));
  }, []);

  // переключение на режим «как Index.tsx»
  const openAsList = useCallback((card: SharedDocCard) => {
    setBrowseRoot({ id: card.documentId, name: card.name, expiresAt: card.expiresAt });
  }, []);

  const exitBrowse = useCallback(() => setBrowseRoot(null), []);

  // ── UI
  const inBrowse = !!browseRoot;

  if (browseRoot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <ReadOnlyFolderView
            rootId={browseRoot.id}
            rootName={browseRoot.name}
            expired={browseExpired}
            onExit={() => setBrowseRoot(null)}
          />
        </div>
      </div>
    );
  }

  // обычный режим карточек
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
                <BreadcrumbPage className="text-gray-700">Поделенные (только скачивание / предпросмотр)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Поделенные файлы</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Здесь отображается содержимое, которым с вами поделились. Доступ только для чтения: предпросмотр и скачивание.
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
                key={card.documentId}
                card={card}
                fetchChildrenCached={fetchChildrenCached}
                onDownload={handleDownloadCard}
                open={isOpen(card.documentId)}
                onToggleOpen={() => toggleOpen(card.documentId)}
                onOpenAsList={() => openAsList(card)}   // ← НОВОЕ
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedDocuments;
