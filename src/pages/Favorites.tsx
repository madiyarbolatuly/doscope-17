
import React, { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
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
import { useFavoriteDocuments } from '@/hooks/useFavoriteDocuments';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import { DocumentListItem } from '@/components/DocumentListItem';

const Favorites = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  const { documents, loading, toggleFavorite } = useFavoriteDocuments();
  const { selectedDocuments, handleDocumentSelect, handleSelectAll, clearSelection } = useDocumentSelection();

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDocumentClick = (document: Document) => {
    toast({
      title: 'Документ выбран',
      description: `Выбран: ${document.name}`,
    });
  };

  const handleDocumentSelectWrapper = (document: Document) => {
    handleDocumentSelect(document);
    if (selectedDocuments.length === 0) {
      setSelectedDocument(document);
    } else if (selectedDocument?.id === document.id) {
      setSelectedDocument(null);
    }
  };

  const handleSelectAllWrapper = () => {
    handleSelectAll(filteredDocuments);
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocument(null);
    } else if (filteredDocuments.length > 0) {
      setSelectedDocument(filteredDocuments[0]);
    }
  };

  const handleClearSelection = () => {
    clearSelection();
    setSelectedDocument(null);
  };
  const handleToggleFavorite = async (id: string) => {
    const idx = documents.findIndex(d => d.id === id);
    if (idx === -1) return;
  };

  if (loading) {
    return <div className="flex justify-center py-8">Загрузка...</div>;
  }

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
) : viewMode === 'grid' ? (
  <DocumentGrid
    documents={filteredDocuments}
    onDocumentClick={handleDocumentClick}
    selectedDocument={selectedDocument}
    onDocumentSelect={handleDocumentSelectWrapper}
    multipleSelection
    selectionActions={{
      selectedIds: selectedDocuments,
      onSelectAll: handleSelectAllWrapper,
      onClearSelection: handleClearSelection,
      onDeleteSelected: async () => {},   // add stub if required
      onDownloadSelected: () => {},
      onShareSelected: () => {},
      onArchiveSelected: async () => {},
    }}
    
    onDocumentPreview={async (document) => {
  toast({
    title: 'Preview не реализован',
    description: `Preview для: ${document.name}`,
  });
}}

toggleFavorite={handleToggleFavorite}   // ✅ just pass the function
  />
) : (
  filteredDocuments.map((doc) => (
    <DocumentListItem
      key={doc.id}
      document={doc}
      onClick={handleDocumentClick} // ✅ соответствует props
      onPreview={(document) =>
        toast({
          title: 'Preview не реализован',
          description: `Preview для: ${document.name}`,
        })
      }
      isSelected={selectedDocuments.includes(doc.id)} // ✅ отметка выбора
      onSelect={() => handleDocumentSelectWrapper(doc)}
      multipleSelection
      onToggleFavorite={() => handleToggleFavorite(doc.id)}
    />
  ))
) // ✅ correct prop name
})

    </div>
  );
};

export default Favorites;
