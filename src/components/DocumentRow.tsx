
import React, { useState } from "react";
import { DocumentMeta } from "@/hooks/useDocuments";
import { DOCUMENT_ENDPOINTS } from "@/config/api";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Download, Eye, Trash2, Share } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/utils/formatters";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DocumentRowProps {
  doc: DocumentMeta;
  onAction?: (action: string, doc: DocumentMeta) => void;
}

export function DocumentRow({ doc, onAction }: DocumentRowProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  
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
      case "pending": return "warning";
      case "approved": return "success";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  // Handle token for authenticated requests
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

  return (
    <>
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
            <TooltipProvider>
              {/* Download button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={!doc.file_path}
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              
              {/* Preview button - only if file type is previewable */}
              {isPreviewable && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      disabled={!doc.file_path}
                      onClick={handlePreviewClick}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview</TooltipContent>
                </Tooltip>
              )}
              
              {/* Share button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onAction?.('share', doc)}
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
              
              {/* Delete button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onAction?.('delete', doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              <>
                {previewError ? (
                  <Card className="w-full h-full flex items-center justify-center">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 text-destructive">
                        <X className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Preview Failed</h3>
                      <p className="text-muted-foreground">
                        Could not load preview for this document.
                        Try downloading the file instead.
                      </p>
                      <div className="mt-6">
                        <Button variant="outline" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  doc.file_type?.startsWith("image/") ? (
                    <img 
                      src={previewUrl} 
                      alt={doc.name} 
                      className="max-h-full max-w-full object-contain"
                      onError={handlePreviewError}
                    />
                  ) : doc.file_type === "application/pdf" ? (
                    <iframe 
                      src={`${previewUrl}#toolbar=0`}
                      className="w-full h-full"
                      title={`Preview of ${doc.name}`}
                      onError={handlePreviewError}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="text-center">
                      <p>Preview not available for this file type.</p>
                    </div>
                  )
                )}
              </>
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
