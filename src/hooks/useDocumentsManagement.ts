import { useState, useEffect, useCallback } from 'react';
import { Document, CategoryType } from '@/types/document';
import { mockApi, MockDocument } from '@/services/mockApi';
import { useToast } from '@/hooks/use-toast';

type SortField = 'name' | 'modified' | 'size' | 'owner';
type SortOrder = 'asc' | 'desc';

interface UseDocumentsManagementProps {
  activeCategory: CategoryType;
  currentFolderId?: string;
}

export function useDocumentsManagement({ 
  activeCategory, 
  currentFolderId 
}: UseDocumentsManagementProps) {
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await mockApi.getDocuments({
        category: activeCategory,
        search: searchQuery,
        folderId: currentFolderId
      });
      
      const sortedDocs = [...result.documents].sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'modified':
            aValue = new Date(a.modified);
            bValue = new Date(b.modified);
            break;
          case 'size':
            aValue = parseFloat(a.size);
            bValue = parseFloat(b.size);
            break;
          case 'owner':
            aValue = a.owner.toLowerCase();
            bValue = b.owner.toLowerCase();
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      setDocuments(sortedDocs);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить документы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [activeCategory, currentFolderId, sortField, sortOrder, searchQuery, toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    try {
      await mockApi.uploadFiles(files, currentFolderId);
      await loadDocuments();
      toast({
        title: "Файлы загружены",
        description: `Успешно загружено ${files.length} файлов`
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файлы",
        variant: "destructive"
      });
    }
  }, [currentFolderId, loadDocuments, toast]);

  return {
    documents,
    loading,
    sortField,
    sortOrder,
    searchQuery,
    setSortField,
    setSortOrder,
    setSearchQuery,
    loadDocuments,
    handleFileUpload
  };
}