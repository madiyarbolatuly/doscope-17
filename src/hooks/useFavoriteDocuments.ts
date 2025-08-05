
import { useState, useEffect } from 'react';
import { Document } from '@/types/document';
import { useToast } from '@/hooks/use-toast';

export function useFavoriteDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFavoriteDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v2/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorite documents');
      }

      const data = await response.json();
      const docsKey = Object.keys(data).find((key) => Array.isArray(data[key]));

      if (docsKey && Array.isArray(data[docsKey])) {
        const transformedDocuments: Document[] = data[docsKey].map((doc: any) => ({
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
          favorited: true,
          starred: true,
        }));
        setDocuments(transformedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching favorite documents:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить избранные документы',
        variant: 'destructive',
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (documentId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v2/metadata/${documentId}/star?repo_cls=document`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      // Refresh the favorites list
      await fetchFavoriteDocuments();
      
      toast({
        title: 'Успешно',
        description: 'Статус избранного изменен',
      });

      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус избранного',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchFavoriteDocuments();
  }, []);

  return {
    documents,
    loading,
    fetchFavoriteDocuments,
    toggleFavorite,
  };
}
