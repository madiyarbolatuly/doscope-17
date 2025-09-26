// src/services/apiClient.ts
import axios from "axios";
import { API_BASE } from "@/config/api";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("authToken");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
