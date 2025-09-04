import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { DocumentTable } from '@/components/DocumentTable';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Document } from '@/types/document';
import { Archive, RotateCcw, Grid2X2, List, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_ROOT } from '@/config/api';

// ---------- ЛОКАЛЬНЫЕ СЕРВИС-ФУНКЦИИ ----------

// Получить список документов в корзине
const getTrashedDocumentsApi = async (token: string) => {
  const response = await axios.get(`${API_ROOT}/trash`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Восстановить документ из корзины (по имени файла)
const recoverDocument = async (fileName: string, token: string) => {
  const response = await axios.post(
    `${API_ROOT}/restore/${encodeURIComponent(fileName)}`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// Удалить документ из корзины навсегда (по имени файла)
const permanentDeleteDocument = async (fileName: string, token: string) => {
  const response = await axios.delete(
    `${API_ROOT}/trash/${encodeURIComponent(fileName)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// ---------- КОМПОНЕНТ КОРЗИНЫ ----------
const TrashBin: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const token = localStorage.getItem('authToken') || '';

  const fetchTrashedDocuments = async () => {
    setIsLoading(true);
    try {
      if (!token) throw new Error('Not authenticated');

      const data = await getTrashedDocumentsApi(token);

      // Бэкенд может вернуть массив под произвольным ключом — найдём первый массив
      const docsKey = Object.keys(data).find((k) => Array.isArray((data as any)[k]));

      if (docsKey && Array.isArray(data[docsKey]) && data[docsKey].length > 0) {
        const transformed: Document[] = data[docsKey].map((doc: any) => ({
          id: doc.id,
          // НЕ декодируем name — он нужен как есть для REST-эндпоинтов
          name: doc.name || 'Unnamed Document',
          type: doc.file_type
            ? (doc.file_type.includes('pdf') ? 'pdf'
              : doc.file_type.includes('doc') ? 'doc'
              : doc.file_type.includes('xls') ? 'xlsx'
              : doc.file_type.includes('ppt') ? 'ppt'
              : doc.file_type.includes('image') ? 'image'
              : 'file')
            : 'file',
          size: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
          modified: doc.created_at,
          owner: doc.owner_name || doc.owner_id,
          category: doc.categories && doc.categories.length > 0 ? doc.categories[0] : '--',
          path: doc.file_path,
          tags: doc.tags || [],
        }));
        setDocuments(transformed);
      } else {
        setDocuments([]);
      }
    } catch (err: any) {
      console.error('Error fetching trashed documents:', err);
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось получить список корзины',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDocuments = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocuments((prev) =>
      prev.includes(document.id)
        ? prev.filter((id) => id !== document.id)
        : [...prev, document.id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocuments(
      selectedDocuments.length === filteredDocuments.length
        ? []
        : filteredDocuments.map((d) => d.id)
    );
  };

  const handleRestore = async (document: Document) => {
    try {
      if ((document.id as any)?.startsWith?.('mock-')) {
        toast({ title: 'Успех', description: `Восстановлено (симуляция): ${document.name}` });
        setDocuments((prev) => prev.filter((d) => d.id !== document.id));
        return;
      }

      await recoverDocument(document.name, token);
      toast({ title: 'Успех', description: `Восстановлено: ${document.name}` });
      fetchTrashedDocuments();
    } catch (err: any) {
      console.error(`Error restoring ${document.name}:`, err);
      toast({
        title: 'Ошибка',
        description: err?.message || `Не удалось восстановить ${document.name}`,
        variant: 'destructive',
      });
    }
  };

  const handlePermanentDelete = async (document: Document) => {
    try {
      if ((document.id as any)?.startsWith?.('mock-')) {
        toast({ title: 'Успех', description: `Удалено навсегда (симуляция): ${document.name}` });
        setDocuments((prev) => prev.filter((d) => d.id !== document.id));
        return;
      }

      await permanentDeleteDocument(document.name, token);
      toast({ title: 'Успех', description: `Удалено навсегда: ${document.name}` });
      fetchTrashedDocuments();
    } catch (err: any) {
      console.error(`Error permanently deleting ${document.name}:`, err);
      toast({
        title: 'Ошибка',
        description: err?.message || `Не удалось удалить ${document.name}`,
        variant: 'destructive',
      });
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedDocuments.length === 0) return;
    const selected = documents.filter((d) => selectedDocuments.includes(d.id));

    // Поддержка моков
    if (selected.some((d: any) => d.id?.startsWith?.('mock-'))) {
      toast({
        title: 'Успех',
        description: `Восстановлено: ${selectedDocuments.length} документ(ов) (симуляция)`,
      });
      setDocuments((prev) => prev.filter((d) => !selectedDocuments.includes(d.id)));
      setSelectedDocuments([]);
      return;
    }

    let ok = 0;
    for (const doc of selected) {
      try {
        await recoverDocument(doc.name, token);
        ok++;
      } catch (e) {
        console.error(`Recover error for ${doc.name}`, e);
      }
    }

    if (ok > 0) {
      toast({ title: 'Успех', description: `Восстановлено: ${ok} документ(ов)` });
      fetchTrashedDocuments();
    }
    setSelectedDocuments([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0) return;
    const selected = documents.filter((d) => selectedDocuments.includes(d.id));

    // Поддержка моков
    if (selected.some((d: any) => d.id?.startsWith?.('mock-'))) {
      toast({
        title: 'Успех',
        description: `Удалено навсегда: ${selectedDocuments.length} документ(ов) (симуляция)`,
      });
      setDocuments((prev) => prev.filter((d) => !selectedDocuments.includes(d.id)));
      setSelectedDocuments([]);
      return;
    }

    let ok = 0;
    for (const doc of selected) {
      try {
        await permanentDeleteDocument(doc.name, token);
        ok++;
      } catch (e) {
        console.error(`Permanent delete error for ${doc.name}`, e);
      }
    }

    if (ok > 0) {
      toast({ title: 'Успех', description: `Удалено навсегда: ${ok} документ(ов)` });
      fetchTrashedDocuments();
    }
    setSelectedDocuments([]);
  };

  return (
    <div className="container px-4 ml-0 mr-0 w-full md:px-6" style={{ maxWidth: 'none' }}>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Документы</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Корзина</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Корзина</h1>
        <p className="text-muted-foreground">
          Удалённые документы будут отображаться здесь в течение 30 дней.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <SearchBar
          query={searchQuery}
          setQuery={setSearchQuery}
          placeholder="Search in trash..."
        />

        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid2X2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {selectedDocuments.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedDocuments.length} document(s) selected
          </span>
          <Button size="sm" onClick={handleRestoreSelected}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Восстановить
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 className="h-4 w-4 mr-1" />
            Удалить навсегда
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Archive className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
          <h3 className="text-lg font-medium mb-1">Загрузка корзины…</h3>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Корзина пуста</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            В корзине нет документов или по вашему запросу ничего не найдено.
          </p>
        </div>
      ) : (
        <DocumentTable
          documents={filteredDocuments}
          selectedDocuments={selectedDocuments}
          onDocumentSelect={handleDocumentSelect}
          onSelectAll={handleSelectAll}
          isTrashMode={true}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
        />
      )}
    </div>
  );
};

export default TrashBin;
