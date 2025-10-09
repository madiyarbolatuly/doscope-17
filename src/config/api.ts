// src/config/api.ts

export const API_ROOT    = import.meta.env.VITE_API_ROOT || "/api";
export const API_VERSION = "/v2";
export const API_BASE    = `${API_ROOT}${API_VERSION}`;
export const OPENAPI_SPEC_URL = `${API_ROOT}/openapi.json`;


// ── Auth
export const AUTH_ENDPOINTS = {
  SIGNUP: `${API_BASE}/u/signup`,
  LOGIN:  `${API_BASE}/u/login`,
  ME:     `${API_BASE}/u/me`,
};

// ── Documents (metadata & file operations)
export const DOCUMENT_ENDPOINTS = {
  // uploads & listing
  UPLOAD:        `${API_BASE}/upload`,
  METADATA:      `${API_BASE}/metadata`,
  METADATA_DETAIL: (documentId: string | number) =>
    `${API_BASE}/metadata/${encodeURIComponent(String(documentId))}/detail`,
  SEARCH:        `${API_BASE}/filter`,
  FAVORITES_LIST:`${API_BASE}/metadata/favorites/list`,

  // per-doc actions (по ID)
  STAR:   (documentId: string | number) =>
    `${API_BASE}/metadata/${encodeURIComponent(String(documentId))}/star`,
  RENAME: (documentId: string | number) =>
    `${API_BASE}/metadata/${encodeURIComponent(String(documentId))}/rename`,
  DELETE_BY_ID: (documentId: string | number) =>
    `${API_BASE}/metadata/${encodeURIComponent(String(documentId))}`,

  // archive (по ИМЕНИ файла — так требует ваш бэкенд)
  ARCHIVE:      (fileName: string) => `${API_BASE}/metadata/archive/${encodeURIComponent(fileName)}`,
  UNARCHIVE:    (fileName: string) => `${API_BASE}/metadata/un-archive/${encodeURIComponent(fileName)}`,
  ARCHIVE_LIST: `${API_BASE}/metadata/archive/list`,

  // file operations
  DOWNLOAD_BY_ID: (fileId: number | string) => `${API_BASE}/file/${fileId}/download`,
  MOVE: (id: string | number) => `${API_BASE}/${encodeURIComponent(String(id))}/move`,
  PREVIEW: (doc: string) => `${API_BASE}/preview/${encodeURIComponent(doc)}`, // без /name/
};

// ── Trash
export const TRASH_ENDPOINTS = {
  LIST:   `${API_BASE}/trash`,
  EMPTY:  `${API_BASE}/trash`,
  DELETE: (fileName: string) => `${API_BASE}/trash/${encodeURIComponent(fileName)}`,
  RESTORE:(fileName: string) => `${API_BASE}/restore/${encodeURIComponent(fileName)}`,
};

// ── Notifications
export const NOTIFICATION_ENDPOINTS = {
  LIST:  `${API_BASE}/notifications`,
  CLEAR: `${API_BASE}/notifications`,
  UPDATE:(notificationId: string) => `${API_BASE}/notifications/${encodeURIComponent(notificationId)}`,
};

// ── Sharing
export const SHARING_ENDPOINTS = {
  SHARE_LINK_BY_ID: (fileId: number | string) => `${API_BASE}/sharing/share-link/id/${fileId}`,
  SHARE_LINK:       (document: string) => `${API_BASE}/sharing/share-link/${encodeURIComponent(document)}`,
  SHARED_WITH_ME:   `${API_BASE}/sharing/shared-with-me`,
  SHARED_BY_ME:     `${API_BASE}/sharing/shared-by-me`,
};

// ── Folders
export const FOLDERS_ENDPOINTS = {
  CREATE: `${API_BASE}/folders/folders/`,  // было /folders/, должно быть /folders/folders/
  CHILDREN:(parentId: number | string, recursive = false) =>
    `${API_BASE}/folders/folders/${parentId}/children?recursive=${recursive}`,
};


// OpenAPI spec
export const OPENAPI_SPEC_URL = `${API_ROOT}/openapi.json`;
