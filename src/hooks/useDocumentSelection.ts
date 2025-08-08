
import { useState, useCallback } from 'react';
import { Document } from '@/types/document';

export function useDocumentSelection() {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const handleDocumentSelect = useCallback((document: Document) => {
    setSelectedDocumentIds(prev => {
      if (prev.includes(document.id)) {
        return prev.filter(id => id !== document.id);
      } else {
        return [...prev, document.id];
      }
    });
  }, []);

  const handleSelectAll = useCallback((documents: Document[]) => {
    if (selectedDocumentIds.length === documents.length) {
      setSelectedDocumentIds([]);
    } else {
      setSelectedDocumentIds(documents.map(doc => doc.id));
    }
  }, [selectedDocumentIds.length]);

  const handleClearSelection = useCallback(() => {
    setSelectedDocumentIds([]);
  }, []);

  // Add compatibility properties for existing code
  const selectedDocuments = selectedDocumentIds;
  const clearSelection = handleClearSelection;

  return {
    selectedDocumentIds,
    handleDocumentSelect,
    handleSelectAll,
    handleClearSelection,
    setSelectedDocumentIds,
    // Compatibility properties
    selectedDocuments,
    clearSelection
  };
}
