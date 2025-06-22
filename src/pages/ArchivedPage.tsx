
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

// Mock archived documents
const mockArchivedDocuments: Document[] = [
  {
    id: 'arch-1',
    name: 'Quarterly Financial Report Q3 2024.pdf',
    type: 'pdf',
    size: '3.2 MB',
    modified: '2024-01-20T14:30:00Z',
    owner: 'Sarah Johnson',
    category: 'Financial reports and analysis',
    path: '/finance/q3-report.pdf',
    tags: ['quarterly', 'finance', 'report'],
    archived: true
  },
  {
    id: 'arch-2',
    name: 'Product Development Roadmap 2024',
    type: 'folder',
    size: '125 MB',
    modified: '2024-01-18T09:15:00Z',
    owner: 'Mike Chen',
    category: 'Product development plans',
    path: '/products/roadmap-2024/',
    tags: ['product', 'roadmap', '2024'],
    archived: true
  },
  {
    id: 'arch-3',
    name: 'Marketing Campaign Analysis.xlsx',
    type: 'xlsx',
    size: '2.8 MB',
    modified: '2024-01-15T16:45:00Z',
    owner: 'Emma Davis',
    category: 'Marketing performance data',
    path: '/marketing/campaign-analysis.xlsx',
    tags: ['marketing', 'analysis', 'campaign'],
    archived: true
  },
  {
    id: 'arch-4',
    name: 'Technical Documentation v2.1.docx',
    type: 'doc',
    size: '1.5 MB',
    modified: '2024-01-12T11:20:00Z',
    owner: 'Alex Thompson',
    category: 'Technical documentation',
    path: '/docs/tech-docs-v2.docx',
    tags: ['technical', 'documentation', 'v2'],
    archived: true
  },
  {
    id: 'arch-5',
    name: 'Company Logo Variations',
    type: 'folder',
    size: '45 MB',
    modified: '2024-01-10T13:30:00Z',
    owner: 'Lisa Wang',
    category: 'Brand assets and guidelines',
    path: '/assets/logo-variations/',
    tags: ['branding', 'logo', 'assets'],
    archived: true
  },
  {
    id: 'arch-6',
    name: 'Project Timeline.pdf',
    type: 'pdf',
    size: '890 KB',
    modified: '2024-01-08T10:15:00Z',
    owner: 'David Brown',
    category: 'Project management documents',
    path: '/projects/timeline.pdf',
    tags: ['project', 'timeline', 'planning'],
    archived: true
  }
];

const ArchivedPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would fetch from API
    setDocuments(mockArchivedDocuments);
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

  const handleRestore = (document: Document) => {
    toast({
      title: "Document restored",
      description: `${document.name} has been restored from archive`,
    });
    setDocuments(prev => prev.filter(doc => doc.id !== document.id));
  };

  const handlePermanentDelete = (document: Document) => {
    toast({
      title: "Document deleted",
      description: `${document.name} has been permanently deleted`,
      variant: "destructive"
    });
    setDocuments(prev => prev.filter(doc => doc.id !== document.id));
  };

  const handleRestoreSelected = () => {
    if (selectedDocuments.length === 0) return;
    
    toast({
      title: "Documents restored",
      description: `${selectedDocuments.length} document(s) restored from archive`,
    });
    
    setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
    setSelectedDocuments([]);
  };

  const handleDeleteSelected = () => {
    if (selectedDocuments.length === 0) return;
    
    toast({
      title: "Documents deleted",
      description: `${selectedDocuments.length} document(s) permanently deleted`,
      variant: "destructive"
    });
    
    setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
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

      {filteredDocuments.length === 0 ? (
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
