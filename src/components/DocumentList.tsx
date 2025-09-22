import React from "react";
import { useDocuments, DocumentMeta } from "@/hooks/useDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DocumentRow } from "./DocumentRow";

interface DocumentListProps {
  category?: string;
  status?: string;
  onDocumentAction?: (action: string, document: DocumentMeta) => void;
  onArchive?: (document: DocumentMeta) => void;
  onUnArchive?: (document: DocumentMeta) => void;
  onToggleStarred?: (document: DocumentMeta) => void;
}

export function DocumentList({ category, status, onDocumentAction, onArchive, onUnArchive, onToggleStarred }: DocumentListProps) {
  const { docs, loading, error } = useDocuments(category, status);

  if (error) {
    return <div className="p-4 text-red-500">Error loading documents: {error}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-accent"
                      
                    >
                      
                    </Button></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Date created</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <TableRow key={i}>
              <td colSpan={5} className="p-2">
                <Skeleton className="h-12 w-full" />
              </td>
            </TableRow>
          ))
        ) : docs.length === 0 ? (
          <TableRow>
            <td colSpan={5} className="text-center p-4 text-muted-foreground">
              Loading documents...
            </td>
          </TableRow>
        ) : (
          docs.map(doc => (
            <DocumentRow
              key={doc.id}
              doc={doc as unknown as DocumentMeta}
              onAction={onDocumentAction}
              onArchive={onArchive}
              onUnArchive={onUnArchive}
              onToggleStarred={onToggleStarred}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
