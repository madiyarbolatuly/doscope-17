
import React, { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { PageHeader } from '@/components/PageHeader';
import { DocumentGrid } from '@/components/DocumentGrid';
import { Sidebar } from '@/components/Sidebar';
import { Document, CategoryType } from '@/types/document';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Filter } from 'lucide-react';

// Mock documents data (reusing the same mock data from Dashboard)
const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    name: 'Annual Report 2023.pdf',
    type: 'pdf',
    size: '4.2 MB',
    modified: new Date(Date.now() - 3600000).toISOString(),
    owner: 'Alex Johnson',
    category: 'reports',
    favorited: true
  },
  {
    id: '2',
    name: 'Project Proposal.doc',
    type: 'doc',
    size: '2.7 MB',
    modified: new Date(Date.now() - 86400000).toISOString(),
    owner: 'Sarah Miller',
    category: 'projects'
  },
  {
    id: '3',
    name: 'Financial Analysis.xlsx',
    type: 'xlsx',
    size: '1.8 MB',
    modified: new Date(Date.now() - 172800000).toISOString(),
    owner: 'David Chen',
    category: 'finance'
  },
  {
    id: '4',
    name: 'Marketing Presentation.ppt',
    type: 'ppt',
    size: '5.3 MB',
    modified: new Date(Date.now() - 259200000).toISOString(),
    owner: 'Emily Wang',
    category: 'marketing',
    shared: true
  },
  {
    id: '5',
    name: 'Product Roadmap.pdf',
    type: 'pdf',
    size: '3.1 MB',
    modified: new Date(Date.now() - 345600000).toISOString(),
    owner: 'Alex Johnson',
    category: 'products'
  },
  {
    id: '6',
    name: 'Design Assets',
    type: 'folder',
    modified: new Date(Date.now() - 432000000).toISOString(),
    owner: 'Michelle Lee',
    category: 'design'
  }
];

const Documents = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredDocuments = MOCK_DOCUMENTS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || 
                          activeCategory === 'recent' || 
                          activeCategory === 'shared' && doc.shared ||
                          activeCategory === 'favorites' && doc.favorited ||
                          doc.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDocumentClick = (document: Document) => {
    navigate(`/document/${document.id}`);
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleCreateDocument = () => {
    setShowUploadDialog(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <PageHeader 
            title="Документы"
            categoryType={activeCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
          >
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {}}
              >
                <Filter className="h-4 w-4" />
                Фильтры
              </Button>
              <Button 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateDocument}
              >
                <Plus className="h-4 w-4" />
                Новый документ
              </Button>
            </div>
          </PageHeader>
          
          <DocumentGrid 
            documents={filteredDocuments} 
            onDocumentClick={handleDocumentClick}
            viewMode={viewMode}
            selectedDocument={selectedDocument}
            onDocumentSelect={handleDocumentSelect}
          />
        </div>
      </div>
      
      <FileUploadDialog 
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSelectDestination={() => {}}
        onCreateFolder={() => {}}
        onUpload={() => {
          setShowUploadDialog(false);
          navigate('/upload');
        }}
      />
    </div>
  );
};

export default Documents;
