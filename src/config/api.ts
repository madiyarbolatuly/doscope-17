
// API configuration
export const API_ROOT = import.meta.env.VITE_API_ROOT || "http://localhost:8000/v2";

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  SIGNUP: `${API_ROOT}/u/signup`,
  LOGIN: `${API_ROOT}/u/login`,
  ME: `${API_ROOT}/u/me`,
};

// Document endpoints
export const DOCUMENT_ENDPOINTS = {
  UPLOAD: `${API_ROOT}/upload`,
  DOWNLOAD: (fileName: string) => `${API_ROOT}/file/${encodeURIComponent(fileName)}/download`,
  DELETE: (fileName: string) => `${API_ROOT}/${encodeURIComponent(fileName)}`,
  PREVIEW: (fileName: string) => `${API_ROOT}/preview/${encodeURIComponent(fileName)}`,
  METADATA: `${API_ROOT}/metadata`,
  METADATA_DETAIL: (documentId: string) => `${API_ROOT}/metadata/${documentId}/detail`,
  SEARCH: `${API_ROOT}/filter`,
  SHARE: (documentId: string) => `${API_ROOT}/share/${documentId}`,
  SHARE_LINK: (documentId: string) => `${API_ROOT}/share-link/${documentId}`,
};

// Trash endpoints
export const TRASH_ENDPOINTS = {
  LIST: `${API_ROOT}/trash`,
  EMPTY: `${API_ROOT}/trash`,
  DELETE: (fileName: string) => `${API_ROOT}/trash/${encodeURIComponent(fileName)}`,
  RESTORE: (fileName: string) => `${API_ROOT}/restore/${encodeURIComponent(fileName)}`,
};

// Notification endpoints
export const NOTIFICATION_ENDPOINTS = {
  LIST: `${API_ROOT}/notifications`,
  CLEAR: `${API_ROOT}/notifications`,
  UPDATE: (notificationId: string) => `${API_ROOT}/notifications/${notificationId}`,
};
