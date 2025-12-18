// src/services/apiClient.ts
import axios from "axios";
import { API_ROOT } from "@/config/api";

// Important: endpoint constants already include `/v2` (API_BASE = `${API_ROOT}/v2`).
// If we set baseURL to API_BASE too, passing ADMIN_ENDPOINTS.* (which already contains `/api/v2/...`)
// can result in `/api/v2/api/v2/...` in some environments/proxies.
// So baseURL stays at API_ROOT and endpoints can safely include `/v2`.
export const api = axios.create({ baseURL: API_ROOT });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("authToken");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
