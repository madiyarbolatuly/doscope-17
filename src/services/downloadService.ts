// services/downloadService.ts
import axios, { AxiosError } from 'axios';
import { API_BASE } from '@/config/api';
/** Parse filename from Content-Disposition header (RFC 5987 and plain). */
function filenameFromContentDisposition(cd?: string): string | undefined {
  if (!cd) return;
  // filename*=UTF-8''...
  const star = cd.match(/filename\*\s*=\s*(?:UTF-8''|)([^;]+)/i);
  if (star?.[1]) {
    const raw = star[1].replace(/^"+|"+$/g, '');
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
  // filename="..."
  const m = cd.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i);
  return (m?.[1] || m?.[2])?.trim();
}

/** Trigger browser download from a blob, using a given filename. */
function triggerBlobDownload(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

/**
 * Try a single URL. Supports:
 *  - direct binary response
 *  - JSON body containing a signed URL (string or { url: string })
 */
async function tryDownloadUrl(url: string, token: string, fallbackName: string) {
  const resp = await axios.get(url, {
    responseType: 'blob', // we’ll still detect JSON via content-type
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    },
    // You can add withCredentials if your API needs cookies:
    // withCredentials: true,
  });

  const ct = String(resp.headers['content-type'] || '').toLowerCase();

  // If server returned JSON, try to interpret it as a signed URL
  if (ct.includes('application/json')) {
    // resp.data is a Blob; read it as text and parse
    const text = await resp.data.text();
    try {
      const json = JSON.parse(text);
      const directUrl = typeof json === 'string' ? json : json?.url;
      if (directUrl) {
        const a = document.createElement('a');
        a.href = directUrl;
        a.download = fallbackName; // if server doesn't set filename
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
    } catch {
      // fallthrough to treat as blob if JSON parse failed
    }
  }

  // Binary path — use header filename if present
  const suggested =
    filenameFromContentDisposition(
      resp.headers['content-disposition'] as string | undefined
    ) || fallbackName;

  triggerBlobDownload(resp.data, suggested);
}

/**
 * Smart downloader:
 * 1) /v2/file/{id}/download
 * 2) /v2/file/{name}/download
 * 3) /v2/file/download?path=...
 */
export async function downloadDocument(params: {
  token: string;
  id?: number | string;
  name?: string;        // exact file name incl. extension
  path?: string;        // full backend file_path if you have it
  defaultName: string;  // used if server doesn’t provide Content-Disposition
}) {
  const { token, id, name, path, defaultName } = params;

  const candidates: string[] = [
    id != null ? `${API_BASE}/file/${encodeURIComponent(String(id))}/download` : '',
    name ? `${API_BASE}/file/${encodeURIComponent(name)}/download` : '',
    path ? `${API_BASE}/file/download?path=${encodeURIComponent(path)}` : '',
      ].filter(Boolean);

  let lastErr: unknown = null;

  for (const url of candidates) {
    try {
      await tryDownloadUrl(url, token, defaultName);
      return; // success
    } catch (e) {
      lastErr = e;
      // Continue on 404; otherwise bubble up
      const ax = e as AxiosError;
      const status = ax.response?.status;
      if (status !== 404) break;
    }
  }

  // If we got here, all attempts failed
  if (lastErr instanceof Error) {
    throw new Error(
      lastErr.message || 'Download failed (all strategies exhausted).'
    );
  }
  throw new Error('Download failed (unknown error).');
}

/** Convenience wrappers */
export function downloadByFileId(
  fileId: number | string,
  token: string,
  fallbackName = 'download'
) {
  return downloadDocument({ token, id: fileId, defaultName: fallbackName });
}

export function downloadByFileName(
  fileName: string,
  token: string
) {
  return downloadDocument({ token, name: fileName, defaultName: fileName });
}

export function downloadByFilePath(
  filePath: string,
  token: string,
  fallbackName = 'download'
) {
  return downloadDocument({ token, path: filePath, defaultName: fallbackName });
}
