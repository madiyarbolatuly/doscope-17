// src/config/api.ts
export const API_ROOT    = import.meta.env.VITE_API_ROOT || "/api";
export const API_VERSION = "/v2";
export const API_BASE    = `${API_ROOT}${API_VERSION}`;

// When using axios with baseURL=API_ROOT ("/api"), prefer endpoint paths that start with
// API_VERSION ("/v2") to avoid generating "/api/api/v2/...".
export const API_V2 = `${API_VERSION}`;

export const apiUrl = (path = "") => {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  // If caller passes an absolute path under API_ROOT (e.g. "/api/v2/..."), keep it as-is.
  // This avoids accidental "/api/api/v2" when axios already has baseURL="/api".
  if (path.startsWith(API_ROOT + "/")) return path;
  if (path.startsWith("/")) return `${API_ROOT}${path}`;
  return `${API_BASE}/${path.replace(/^\/+/, "")}`;
};

// ── Auth
export const AUTH_ENDPOINTS = {
  SIGNUP: `${API_V2}/u/signup`,
  LOGIN:  `${API_V2}/u/login`,
  ME:     `${API_V2}/u/me`,
};

// ── Documents (metadata & file operations)
export const DOCUMENT_ENDPOINTS = {
  // uploads & listing
  UPLOAD:        `${API_V2}/upload`,
  METADATA:      `${API_V2}/metadata`,
  METADATA_DETAIL: (documentId: string | number) =>
    `${API_V2}/metadata/${encodeURIComponent(String(documentId))}/detail`,
  SEARCH:        `${API_V2}/filter`,
  FAVORITES_LIST:`${API_V2}/metadata/favorites/list`,

  // per-doc actions (по ID)
  STAR:   (documentId: string | number) =>
    `${API_V2}/metadata/${encodeURIComponent(String(documentId))}/star`,
  RENAME: (documentId: string | number) =>
    `${API_V2}/metadata/${encodeURIComponent(String(documentId))}/rename`,
  DELETE_BY_ID: (documentId: string | number) =>
    `${API_V2}/metadata/${encodeURIComponent(String(documentId))}`,

  // archive (по ИМЕНИ файла — так требует ваш бэкенд)
  ARCHIVE:      (fileName: string) => `${API_V2}/metadata/archive/${encodeURIComponent(fileName)}`,
  UNARCHIVE:    (fileName: string) => `${API_V2}/metadata/un-archive/${encodeURIComponent(fileName)}`,
  ARCHIVE_LIST: `${API_V2}/metadata/archive/list`,

  // file operations
  DOWNLOAD_BY_ID: (fileId: number | string) => `${API_V2}/file/${fileId}/download`,
  MOVE: (id: string | number) => `${API_V2}/${encodeURIComponent(String(id))}/move`,
  PREVIEW: (doc: string) => `${API_V2}/preview/${encodeURIComponent(doc)}`, // без /name/
};

// ── Trash
export const TRASH_ENDPOINTS = {
  LIST:   `${API_V2}/trash`,
  EMPTY:  `${API_V2}/trash`,
  DELETE: (fileName: string) => `${API_V2}/trash/${encodeURIComponent(fileName)}`,
  RESTORE:(fileName: string) => `${API_V2}/restore/${encodeURIComponent(fileName)}`,
};

// ── Notifications
export const NOTIFICATION_ENDPOINTS = {
  LIST:  `${API_V2}/notifications`,
  CLEAR: `${API_V2}/notifications`,
  UPDATE:(notificationId: string) => `${API_V2}/notifications/${encodeURIComponent(notificationId)}`,
};

// ── Sharing
export const SHARING_ENDPOINTS = {
  SHARE_LINK_BY_ID: (fileId: number | string) => `${API_V2}/sharing/share-link/id/${fileId}`,
  SHARE_LINK:       (document: string) => `${API_V2}/sharing/share-link/${encodeURIComponent(document)}`,
  SHARED_WITH_ME:   `${API_V2}/sharing/shared-with-me`,
  SHARED_BY_ME:     `${API_V2}/sharing/shared-by-me`,
  UPDATE_SHARE:     (shareId: number | string) => `${API_V2}/sharing/share/${shareId}`,
  DELETE_SHARE:     (shareId: number | string) => `${API_V2}/sharing/share/${shareId}`,
};

// ── Admin
export const ADMIN_ENDPOINTS = {
  USERS: `${API_V2}/admin/users`,
  USER: (userId: string) => `${API_V2}/admin/users/${userId}`,
  RESET_PASSWORD: (userId: string) => `${API_V2}/admin/users/${userId}/reset-password`,
};

// ── Folders
export const FOLDERS_ENDPOINTS = {
  CREATE: `${API_V2}/folders/folders/`,  // было /folders/, должно быть /folders/folders/
  CHILDREN:(parentId: number | string, recursive = false) =>
    `${API_V2}/folders/folders/${parentId}/children?recursive=${recursive}`,
};


// OpenAPI spec
export const OPENAPI_SPEC_URL = `${API_ROOT}/openapi.json`;
