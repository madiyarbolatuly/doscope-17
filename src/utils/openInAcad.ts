export const SMB_SERVER = "192.168.8.121";
export const SMB_SHARE  = "edms_uploads";

// Normalize whatever path you store for the file into a share-relative POSIX path.
export function getRelPathFromDoc(document: any): string {
  // pick whichever field your doc has:
  const raw =
    document.relPath ??
    document.relativePath ??
    document.path ??
    document.storagePath ??
    document.fileName ??
    "";
  // remove leading slashes, unify separators
  return String(raw).replace(/^[/\\]+/, "").replace(/\\/g, "/");
}

export function buildDwgOpenUrl(document: any): string {
  const rel = getRelPathFromDoc(document);
  const safe = rel.split("/").map(encodeURIComponent).join("/");
  return `dwgopen://${SMB_SERVER}/${SMB_SHARE}/${safe}`;
}

// Optional fallback (if you ever want a file:// link)
export function buildFileUri(document: any): string {
  const rel = getRelPathFromDoc(document);
  const safe = rel.split("/").map(encodeURIComponent).join("/");
  // UNC as file-URI: file://HOST/share/path  (browsers may block without policy/extension)
  return `file://///${SMB_SERVER}/${SMB_SHARE}/${safe}`;
}
