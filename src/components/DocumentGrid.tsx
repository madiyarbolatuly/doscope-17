
import React from 'react';
import { Document } from '@/types/document';
import { DocumentCard } from './DocumentCard';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
}

export function DocumentGrid({ documents, onDocumentClick }: DocumentGridProps) {
  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">No documents found</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          No documents match your current search or filter criteria. Try changing your search terms or adding new documents.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onClick={onDocumentClick} />
      ))}
    </div>
  );
}
