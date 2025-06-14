import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { DocumentGrid } from '@/components/DocumentGrid';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Document } from '@/types/document';
import { Star, Grid2X2, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface BackendDocument {
  owner_id: string;
  name: string;
  file_path: string;
  created_at: string;
  size: number;
  file_type: string;
  tags: string[] | null;
  categories: string[] | null;
  status: string;
  file_hash: string;
  access_to: string[] | null;
  id: string;
}

const Favorites = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Auth token
  const token = localStorage.getItem('authToken');

  // Fetch favorite documents from backend
  const fetchFavoriteDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/v2/favorites', {
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
          favorited: doc.is_starred === true || doc.favorited === true || doc.starred === true, // robust mapping
          starred: doc.is_starred === true || doc.favorited === true || doc.starred === true,
        }));
        setDocuments(transformedDocuments);
      } else {
        console.error('No documents array found in response:', data);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching favorite documents:', error);
      toast({
        title: 'Error',
        description: 'Не удалось загрузить избранные документы',
        variant: 'destructive',
      });
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteDocuments();
  }, []);

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDocumentClick = (document: Document) => {
    toast({
      title: 'Документ выбран',
      description: `Выбран: ${document.name}`,
    });
  };

  const handleDocumentSelect = (document: Document) => {
    if (selectedDocuments.includes(document.id)) {
      // If already selected, remove from selection
      setSelectedDocuments(selectedDocuments.filter((id) => id !== document.id));

      // Clear selected document if it's the one being deselected
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
      }
    } else {
      // Add to selection
      setSelectedDocuments([...selectedDocuments, document.id]);

      // If this is the first selection, set as selected document
      if (selectedDocuments.length === 0) {
        setSelectedDocument(document);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      // If all are already selected, clear selection
      setSelectedDocuments([]);
      setSelectedDocument(null);
    } else {
      // Select all documents
      setSelectedDocuments(filteredDocuments.map((doc) => doc.id));

      // If no document was previously selected, select the first one
      if (!selectedDocument && filteredDocuments.length > 0) {
        setSelectedDocument(filteredDocuments[0]);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedDocuments([]);
    setSelectedDocument(null);
  };

  // Favorite/unfavorite selected document(s)
  const handleFavoriteSelected = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Нет выбранных документов для добавления в избранное',
        variant: 'destructive',
      });
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const docId of selectedDocuments) {
      try {
        const res = await fetch(`/v2/metadata/${docId}/star`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to favorite');
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
    if (successCount > 0) {
      toast({ title: 'Успех', description: `Добавлено в избранное: ${successCount} документ(ов)` });
      fetchFavoriteDocuments();
    }
    if (failCount > 0) {
      toast({ title: 'Ошибка', description: `Не удалось добавить: ${failCount} документ(ов)`, variant: 'destructive' });
    }
    setSelectedDocuments([]);
    setSelectedDocument(null);
  };
  const handleUnfavoriteSelected = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'Error',
        description: 'Нет выбранных документов для удаления из избранного',
        variant: 'destructive',
      });
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const docId of selectedDocuments) {
      try {
        const res = await fetch(`/v2/metadata/${docId}/star`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to unfavorite');
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
    if (successCount > 0) {
      toast({ title: 'Успех', description: `Удалено из избранного: ${successCount} документ(ов)` });
      fetchFavoriteDocuments();
    }
    if (failCount > 0) {
      toast({ title: 'Ошибка', description: `Не удалось удалить: ${failCount} документ(ов)`, variant: 'destructive' });
    }
    setSelectedDocuments([]);
    setSelectedDocument(null);
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
              <BreadcrumbPage>Избранные документы</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Избранные документы</h1>
        <p className="text-muted-foreground">
          Документы, которые вы отметили как избранные, будут отображаться здесь.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <SearchBar 
          query={searchQuery} 
          setQuery={setSearchQuery} 
          placeholder="Поиск в избранном..." 
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

      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Избранных документов нет</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Здесь пока нет документов или по вашему запросу ничего не найдено.
          </p>
        </div>
      ) : (
        <DocumentGrid
          documents={filteredDocuments}
          onDocumentClick={handleDocumentClick}
          viewMode={viewMode}
          selectedDocument={selectedDocument}
          onDocumentSelect={handleDocumentSelect}
          multipleSelection={true}
          selectionActions={{
            selectedIds: selectedDocuments,
            onSelectAll: handleSelectAll,
            onClearSelection: handleClearSelection,
            onFavoriteSelected: handleFavoriteSelected,
            onUnfavoriteSelected: handleUnfavoriteSelected,
            onDeleteSelected: handleUnfavoriteSelected,
          }}
          onDocumentPreview={(document) => {
            toast({
              title: 'Preview не реализован',
              description: `Preview для: ${document.name}`,
            });
          }}
        />
      )}
    </div>
  );
};

export default Favorites;
