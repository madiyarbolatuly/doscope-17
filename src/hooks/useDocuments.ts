// src/hooks/useDocuments.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { DOCUMENT_ENDPOINTS } from "@/config/api";

// ──────────────────────────────────────────────────────────────────────────────
// Типы
// ──────────────────────────────────────────────────────────────────────────────
export type DocumentStatus =
  | "public"
  | "private"
  | "shared"
  | "deleted"
  | "archived"
  | "pending"
  | "approved"
  | "rejected"
  | "draft";

export interface DocumentMeta {
  id: string;
  owner_id: string;
  name: string;
  file_path: string | null;
  created_at: string;
  size: number | null;
  file_type: string | null;
  tags: string[] | null;
  categories: string[] | null;
  status: DocumentStatus;
  file_hash: string | null;
  access_to: string[] | null;
  parent_id: number | null;
  is_archived: boolean;
  is_favourited: boolean;
  deleted_at: string | null;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  modified: string;
  owner: string;
  category: string;
  archived: boolean;
  starred: boolean;
  status?: "pending" | "approved" | "rejected" | "draft";
}

type PageResp = {
  documents: DocumentMeta[];
  next_cursor: string | null;
  total_count: number | null;
};

// ──────────────────────────────────────────────────────────────────────────────
/** Маппер метаданных бэкенда → UI-модель */
const toDocument = (doc: DocumentMeta): Document => ({
  id: doc.id,
  name: doc.name,
  type: doc.file_type ?? "unknown",
  size: doc.size != null ? `${doc.size} bytes` : "Unknown",
  modified: doc.created_at,
  owner: doc.owner_id,
  category: doc.categories?.[0] ?? "uncategorized",
  archived: doc.status === "archived" || !!doc.is_archived,
  starred: !!doc.is_favourited,
  status:
    (["pending", "approved", "rejected", "draft"].includes(doc.status)
      ? (doc.status as Document["status"])
      : undefined),
});

// ──────────────────────────────────────────────────────────────────────────────
// API: курсорная навигация (backward-compatible нормализация)
// ──────────────────────────────────────────────────────────────────────────────
async function fetchDocumentsPage(params: {
  parentId: number | null;
  limit: number;
  cursor?: string | null;
  category?: string;
  status?: string;
}): Promise<PageResp> {
  const sp = new URLSearchParams();
  if (params.parentId != null) sp.set("parent_id", String(params.parentId));
  sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.category) sp.set("category", params.category);
  if (params.status) sp.set("status", params.status);

  const token = localStorage.getItem("authToken");
  const { data } = await axios.get(`${DOCUMENT_ENDPOINTS.METADATA}?${sp.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Современный формат: { documents, next_cursor, total_count }
  if (data && Array.isArray(data.documents)) {
    return {
      documents: data.documents as DocumentMeta[],
      next_cursor: data.next_cursor ?? null,
      total_count: data.total_count ?? null,
    };
  }

  // Legacy-формат: объект с массивами под произвольными ключами — разворачиваем.
  const docsArray: DocumentMeta[] = [];
  let count = 0;
  if (data && typeof data === "object") {
    Object.values(data as Record<string, unknown>).forEach((v) => {
      if (Array.isArray(v)) {
        docsArray.push(...(v as DocumentMeta[]));
        count += v.length;
      }
    });
  }

  return {
    documents: docsArray,
    next_cursor: null,
    total_count: count,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Хук: ленивый список документов по курсору (без offset)
// ──────────────────────────────────────────────────────────────────────────────
export function useDocuments(
  category?: string,
  status?: string,
  parentId?: string
) {
  const pageSize = 100; // подберите 50–200 под UX

  const query = useInfiniteQuery({
    queryKey: ["docs", category ?? null, status ?? null, parentId ?? null, pageSize],
    queryFn: async ({ pageParam }) => {
      const page = await fetchDocumentsPage({
        parentId: parentId ? Number(parentId) : null,
        limit: pageSize,
        cursor: pageParam ?? null,
        category,
        status,
      });
      return {
        documents: (page.documents ?? []) as DocumentMeta[],
        next_cursor: page.next_cursor ?? null,
        total_count: page.total_count ?? null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const docs: Document[] =
    (query.data?.pages ?? []).flatMap((p) => (p.documents ?? []).map(toDocument)) ?? [];

  // total_count может быть null (мы не считаем дорого на бэке)
  const totalCount =
    query.data?.pages?.[query.data.pages.length - 1]?.total_count ??
    query.data?.pages?.[0]?.total_count ??
    0;

  return {
    docs,
    totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : undefined,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: () => query.refetch(),
    reset: () => query.remove(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Хук: список архивных документов (можно оставить «как есть»)
// ──────────────────────────────────────────────────────────────────────────────
export function useArchivedDocuments() {
  const q = useInfiniteQuery({
    queryKey: ["archived"],
    // Если у вас нет курсора у архива — грузим один раз
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(DOCUMENT_ENDPOINTS.ARCHIVE_LIST, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return { documents: data as DocumentMeta[] };
    },
    // без постранички
    getNextPageParam: () => undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const docs = (q.data?.pages?.[0]?.documents ?? []) as DocumentMeta[];

  return {
    docs,
    loading: q.isLoading,
    error: q.error ? (q.error as Error).message : undefined,
    refetch: () => q.refetch(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Действия: архив / разархив
// ──────────────────────────────────────────────────────────────────────────────
export const archiveDocument = async (fileName: string) => {
  const token = localStorage.getItem("authToken");
  const { data } = await axios.post(
    DOCUMENT_ENDPOINTS.ARCHIVE(fileName),
    {},
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  return data;
};

export const unarchiveDocument = async (fileName: string) => {
  const token = localStorage.getItem("authToken");
  const { data } = await axios.post(
    DOCUMENT_ENDPOINTS.UNARCHIVE(fileName),
    {},
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  return data;
};
