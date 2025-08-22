
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



const TrashBin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const token = localStorage.getItem('authToken');
  
  // Fetch trashed documents
  const fetchTrashedDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v2/trash", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trashed documents');
      }

      const data = await response.json();
      const docsKey = Object.keys(data).find(key => Array.isArray(data[key]));
      
      if (docsKey && Array.isArray(data[docsKey]) && data[docsKey].length > 0) {
        const transformedDocuments: Document[] = data[docsKey].map((doc: any) => ({
          id: doc.id,
          name: doc.name ? decodeURIComponent(doc.name) : 'Unnamed Document',
          type: doc.file_type ? (
            doc.file_type.includes('pdf') ? 'pdf' :
            doc.file_type.includes('doc') ? 'doc' :
            doc.file_type.includes('xls') ? 'xlsx' :
            doc.file_type.includes('ppt') ? 'ppt' :
            doc.file_type.includes('image') ? 'image' : 'file'
          ) : 'file',
          size: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
          modified: doc.created_at,
          owner: doc.owner_name || doc.owner_id,
          category: doc.categories && doc.categories.length > 0 ? doc.categories[0] : '--',
          path: doc.file_path,
          tags: doc.tags || []
        }));
        setDocuments(transformedDocuments);
    
      }
    } catch (error) {
      console.error('Error fetching trashed documents:', error);
      toast({
        title: "Info",
        description: "Using mock data for demonstration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocuments(prev => 
      prev.includes(document.id) 
        ? prev.filter(id => id !== document.id)
        : [...prev, document.id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocuments(
      selectedDocuments.length === filteredDocuments.length 
        ? [] 
        : filteredDocuments.map(doc => doc.id)
    );
  };

  const handleRestore = async (document: Document) => {
    try {
      if (document.id.startsWith('mock-')) {
        toast({
          title: "Success",
          description: `Restored ${document.name} (simulated)`,
        });
        setDocuments(prev => prev.filter(doc => doc.id !== document.id));
        return;
      }

      const encodedFileName = encodeURIComponent(document.name);
              await axios.post(`/api/v2/restore/${encodedFileName}`, {}, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      toast({
        title: "Success",
        description: `Restored ${document.name}`,
      });
      
      fetchTrashedDocuments();
    } catch (error) {
      console.error(`Error restoring document ${document.name}:`, error);
      toast({
        title: "Error",
        description: `Failed to restore ${document.name}`,
        variant: "destructive"
      });
    }
  };

  const handlePermanentDelete = async (document: Document) => {
    try {
      if (document.id.startsWith('mock-')) {
        toast({
          title: "Success",
          description: `Permanently deleted ${document.name} (simulated)`,
        });
        setDocuments(prev => prev.filter(doc => doc.id !== document.id));
        return;
      }

      const encodedFileName = encodeURIComponent(document.name);
              await axios.delete(`/api/v2/trash/${encodedFileName}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      toast({
        title: "Success",
        description: `Permanently deleted ${document.name}`,
      });
      
      fetchTrashedDocuments();
    } catch (error) {
      console.error(`Error permanently deleting document ${document.name}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${document.name}`,
        variant: "destructive"
      });
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedDocuments.length === 0) return;
    
    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    
    if (selectedDocs.some(doc => doc.id.startsWith('mock-'))) {
      toast({
        title: "Success",
        description: `Restored ${selectedDocuments.length} document(s) (simulated)`,
      });
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
      return;
    }

    let successCount = 0;
    for (const doc of selectedDocs) {
      try {
        const encodedFileName = encodeURIComponent(doc.name);
        await axios.post(`/api/v2/restore/${encodedFileName}`, {}, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        successCount++;
      } catch (error) {
        console.error(`Error restoring document ${doc.name}:`, error);
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `Restored ${successCount} document(s)`,
      });
      fetchTrashedDocuments();
    }

    setSelectedDocuments([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0) return;
    
    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    
    if (selectedDocs.some(doc => doc.id.startsWith('mock-'))) {
      toast({
        title: "Success",
        description: `Permanently deleted ${selectedDocuments.length} document(s) (simulated)`,
      });
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
      return;
    }

    let successCount = 0;
    for (const doc of selectedDocs) {
      try {
        const encodedFileName = encodeURIComponent(doc.name);
        await axios.delete(`/api/v2/trash/${encodedFileName}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        successCount++;
      } catch (error) {
        console.error(`Error permanently deleting document ${doc.name}:`, error);
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `Permanently deleted ${successCount} document(s)`,
      });
      fetchTrashedDocuments();
    }

    setSelectedDocuments([]);
  };

  return (
    <div className="container px-4 ml-0 mr-0 w-full md:px-6" style={{ maxWidth: "none" }}>
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
          Удаленные документы будут отображаться здесь в течение 30 дней.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <SearchBar 
          query={searchQuery} 
          setQuery={setSearchQuery} 
          placeholder="Search in trash..." 
        />
        
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
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

      {filteredDocuments.length === 0 ? (
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
