
import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { DocumentTable } from '@/components/DocumentTable';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Document } from '@/types/document';
import { Archive, Grid2X2, List, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArchivedDocuments, unarchiveDocument, deleteDocument } from '@/services/archiveService';

interface BackendArchivedDocument {
  id: string;
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
  parent_id: string | null;
  owner_id: string;
}

const ArchivedPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const token = localStorage.getItem('authToken');

  // Fetch archived documents from API
  const fetchArchivedDocuments = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await getArchivedDocuments(token);
      
      if (response.documents && Array.isArray(response.documents)) {
        const transformedDocuments: Document[] = response.documents.map((doc: BackendArchivedDocument) => ({
          id: doc.id,
          name: doc.name ? decodeURIComponent(doc.name) : 'Unnamed Document',
          type: doc.file_type ? (
            doc.file_type.includes('pdf') ? 'pdf' :
            doc.file_type.includes('doc') ? 'doc' :
            doc.file_type.includes('xls') ? 'xlsx' :
            doc.file_type.includes('ppt') ? 'ppt' :
            doc.file_type.includes('pptx') ? 'pptx' :
            doc.file_type.includes('png') ? 'png' :
            doc.file_type.includes('image') ? 'image' : 'file'
          ) : 'file',
          size: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
          modified: doc.created_at,
          owner: doc.owner_id,
          category: doc.categories?.[0] || 'uncategorized',
          path: doc.file_path,
          tags: doc.tags || [],
          parent_id: doc.parent_id ?? null,
          archived: true,
          starred: false,
        }));
        
        setDocuments(transformedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (error: any) {
      console.error('Error fetching archived documents:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch archived documents",
        variant: "destructive"
      });
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedDocuments();
  }, [token]);

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
    if (!token) return;
    
    try {
      await unarchiveDocument(document.name, token);
      
      toast({
        title: "Success",
        description: `${document.name} has been restored from archive`,
      });
      
      // Refresh the list
      fetchArchivedDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore document",
        variant: "destructive"
      });
    }
  };

  const handlePermanentDelete = async (document: Document) => {
    if (!token) return;
    
    try {
      await deleteDocument(document.id, token);
      
      toast({
        title: "Success",
        description: `${document.name} has been permanently deleted`,
        variant: "destructive"
      });
      
      // Refresh the list
      fetchArchivedDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedDocuments.length === 0 || !token) return;
    
    let successCount = 0;
    let failCount = 0;
    
    for (const docId of selectedDocuments) {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        try {
          await unarchiveDocument(doc.name, token);
          successCount++;
        } catch (error) {
          console.error(`Error restoring document ${doc.name}:`, error);
          failCount++;
        }
      }
    }
    
    if (successCount > 0) {
      toast({
        title: "Success",
        description: `${successCount} document(s) restored from archive${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
      
      setSelectedDocuments([]);
      fetchArchivedDocuments();
    } else {
      toast({
        title: "Error",
        description: "Failed to restore any documents",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0 || !token) return;
    
    let successCount = 0;
    let failCount = 0;
    
    for (const docId of selectedDocuments) {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        try {
          await deleteDocument(doc.id, token);
          successCount++;
        } catch (error) {
          console.error(`Error deleting document ${doc.name}:`, error);
          failCount++;
        }
      }
    }
    
    if (successCount > 0) {
      toast({
        title: "Success",
        description: `${successCount} document(s) permanently deleted${failCount > 0 ? `, ${failCount} failed` : ''}`,
        variant: "destructive"
      });
      
      setSelectedDocuments([]);
      fetchArchivedDocuments();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete any documents",
        variant: "destructive"
      });
    }
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
              <BreadcrumbPage>Архивированные документы</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Архивированные документы</h1>
        <p className="text-muted-foreground">
          Документы, которые вы архивировали, будут отображаться здесь.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <SearchBar 
          query={searchQuery} 
          setQuery={setSearchQuery} 
          placeholder="Search archived documents..." 
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
            Restore
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete permanently
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Archive className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
          <h3 className="text-lg font-medium mb-1">Loading archived documents...</h3>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Архив пуста</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            В архиве нет документов или по вашему запросу ничего не найдено.
          </p>
        </div>
      ) : (
        <DocumentTable
          documents={filteredDocuments}
          selectedDocuments={selectedDocuments}
          onDocumentSelect={handleDocumentSelect}
          onSelectAll={handleSelectAll}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
        />
      )}
    </div>
  );
};

export default ArchivedPage;
