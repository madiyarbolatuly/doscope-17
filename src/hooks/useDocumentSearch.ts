
import { useState, useMemo } from 'react';
import { Document } from '@/types/document';

export function useDocumentSearch(documents: Document[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchableKeys = ['name', 'type', 'owner', 'modified'] as const;

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    if (q === '') return documents;

    return documents.filter(doc =>
      searchableKeys.some(key => {
        const val = doc[key as keyof Document];
        if (Array.isArray(val)) {
          return val.some(v => v.toLowerCase().includes(q));
        }
        return typeof val === 'string' && val.toLowerCase().includes(q);
      })
    );
  }, [documents, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredDocuments
  };
}
