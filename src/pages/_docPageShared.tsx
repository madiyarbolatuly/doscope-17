import React from "react";
import { toast } from "@/hooks/use-toast";
import { Document } from "@/types/document";
import { apiUrl } from "@/config/api";

export type DocumentMeta = {
    id: string | number;
    name: string;
    file_type?: string; // "folder", "pdf", "docx" и т.п.
    size?: number | string | null;
    created_at?: string;
    owner_id?: string;
    categories?: string[];
    file_path?: string | null;
    tags?: string[];
    parent_id?: string | number | null;
    is_archived?: boolean;
    is_favourited?: boolean;
    status?: string; // например: "archived", "deleted"
    deleted_at?: string | null;
  };
// 1) Маппинг метаданных бэкенда -> ваш UI тип Document (взято из Index.tsx)
export const mapBackendDoc = (doc: DocumentMeta): Document => ({
    id: String(doc.id),
    name: doc.name || "Unnamed",
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
        ? `${(Number(doc.size) / (1024 * 1024)).toFixed(2)} MB`
        : "Unknown",
    modified: doc.created_at,
    owner: doc.owner_id,
    category: doc.categories?.[0] || "uncategorized",
    path: doc.file_path ?? null,
    tags: doc.tags || [],
    parent_id: doc.parent_id != null ? String(doc.parent_id) : null,
    archived: Boolean(doc.is_archived),
    starred: Boolean(doc.is_favourited),
  });  

// 2) Универсальный постраничный загрузчик как в Index.tsx
export function usePagedMetaFetcher(
    extraParams: Record<string, string> = {},
    options?: { rowFilter?: (r: DocumentMeta) => boolean }
  ) {
    const PAGE_SIZE = 40; // как в Index.tsx
    const token = (typeof window !== 'undefined') ? localStorage.getItem('authToken') || '' : '';
  
    const [documents, setDocuments] = React.useState<Document[]>([]);
    const [offset, setOffset] = React.useState(0);
    const [totalCount, setTotalCount] = React.useState<number | null>(null);
    const [hasMore, setHasMore] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
  
    const abortRef = React.useRef<AbortController | null>(null);
    const reqSeq = React.useRef(0);
  
    const tryFetch = React.useCallback(async () => {
      const qs = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        recursive: "false",
        ...extraParams,
        ...(search ? { q: search } : {}),
      });
  
      if (!token) throw new Error('Not authenticated');
  
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
  
      const res = await fetch(apiUrl(`/v2/metadata?${qs.toString()}`),{
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
  
      const rows = Array.isArray(data?.documents) ? data.documents as DocumentMeta[] : [];
      const total = typeof data?.total_count === "number" ? data.total_count : rows.length;
      return { rows, total };
    }, [PAGE_SIZE, offset, token, search, JSON.stringify(extraParams)]);
    const fetchMore = React.useCallback(async () => {
        if (!hasMore) return;
        if (isLoading) return;
    
        setIsLoading(true);
        const mySeq = ++reqSeq.current;
    
        try {
          const { rows, total } = await tryFetch();
          const isArchived = (r: DocumentMeta) => r.is_archived === true || r.status === "archived";
          const isDeleted  = (r: DocumentMeta) => !!r.deleted_at || r.status === "deleted";
    
          const baseFiltered = rows.filter((r) => !isDeleted(r)); // корзину всегда фильтруем
          const afterFilter = options?.rowFilter ? baseFiltered.filter(options.rowFilter) : baseFiltered;
          const mapped = afterFilter.map(mapBackendDoc);
    
          if (mySeq !== reqSeq.current) return; // устаревший ответ
    
          setDocuments(prev => offset === 0 ? mapped : [...prev, ...mapped]);
          if (totalCount === null) setTotalCount(total);
          setHasMore(offset + rows.length < total);
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          console.error(e);
          toast({ title: "Ошибка загрузки", description: `Метаданные не получены (${e?.message || 'unknown'}).`, variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      }, [hasMore, isLoading, tryFetch, offset, totalCount, options?.rowFilter]);
    
      // ресет при смене параметров/поиска
      React.useEffect(() => {
        setDocuments([]);
        setOffset(0);
        setTotalCount(null);
        setHasMore(true);
      }, [search, JSON.stringify(extraParams)]);
    
      // авто‑загрузка
      React.useEffect(() => {
        fetchMore();
      }, [offset, fetchMore]);
    
      const onScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
          if (hasMore && !isLoading) setOffset(o => o + PAGE_SIZE);
        }
      }, [hasMore, isLoading]);
    
      return {
        documents,
        isLoading,
        hasMore,
        offset,
        totalCount,
        setSearch,
        onScroll,
        refresh: () => { setDocuments([]); setOffset(0); setTotalCount(null); setHasMore(true); },
      } as const;
    }  
    export function useSelection() {
      const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    
      const toggle = React.useCallback((docId: string) => {
        setSelectedIds(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
      }, []);
    
      const selectAll = React.useCallback((docs: Document[]) => {
        setSelectedIds(docs.map(d => d.id));
      }, []);
    
      const clear = React.useCallback(() => setSelectedIds([]), []);
    
      return { selectedIds, toggle, selectAll, clear } as const;
    }
    
    // 4) Пустое состояние (иконка + текст)
    export const EmptyState: React.FC<{ title: string; subtitle?: string; icon: React.ReactNode; }>
      = ({ title, subtitle, icon }) => (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">{icon}</div>
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        {subtitle ? <p className="text-muted-foreground text-sm max-w-md">{subtitle}</p> : null}
      </div>
    );