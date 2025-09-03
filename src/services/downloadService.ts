// services/downloadService.ts
import axios from 'axios';
import { API_ROOT } from '@/config/api';

function filenameFromContentDisposition(cd?: string): string | undefined {
  if (!cd) return;
  // RFC 5987 / filename*
  const mStar = /filename\*=(?:UTF-8''|)([^;]+)/i.exec(cd);
  if (mStar?.[1]) {
    const raw = mStar[1].replace(/^"+|"+$/g, '');
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
  // filename="..."
  const m = /filename="?([^"]+)"?/i.exec(cd);
  return m?.[1];
}

export async function downloadByFileName(fileName: string, token: string) {
  const url = `${API_ROOT}/file/${encodeURIComponent(fileName)}/download`;

  const resp = await axios.get(url, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
  });

  const suggested = filenameFromContentDisposition(
    resp.headers['content-disposition'] as string | undefined
  ) || fileName;

  const blobUrl = URL.createObjectURL(resp.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = suggested;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
