// src/services/office.ts
export async function fetchOfficeConfig(input: {
  doc_id: string;
  ext: 'docx' | 'xlsx' | 'pptx';
  title?: string;
  mode?: 'edit' | 'view';
  user_id: string;
  user_name: string;
}) {
  
  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const res = await fetch(`${API_BASE}/office/config`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'edit', ...input })
});
  
  if (!res.ok) throw new Error(`config failed: ${res.status}`);
  
  return res.json();
}
