// src/pages/EditDocumentPage.tsx
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { fetchOfficeConfig } from "@/services/office";

export default function EditDocumentPage() {
  const { id = "" } = useParams();
  const [sp] = useSearchParams();
  const [cfg, setCfg] = useState<any | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  const ext = (sp.get("ext") || "docx") as "docx" | "xlsx" | "pptx";
  const title = sp.get("title") || `${id}.${ext}`;

  useEffect(() => {
    (async () => {
      const resp = await fetchOfficeConfig({
        doc_id: id,
        ext,
        title,
        mode: "edit",
        user_id: "123",
        user_name: "Madiyar",
      });
      setCfg(resp);
    })();
  }, [id, ext, title]);

  useEffect(() => {
    if (!cfg?.documentServerUrl || !cfg?.config) return;

    const scriptUrl = `${cfg.documentServerUrl}/web-apps/apps/api/documents/api.js`;
    const s = document.createElement("script");
    s.src = scriptUrl;
    s.async = true;
    s.onload = () => {
      // @ts-ignore
      if (window.DocsAPI) {
        // @ts-ignore
        new window.DocsAPI.DocEditor(holderRef.current, cfg.config);
      }
    };
    document.body.appendChild(s);

    return () => {
      document.body.removeChild(s);
    };
  }, [cfg]);

  if (!cfg) return <div>Loading editor…</div>;

  return (
    <div className="p-4">
      <Link to="/" className="text-blue-600 underline">← Назад</Link>
      <div ref={holderRef} style={{ width: "100%", height: "90vh" }} />
    </div>
  );
}
