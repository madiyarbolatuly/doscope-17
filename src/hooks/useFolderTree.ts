import { useCallback, useEffect, useMemo, useState } from "react";
import { Document } from "@/types/document";
import { TreeNode, buildTree } from "@/utils/buildTree";

type FolderMeta = {
  id: string | number;
  name?: string;
  parent_id?: string | number | null;
  file_type?: string | null;
  size?: number | string | null;
  created_at?: string | null;
  owner_id?: string | null;
  categories?: string[] | null;
  file_path?: string | null;
  tags?: string[] | null;
  is_archived?: boolean;
  is_favourited?: boolean;
  deleted_at?: string | null;
};

const mapFolderToDocument = (doc: FolderMeta): Document => ({
  id: String(doc.id),
  name: doc.name || "Без названия",
  type: doc.file_type === "folder" ? "folder" : "file",
  size: doc.file_type === "folder" ? "--" : typeof doc.size === "number" ? `${(Number(doc.size) / (1024 * 1024)).toFixed(2)} MB` : "--",
  modified: doc.created_at ?? undefined,
  owner: doc.owner_id ?? "",
  category: doc.categories?.[0] || "uncategorized",
  path: doc.file_path ?? null,
  tags: doc.tags ?? [],
  parent_id: doc.parent_id != null ? String(doc.parent_id) : null,
  archived: Boolean(doc.is_archived),
  starred: Boolean(doc.is_favourited),
});

interface UseFolderTreeOptions {
  projectRootId?: string | null;
  enabled?: boolean;
  limit?: number;
  token?: string | null;
}

export const useFolderTree = (options: UseFolderTreeOptions = {}) => {
  const { projectRootId, enabled = true, limit = 500, token } = options;
  const [folders, setFolders] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const authToken = useMemo(() => {
    if (token !== undefined) return token;
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  }, [token]);

  const fetchFolders = useCallback(async () => {
    if (!enabled || !authToken) {
      setFolders([]);
      return [] as Document[];
    }

    setIsLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({
        limit: String(limit),
        offset: "0",
        recursive: "true",
        only_folders: "true",
      });

      if (projectRootId) {
        qs.set("root_id", String(projectRootId));
      }

      const res = await fetch(`/api/v2/metadata?${qs.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);;
      }

      const data = await res.json();
      const mapped = (Array.isArray(data?.documents) ? data.documents : [])
        .map(mapFolderToDocument)
        .filter((doc) => doc.type === "folder");

      setFolders(mapped);
      return mapped;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Не удалось загрузить папки");
      setError(errorObj);
      return [] as Document[];
    } finally {
      setIsLoading(false);
    }
  }, [authToken, enabled, limit, projectRootId]);

  useEffect(() => {
    if (!enabled) {
      setFolders([]);
      return;
    }
    void fetchFolders();
  }, [enabled, fetchFolders]);

  const tree: TreeNode[] = useMemo(() => buildTree(folders), [folders]);

  return {
    folders,
    tree,
    isLoading,
    error,
    refetch: fetchFolders,
  } as const;
};
