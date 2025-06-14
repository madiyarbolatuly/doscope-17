
import React from 'react';
import { Document } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { DocumentListItem } from './DocumentListItem';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
  onDocumentPreview: (document: Document) => void;
  viewMode: 'grid' | 'list';
  onDocumentSelect: (document: Document) => void;
  onToggleFavorite?: (document: Document) => void;
  selectedDocument?: Document | null;
  multipleSelection?: boolean;
  selectionActions?: any;
  toggleFavorite?: (documentId: string) => Promise<void>;
  onArchive?: (fileName: string) => void;
  onUnarchive?: (fileName: string) => void;
}

export function DocumentGrid({ 
  documents, 
  onDocumentClick, 
  onDocumentPreview, 
  viewMode, 
  onDocumentSelect,
  onToggleFavorite,
  selectedDocument,
  multipleSelection = false,
  selectionActions,
  toggleFavorite,
  onArchive,
  onUnarchive
}: DocumentGridProps) {
  const handleToggleFavorite = (document: Document) => {
    if (onToggleFavorite) {
      onToggleFavorite(document);
    } else if (toggleFavorite) {
      toggleFavorite(document.id);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">
          Документы не найдены
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onClick={() => onDocumentClick(document)}
            onPreview={() => onDocumentPreview(document)}
            onSelect={() => onDocumentSelect(document)}
            onToggleFavorite={() => handleToggleFavorite(document)}
            isSelected={selectedDocument?.id === document.id}
            multipleSelection={multipleSelection}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <DocumentListItem
          key={document.id}
          document={document}
          onClick={() => onDocumentClick(document)}
          onPreview={() => onDocumentPreview(document)}
          onSelect={() => onDocumentSelect(document)}
          onToggleFavorite={() => handleToggleFavorite(document)}
          isSelected={selectedDocument?.id === document.id}
          multipleSelection={multipleSelection}
        />
      ))}
    </div>
  );
}
