import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { DocumentGrid } from '@/components/DocumentGrid';
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
import { Trash2, RotateCcw, Grid2X2, List } from 'lucide-react';
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

const TrashBin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Auth token
  const token = localStorage.getItem('authToken');
  
  // Fetch trashed documents
  const fetchTrashedDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/v2/trash", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trashed documents');
      }

      const data = await response.json();
      // Transform backend documents to match our Document interface
      const docsKey = Object.keys(data).find(key => Array.isArray(data[key]));
      
      if (docsKey && Array.isArray(data[docsKey])) {
        const transformedDocuments: Document[] = data[docsKey].map((doc: BackendDocument) => ({
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
          owner: doc.owner_id,
          category: doc.categories && doc.categories.length > 0 ? doc.categories[0] : 'uncategorized',
          path: doc.file_path,
          tags: doc.tags || []
        }));
        setDocuments(transformedDocuments);
      } else {
        console.error('No documents array found in response:', data);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching trashed documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trashed documents",
        variant: "destructive"
      });
      setDocuments([]);
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

  const handleDocumentClick = (document: Document) => {
    toast({
      title: "Document selected",
      description: `Selected: ${document.name}`,
    });
  };

  const handleDocumentSelect = (document: Document) => {
    if (selectedDocuments.includes(document.id)) {
      // If already selected, remove from selection
      setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
      
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
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
      
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

  // Restore document(s) from bin
  const handleRestoreSelected = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "Error",
        description: "No documents selected for restoration",
        variant: "destructive"
      });
      return;
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    let successCount = 0;
    let failCount = 0;

    for (const doc of selectedDocs) {
      try {
        const encodedFileName = encodeURIComponent(doc.name);
        await axios.post(`http://localhost:8000/v2/restore/${encodedFileName}`, {}, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        successCount++;
      } catch (error) {
        console.error(`Error restoring document ${doc.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `Restored ${successCount} document(s)`,
      });
      fetchTrashedDocuments(); // Refresh the list
    }

    if (failCount > 0) {
      toast({
        title: "Error",
        description: `Failed to restore ${failCount} document(s)`,
        variant: "destructive"
      });
    }

    setSelectedDocuments([]);
    setSelectedDocument(null);
  };

  // Permanently delete document(s)
  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "Error",
        description: "No documents selected for deletion",
        variant: "destructive"
      });
      return;
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    let successCount = 0;
    let failCount = 0;

    for (const doc of selectedDocs) {
      try {
        const encodedFileName = encodeURIComponent(doc.name);
        await axios.delete(`http://localhost:8000/v2/trash/${encodedFileName}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        successCount++;
      } catch (error) {
        console.error(`Error permanently deleting document ${doc.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `Permanently deleted ${successCount} document(s)`,
      });
      fetchTrashedDocuments(); // Refresh the list
    }

    if (failCount > 0) {
      toast({
        title: "Error",
        description: `Failed to delete ${failCount} document(s)`,
        variant: "destructive"
      });
    }

    setSelectedDocuments([]);
    setSelectedDocument(null);
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
          Документы в корзине будут удалены навсегда через 30 дней.
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

      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Корзина пуста</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            No documents have been deleted or your search doesn't match any deleted documents.
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
            onDeleteSelected: handleDeleteSelected,
            onRestoreSelected: handleRestoreSelected
          }}
          onDocumentPreview={(document) => {
            // You can customize this handler as needed
            toast({
              title: "Preview not implemented",
              description: `Preview for: ${document.name}`,
            });
          }}
        />
      )}
    </div>
  );
};

export default TrashBin;
