
import React from "react";
import { DocumentMeta } from "@/hooks/useDocuments";
import { DOCUMENT_ENDPOINTS } from "@/config/api";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Download, Eye, Trash2, Share } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/utils/formatters";

interface DocumentRowProps {
  doc: DocumentMeta;
  onAction?: (action: string, doc: DocumentMeta) => void;
}

export function DocumentRow({ doc, onAction }: DocumentRowProps) {
  // Only create download/preview URLs if file_path exists
  const downloadUrl = doc.file_path ? DOCUMENT_ENDPOINTS.DOWNLOAD(doc.name) : undefined;
  const previewUrl = doc.file_path ? DOCUMENT_ENDPOINTS.PREVIEW(doc.name) : undefined;
  
  const isPreviewable = doc.file_type?.startsWith("image/") || doc.file_type === "application/pdf";
  const formattedSize = doc.size ? formatFileSize(doc.size) : "Unknown";
  const formattedDate = new Date(doc.created_at).toLocaleString();

  // Map status to badge variant
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "public": return "default";
      case "private": return "secondary";
      case "shared": return "outline";
      case "deleted": return "destructive";
      case "archived": return "outline";
      default: return "outline";
    }
  };

  return (
    <TableRow>
      <TableCell>{doc.name}</TableCell>
      <TableCell>{formattedSize}</TableCell>
      <TableCell>{doc.file_type || "Unknown"}</TableCell>
      <TableCell>{formattedDate}</TableCell>
      <TableCell>{doc.owner_id || "Unknown"}</TableCell>
      <TableCell>
        {doc.status && (
          <Badge 
            variant={getBadgeVariant(doc.status)}
          >
            {doc.status}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {/* Download button */}
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!doc.file_path}
            asChild={!!downloadUrl}
          >
            {downloadUrl ? (
              <a href={downloadUrl} target="_blank" rel="noopener">
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            ) : (
              <span>
                <Download className="h-4 w-4 mr-1" />
                Download
              </span>
            )}
          </Button>
          
          {/* Preview button - only if file type is previewable */}
          {isPreviewable && (
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!doc.file_path}
              asChild={!!previewUrl}
            >
              {previewUrl ? (
                <a href={previewUrl} target="_blank" rel="noopener">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </a>
              ) : (
                <span>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </span>
              )}
            </Button>
          )}
          
          {/* Share button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction?.('share', doc)}
          >
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
          
          {/* Delete button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600"
            onClick={() => onAction?.('delete', doc)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
