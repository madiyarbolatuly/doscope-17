
import { useState, useMemo } from 'react';
import { Document } from '@/types/document';

type SortField = 'name' | 'size' | 'modified' | 'owner' | 'type';
type SortOrder = 'asc' | 'desc';

export function useDocumentSort(documents: Document[]) {
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toBytes = (size: string): number => {
    const [num, unit = 'B'] = size.split(' ');
    const n = parseFloat(num);
    switch (unit) {
      case 'MB': return n * 1_048_576;
      case 'KB': return n * 1_024;
      default: return isNaN(n) ? 0 : n;
    }
  };

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      let valA: string | number = a[sortBy] as any;
      let valB: string | number = b[sortBy] as any;

      if (sortBy === 'size') {
        valA = toBytes(a.size);
        valB = toBytes(b.size);
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [documents, sortBy, sortOrder]);

  return {
    sortBy,
    sortOrder,
    handleSort,
    sortedDocuments
  };
}
