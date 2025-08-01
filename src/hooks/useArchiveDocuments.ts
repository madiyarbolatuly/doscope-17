
import { useState, useEffect } from 'react';
import { Document } from '@/types/document';
import { useToast } from '@/hooks/use-toast';

export function useArchiveDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchArchivedDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/v2/metadata/archive/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch archived documents');
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        const transformedDocuments: Document[] = data.map((doc: any) => ({
          id: doc.id,
          name: doc.name ? decodeURIComponent(doc.name) : 'Unnamed Document',
          type: doc.file_type
            ? doc.file_type.includes('pdf')
              ? 'pdf'
              : doc.file_type.includes('doc')
              ? 'doc'
              : doc.file_type.includes('xls')
              ? 'xlsx'
              : doc.file_type.includes('ppt')
              ? 'ppt'
              : doc.file_type.includes('image')
              ? 'image'
              : 'file'
            : 'file',
          size: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
          modified: doc.created_at,
          owner: doc.owner_id,
          category: doc.categories && doc.categories.length > 0 ? doc.categories[0] : 'uncategorized',
          path: doc.file_path,
          tags: doc.tags || [],
          archived: true,
        }));
        setDocuments(transformedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching archived documents:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить архивированные документы',
        variant: 'destructive',
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const archiveDocument = async (fileName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/v2/metadata/archive/${encodeURIComponent(fileName)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to archive document');
      }

      await fetchArchivedDocuments();
      
      toast({
        title: 'Успешно',
        description: 'Документ архивирован',
      });

      return true;
    } catch (error) {
      console.error('Error archiving document:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось архивировать документ',
        variant: 'destructive',
      });
      return false;
    }
  };

  const unarchiveDocument = async (fileName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/v2/metadata/un-archive/${encodeURIComponent(fileName)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unarchive document');
      }

      await fetchArchivedDocuments();
      
      toast({
        title: 'Успешно',
        description: 'Документ восстановлен из архива',
      });

      return true;
    } catch (error) {
      console.error('Error unarchiving document:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось восстановить документ из архива',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchArchivedDocuments();
  }, []);

  return {
    documents,
    loading,
    fetchArchivedDocuments,
    archiveDocument,
    unarchiveDocument,
  };
}
