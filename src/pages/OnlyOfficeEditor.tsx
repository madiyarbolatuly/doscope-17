import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Ext = "docx" | "xlsx" | "pptx";

export default function OnlyOfficeEditorPage() {
  const { id = "" } = useParams();
  const [sp] = useSearchParams();
  const [cfg, setCfg] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);

  const ext = (sp.get("ext") || "docx") as Ext;
  const title = sp.get("title") || `${id}.${ext}`;

  // 1) Ask backend for config
  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setCfg(null);
        const r = await fetch(`${API_BASE}/office/config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doc_id: id,
            ext,
            title,
            mode: "edit",
            user_id: "123",
            user_name: "Madiyar",
          }),
        });
        if (!r.ok) throw new Error(`/office/config ${r.status}`);
        const json = await r.json();
        setCfg(json);
      } catch (e: any) {
        setErr(e?.message || "Failed to load OnlyOffice config");
      }
    })();
  }, [id, ext, title]);

  // 2) Load OnlyOffice DocsAPI and mount editor
  useEffect(() => {
    if (!cfg?.documentServerUrl || !cfg?.config) return;
    const scriptUrl = `${cfg.documentServerUrl}/web-apps/apps/api/documents/api.js`;

    let cancelled = false;
    const s = document.createElement("script");
    s.src = scriptUrl;
    s.async = true;
    s.onload = () => {
      if (cancelled) return;
      if (!window.DocsAPI) {
        setErr("DocsAPI not available");
        return;
      }
      editorRef.current = new window.DocsAPI.DocEditor(holderRef.current!, cfg.config);
    };
    s.onerror = () => setErr(`Failed to load ${scriptUrl}`);
    document.body.appendChild(s);

    return () => {
      cancelled = true;
      try {
       editorRef.current?.destroyEditor && editorRef.current.destroyEditor();
      } catch {}
      document.body.removeChild(s);
    };
  }, [cfg]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-blue-600 underline">← Назад</Link>
        <h1 className="text-xl font-semibold">Редактор: {title}</h1>
      </div>

      {err && (
        <div className="text-red-600 border border-red-200 bg-red-50 p-3 rounded">
          {err}
        </div>
      )}

      {!cfg && !err && <div>Загрузка редактора…</div>}

      {/* ONLYOFFICE renders into this node */}
      <div ref={holderRef} id="onlyoffice-editor" style={{ width: "100%", height: "80vh" }} />
    </div>
  );
}
