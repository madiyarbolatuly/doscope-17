import { useCallback } from 'react';
import { Document } from '@/types/document';
import { mockApi } from '@/services/mockApi';
import { useToast } from '@/hooks/use-toast';

export function useDocumentActions() {
  const { toast } = useToast();

  const handleDocumentPreview = useCallback(async (document: Document) => {
    try {
      await mockApi.previewDocument(document.id);
      toast({
        title: 'Предпросмотр',
        description: `Открытие ${document.name}`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть предпросмотр",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleToggleFavorite = useCallback(async (document: Document) => {
    try {
      await mockApi.toggleFavorite(document.id);
      return true;
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус избранного",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const handleBulkAction = useCallback(async (
    action: string, 
    selectedDocuments: string[], 
    onSuccess: () => void
  ) => {
    if (selectedDocuments.length === 0) return;
    
    try {
      switch (action) {
        case 'download':
          for (const docId of selectedDocuments) {
            await mockApi.downloadDocument(docId);
          }
          toast({
            title: "Загрузки начаты",
            description: `Скачивание ${selectedDocuments.length} документов`
          });
          break;
        case 'archive':
          for (const docId of selectedDocuments) {
            await mockApi.archiveDocument(docId);
          }
          onSuccess();
          toast({
            title: "Документы архивированы",
            description: `${selectedDocuments.length} документов перемещено в архив`
          });
          break;
        case 'trash':
          for (const docId of selectedDocuments) {
            await mockApi.moveToTrash(docId);
          }
          onSuccess();
          toast({
            title: "Документы удалены",
            description: `${selectedDocuments.length} документов перемещено в корзину`
          });
          break;
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    handleDocumentPreview,
    handleToggleFavorite,
    handleBulkAction
  };
}