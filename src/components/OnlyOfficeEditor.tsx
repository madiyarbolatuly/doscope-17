import { useEffect, useRef, useState } from "react";
import { fetchOfficeConfig } from "@/services/office";

declare global {
  interface Window {
    DocsAPI: any;
  }
}

type Props = {
  docId: string;
  ext: "docx" | "xlsx" | "pptx";
  title?: string;
  mode?: "edit" | "view";
  user: { id: string; name: string };
};

export default function OnlyOfficeEditor({ docId, ext, title, mode = "edit", user }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1) Фетчим конфиг с backend
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const resp = await fetchOfficeConfig({
          doc_id: docId,
          ext,
          title,
          mode,
          user_id: user.id,
          user_name: user.name,
        });
        setServerUrl(resp.documentServerUrl);
        setConfig(resp.config);
      } catch (e: any) {
        setError(e?.message || "Не удалось получить конфигурацию");
      }
    })();
  }, [docId, ext, title, mode, user.id, user.name]);

  // 2) Загружаем API.js из DocumentServer
  useEffect(() => {
    if (!serverUrl || !config) return;

    const scriptUrl = `${serverUrl}/web-apps/apps/api/documents/api.js`;
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      if (!window.DocsAPI) {
        setError("DocsAPI не подгрузился");
        return;
      }
      try {
        editorRef.current = new window.DocsAPI.DocEditor(containerRef.current!, config);
      } catch (err: any) {
        setError(err?.message || "Ошибка инициализации редактора");
      }
    };
    script.onerror = () => setError(`Ошибка загрузки ${scriptUrl}`);

    document.body.appendChild(script);

    return () => {
      try {
        editorRef.current?.destroyEditor?.();
      } catch {}
      document.body.removeChild(script);
    };
  }, [serverUrl, config]);

  if (error) {
    return <div className="text-red-600">Ошибка: {error}</div>;
  }

  if (!config) {
    return <div>Загрузка редактора…</div>;
  }

  return <div ref={containerRef} style={{ width: "100%", height: "90vh" }} />;
}
