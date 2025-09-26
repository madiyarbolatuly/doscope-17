// api/folders.ts
import axios from "axios";

export interface CreateFolderPayload {
  name: string;
  parent_id?: string | number | null; // UUID/number or null for root
}

const RAW_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? "";
const API_BASE = String(RAW_BASE).replace(/\/+$/, ""); // trim trailing slashes

function buildFolderUrls(base: string): string[] {
  const urls: string[] = [];
  const endsWithApiV2 = /\/api\/v\d+$/i.test(base);

  if (endsWithApiV2) {
    urls.push(`${base}/folders/`);
    const host = base.replace(/\/api\/v\d+$/i, "");
    urls.push(`${host}/v2/api/v2/folders/`);
  } else {
    urls.push(`${base}/api/v2/folders/`);
    urls.push(`${base}/v2/api/v2/folders/`);
  }

  // De-duplicate while preserving order
  return Array.from(new Set(urls.filter(Boolean)));
}

const CANDIDATE_URLS = buildFolderUrls(API_BASE || window.location.origin);

export const createFolderApi = async (
  token: string,
  payload: CreateFolderPayload
) => {
  const name = (payload.name ?? "").trim();
  if (!name) throw new Error("Folder name is required");

  const body: CreateFolderPayload = {
    name,
    ...(payload.parent_id !== undefined ? { parent_id: payload.parent_id } : {}),
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  let lastErr: any = null;
  for (const url of CANDIDATE_URLS) {
    try {
      const { data } = await axios.post(url, body, { headers });
      return data;
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      // If it's clearly the wrong route (404/405), try the next candidate.
      if (status === 404 || status === 405) continue;
      break; // other errors are likely real (401/403/422/500) → stop
    }
  }

  const detail =
    lastErr?.response?.data?.detail ||
    lastErr?.response?.data?.message ||
    lastErr?.message ||
    "Failed to create folder";

  // Helpful context for debugging
  throw new Error(
    `${detail} (tried: ${CANDIDATE_URLS.join(", ")})`
  );
};
