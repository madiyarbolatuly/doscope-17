
import React from "react";
import { DocumentMeta } from "@/hooks/useDocuments";
import { API_ROOT } from "@/config/api";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/utils/formatters";

interface DocumentRowProps {
  doc: DocumentMeta;
}

export function DocumentRow({ doc }: DocumentRowProps) {
  const downloadUrl = `${API_ROOT}/file/${encodeURIComponent(doc.name)}/download`;
  const previewUrl = `${API_ROOT}/preview/${encodeURIComponent(doc.name)}`;
  
  const isPreviewable = doc.file_type?.startsWith("image/") || doc.file_type === "application/pdf";
  const formattedSize = formatFileSize(doc.size);

  return (
    <TableRow>
      <TableCell>{doc.name}</TableCell>
      <TableCell>{formattedSize}</TableCell>
      <TableCell>{doc.file_type}</TableCell>
      <TableCell>{new Date(doc.uploaded_at).toLocaleString()}</TableCell>
      <TableCell>{doc.owner || "Unknown"}</TableCell>
      <TableCell>
        {doc.status && (
          <Badge 
            variant={
              doc.status === "approved" 
                ? "default" 
                : doc.status === "rejected" 
                ? "destructive" 
                : "outline"
            }
          >
            {doc.status}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!doc.file_path}
            asChild
          >
            <a href={downloadUrl} target="_blank" rel="noopener">
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          </Button>
          
          {isPreviewable && (
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!doc.file_path}
              asChild
            >
              <a href={previewUrl} target="_blank" rel="noopener">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </a>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
