// src/lib/api.ts
import axios from "axios";
import { DOCUMENT_ENDPOINTS } from "@/config/api";

export type PageResp<T> = {
  documents: T[];
  next_cursor: string | null;
  total_count: number | null;
};

export async function fetchDocumentsPage(params: {
  parentId: number | null;
  limit: number;
  cursor?: string | null;
  onlyFolders?: boolean;
  filesOnly?: boolean;
  category?: string;
  status?: string;
}) {
  const sp = new URLSearchParams();
  if (params.parentId != null) sp.set("parent_id", String(params.parentId));
  sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.onlyFolders) sp.set("only_folders", "true");
  if (params.filesOnly) sp.set("files_only", "true");
  if (params.category) sp.set("category", params.category);
  if (params.status) sp.set("status", params.status);

  const token = localStorage.getItem("authToken");
  const { data } = await axios.get(
    `${DOCUMENT_ENDPOINTS.METADATA}?${sp.toString()}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  // ожидается { documents, next_cursor, total_count }
  return data as PageResp<any>;
}
