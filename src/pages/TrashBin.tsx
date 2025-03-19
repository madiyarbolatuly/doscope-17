
import React, { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DocumentCard } from '@/components/DocumentCard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Document } from '@/types/document';
import { Trash2, RotateCcw } from 'lucide-react';

// Mock deleted documents
const mockDeletedDocuments: Document[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'pdf',
    size: '2.4 MB',
    modified: new Date(Date.now() - 3600000).toISOString(),
    owner: 'Alex Johnson',
    category: 'projects'
  },
  {
    id: '2',
    name: 'Meeting Notes.doc',
    type: 'doc',
    size: '1.2 MB',
    modified: new Date(Date.now() - 86400000).toISOString(),
    owner: 'Sarah Miller',
    category: 'meetings'
  },
  {
    id: '3',
    name: 'Budget Analysis.xlsx',
    type: 'xlsx',
    size: '3.1 MB',
    modified: new Date(Date.now() - 172800000).toISOString(),
    owner: 'David Chen',
    category: 'finance'
  }
];

const TrashBin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  
  const filteredDocuments = mockDeletedDocuments.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDocumentClick = (document: Document) => {
    if (selectedDocuments.includes(document.id)) {
      setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
    } else {
      setSelectedDocuments([...selectedDocuments, document.id]);
    }
  };

  const handleSelectDocument = (document: Document) => {
    if (selectedDocuments.includes(document.id)) {
      setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
    } else {
      setSelectedDocuments([...selectedDocuments, document.id]);
    }
  };

  const handleRestoreSelected = () => {
    console.log('Restoring documents:', selectedDocuments);
    // In a real app, you'd call an API to restore these documents
    setSelectedDocuments([]);
  };

  const handleDeleteSelected = () => {
    console.log('Permanently deleting documents:', selectedDocuments);
    // In a real app, you'd call an API to permanently delete these documents
    setSelectedDocuments([]);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
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
          Документы в корзине будут удалены навсегда через 30 дней.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <SearchBar 
          query={searchQuery} 
          setQuery={setSearchQuery} 
          placeholder="Поиск в корзине..." 
        />
        
        <div className="flex gap-2">
          {selectedDocuments.length > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={handleRestoreSelected}
                className="flex items-center gap-1"
              >
                <RotateCcw size={16} />
                <span>Восстановить выбранные ({selectedDocuments.length})</span>
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteSelected}
                className="flex items-center gap-1"
              >
                <Trash2 size={16} />
                <span>Удалить навсегда</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Корзина пуста</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Документы не были удалены или ваш поиск не соответствует удаленным документам.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map(doc => (
            <div 
              key={doc.id} 
              className={`cursor-pointer ${selectedDocuments.includes(doc.id) ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleDocumentClick(doc)}
            >
              <DocumentCard 
                document={doc} 
                onClick={() => {}}
                isSelected={selectedDocuments.includes(doc.id)}
                onSelect={() => handleSelectDocument(doc)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashBin;
