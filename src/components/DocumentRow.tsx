import React, { useState } from "react";
import { DocumentMeta } from "@/hooks/useDocuments";

// Extend DocumentMeta to include is_starred if not already present
declare module "@/hooks/useDocuments" {
  interface DocumentMeta {
    is_starred?: boolean;
  }
}
import { DOCUMENT_ENDPOINTS } from "@/config/api";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  Folder,
  MoreVertical,
  Trash,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { Check, X, Download, Eye, Trash2, Archive, Lock, Star, ArchiveRestore } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatFileSize } from "@/utils/formatters";
import { Checkbox } from '@/components/ui/checkbox';

interface DocumentRowProps {
  doc: DocumentMeta;
  onAction?: (action: string, doc: DocumentMeta) => void;
  onArchive?: (doc: DocumentMeta) => void;
  onUnArchive?: (doc: DocumentMeta) => void;
  onToggleStarred?: (doc: DocumentMeta) => void;
}

export function DocumentRow({ doc, onAction, onArchive, onUnArchive, onToggleStarred }: DocumentRowProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const downloadUrl = doc.file_path ? DOCUMENT_ENDPOINTS.DOWNLOAD(doc.name) : undefined;
  const previewUrl = doc.file_path ? DOCUMENT_ENDPOINTS.PREVIEW(doc.name) : undefined;
  
  const isPreviewable = doc.file_type?.startsWith("image/") || doc.file_type === "application/pdf";
  const formattedSize = doc.size ? formatFileSize(doc.size) : "Unknown";
  const formattedDate = new Date(doc.created_at).toLocaleString();

  const isArchived = doc.status === "archived";
  const isStarred = doc.is_starred || false;

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "public": return "default";
      case "private": return "secondary";
      case "shared": return "outline";
      case "deleted": return "destructive";
      case "archived": return "outline";
      case "pending": return "warning";
      case "approved": return "success";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleDownload = async (e: React.MouseEvent) => {
    if (!downloadUrl || !doc.file_path) return;

    e.preventDefault();

    try {
      const response = await fetch(downloadUrl, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreviewError(false);
    if (isPreviewable && doc.file_path) {
      setPreviewOpen(true);
    } else if (onAction) {
      onAction('preview', doc);
    }
  };

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  const renderIcon = () => {
    switch (doc.file_type) {
      case 'application/pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'application/msword':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'application/vnd.ms-excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'image/jpeg':
      case 'image/png':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      case 'folder':
        return <Folder className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleSelect = () => {
    setIsSelected(!isSelected);
  };

  const archiveDocument = async () => {
    try {
      await fetch(`/api/documents/${doc.id}/archive`, { method: "PUT" });
      if (onArchive) onArchive(doc);
    } catch (error) {
      console.error("Error archiving document:", error);
    }
  };

  const unarchiveDocument = async () => {
    try {
      await fetch(`/api/documents/${doc.id}/unarchive`, { method: "PUT" });
      if (onUnArchive) onUnArchive(doc);
    } catch (error) {
      console.error("Error unarchiving document:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      await fetch(`/api/documents/${doc.id}/star`, { method: "PUT" });
      if (onToggleStarred) onToggleStarred(doc);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <>
      <TableRow>
        {/* Selection Column */}
        <TableCell>
          <Checkbox checked={isSelected} onChange={handleSelect} />
        </TableCell>


        {/* Name Column */}
        <TableCell>
          <div className="flex items-center gap-2">
            {renderIcon()}
            <span>{doc.name}</span>
            {doc.is_starred && (
              <Star
                className="h-4 w-4 text-yellow-400 cursor-pointer"
                onClick={toggleFavorite}
              />
            )}
          </div>
        </TableCell>

        {/* Size Column */}
        <TableCell>{formattedSize}</TableCell>

        {/* Date Column */}
        <TableCell>{formattedDate}</TableCell>

        {/* Owner Column */}
        <TableCell>{doc.owner_id || "Unknown"}</TableCell>

        {/* Status Column */}
        <TableCell>
          {doc.status && (
            <Badge variant={getBadgeVariant(doc.status)}>{doc.status}</Badge>
          )}
        </TableCell>

        {/* Actions Column */}
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              title={doc.is_starred ? "Remove from favourites" : "Add to favourites"}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
            >
              {doc.is_starred ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-1"
              title={doc.status === "archived" ? "Restore from archive" : "Move to archive"}
              onClick={(e) => {
                e.stopPropagation();
                if (doc.status === "archived") {
                  unarchiveDocument();
                } else {
                  archiveDocument();
                }
              }}
            >
              {doc.status === "archived" ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePreviewClick}>Просмотр</DropdownMenuItem>
                {doc.file_type === 'folder' ? (
                  <>
                    <DropdownMenuItem>Новый файл</DropdownMenuItem>
                    <DropdownMenuItem>Новая папка</DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleDownload} disabled={isArchived}>
                    <Download className="h-4 w-4 mr-2" /> Скачать
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem disabled={isArchived}>
                  <Share2 className="h-4 w-4 mr-2" /> Поделиться
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" disabled={isArchived}>
                  <Trash className="h-4 w-4 mr-2" /> Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview: {doc.name}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[75vh] flex items-center justify-center overflow-auto">
            {isPreviewable && previewUrl && doc.file_path ? (
              previewError ? (
                <Card className="w-full h-full flex items-center justify-center">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 text-destructive">
                      <X className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Preview Failed</h3>
                    <p className="text-muted-foreground">
                      Could not load preview for this document. Try downloading the file instead.
                    </p>
                    <div className="mt-6">
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : doc.file_type?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt={doc.name}
                  className="max-h-full max-w-full object-contain"
                  onError={() => setPreviewError(true)}
                />
              ) : doc.file_type === "application/pdf" ? (
                <iframe
                  src={`${previewUrl}#toolbar=0`}
                  className="w-full h-full"
                  title={`Preview of ${doc.name}`}
                  onError={() => setPreviewError(true)}
                  sandbox="allow-scripts allow-same-origin"
                  allowFullScreen
                />
              ) : (
                <div className="text-center">
                  <p>Preview not available for this file type.</p>
                </div>
              )
            ) : (
              <div className="text-center">
                <p>Preview not available for this file type.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
