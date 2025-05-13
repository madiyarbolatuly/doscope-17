
import React from "react";
import { useDocuments, DocumentMeta } from "@/hooks/useDocuments";
import { DocumentRow } from "./DocumentRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";

interface DocumentListProps {
  category?: string;
  status?: string;
  onDocumentAction?: (action: string, document: DocumentMeta) => void;
}

export function DocumentList({ category, status, onDocumentAction }: DocumentListProps) {
  const { docs, loading, error } = useDocuments(category, status);

  if (error) {
    return <div className="p-4 text-red-500">Error loading documents: {error}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <TableRow key={i}>
              <td colSpan={7} className="p-2">
                <Skeleton className="h-12 w-full" />
              </td>
            </TableRow>
          ))
        ) : docs.length === 0 ? (
          <TableRow>
            <td colSpan={7} className="text-center p-4 text-muted-foreground">
              No documents found
            </td>
          </TableRow>
        ) : (
          docs.map(doc => <DocumentRow key={doc.id} doc={doc} onAction={onDocumentAction} />)
        )}
      </TableBody>
    </Table>
  );
}
