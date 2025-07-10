import { useState, useCallback } from 'react';
import { Document } from '@/types/document';

export function useDocumentSelection() {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const handleDocumentSelect = useCallback((document: Document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.includes(document.id);
      if (isSelected) {
        return prev.filter(id => id !== document.id);
      } else {
        return [...prev, document.id];
      }
    });
  }, []);

  const handleSelectAll = useCallback((documents: Document[]) => {
    setSelectedDocuments(prev => {
      if (prev.length === documents.length) {
        return [];
      } else {
        return documents.map(doc => doc.id);
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDocuments([]);
  }, []);

  return {
    selectedDocuments,
    handleDocumentSelect,
    handleSelectAll,
    clearSelection
  };
}