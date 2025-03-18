
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { useToast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';

// Mock data
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Financial Report Q2 2023.pdf',
    type: 'pdf',
    size: '2.4 MB',
    modified: '2023-06-28T14:30:00',
    owner: 'John Smith',
    category: 'reports',
    favorited: true
  },
  {
    id: '2',
    name: 'Employee Handbook.doc',
    type: 'doc',
    size: '4.1 MB',
    modified: '2023-05-15T09:45:00',
    owner: 'HR Department',
    category: 'hr'
  },
  {
    id: '3',
    name: 'Project Proposal.ppt',
    type: 'ppt',
    size: '8.2 MB',
    modified: '2023-07-03T16:20:00',
    owner: 'Jane Cooper',
    category: 'reports',
    shared: true
  },
  {
    id: '4',
    name: 'Client Contract #1082.pdf',
    type: 'pdf',
    size: '1.7 MB',
    modified: '2023-07-10T11:15:00',
    owner: 'Legal Team',
    category: 'contracts'
  },
  {
    id: '5',
    name: 'Budget Spreadsheet.xlsx',
    type: 'xlsx',
    size: '3.5 MB',
    modified: '2023-06-20T13:45:00',
    owner: 'Finance Department',
    category: 'invoices',
    favorited: true
  },
  {
    id: '6',
    name: 'Meeting Notes.doc',
    type: 'doc',
    size: '0.5 MB',
    modified: '2023-07-12T15:30:00',
    owner: 'John Smith',
    category: 'reports',
    shared: true
  },
  {
    id: '7',
    name: 'Company Logo.png',
    type: 'image',
    size: '2.1 MB',
    modified: '2023-04-18T10:25:00',
    owner: 'Marketing Team',
    category: 'hr'
  },
  {
    id: '8',
    name: 'Invoice #10492.pdf',
    type: 'pdf',
    size: '1.2 MB',
    modified: '2023-07-05T09:10:00',
    owner: 'Finance Department',
    category: 'invoices'
  },
  {
    id: '9',
    name: 'Project Documents',
    type: 'folder',
    modified: '2023-06-30T14:00:00',
    owner: 'Project Team',
    category: 'reports'
  },
  {
    id: '10',
    name: 'Customer Agreement.pdf',
    type: 'pdf',
    size: '2.8 MB',
    modified: '2023-07-08T16:45:00',
    owner: 'Sales Department',
    category: 'contracts',
    favorited: true
  },
  {
    id: '11',
    name: 'Marketing Plan 2023.ppt',
    type: 'ppt',
    size: '5.3 MB',
    modified: '2023-06-15T11:30:00',
    owner: 'Marketing Team',
    category: 'reports'
  },
  {
    id: '12',
    name: 'Employee Directory.xlsx',
    type: 'xlsx',
    size: '1.9 MB',
    modified: '2023-05-28T13:15:00',
    owner: 'HR Department',
    category: 'hr'
  },
  // Add more folders for testing
  {
    id: '13',
    name: 'HR Documents',
    type: 'folder',
    modified: '2023-07-15T10:00:00',
    owner: 'HR Department',
    category: 'hr'
  },
  {
    id: '14',
    name: 'Financial Reports',
    type: 'folder',
    modified: '2023-07-12T14:30:00',
    owner: 'Finance Department',
    category: 'reports',
    favorited: true
  },
  {
    id: '15',
    name: 'Marketing Materials',
    type: 'folder',
    modified: '2023-07-05T09:45:00',
    owner: 'Marketing Team',
    category: 'marketing'
  },
  {
    id: '16',
    name: 'Client Contracts',
    type: 'folder',
    modified: '2023-06-28T16:20:00',
    owner: 'Legal Team',
    category: 'contracts',
    shared: true
  }
];

const Index = () => {
  const [category, setCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();

  // Filter documents based on category and search query
  useEffect(() => {
    let filteredDocs = [...mockDocuments];
    
    // Apply category filter
    if (category !== 'all') {
      if (category === 'favorites') {
        filteredDocs = filteredDocs.filter(doc => doc.favorited);
      } else if (category === 'shared') {
        filteredDocs = filteredDocs.filter(doc => doc.shared);
      } else if (category === 'recent') {
        // For demo purposes, we'll just show the 5 most recently modified
        filteredDocs = [...filteredDocs]
          .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
          .slice(0, 5);
      } else if (category === 'trash') {
        // Trash category logic
        filteredDocs = [];
      } else {
        // Filter by specific category - we map the new Russian categories to the existing ones
        if (category === 'managers') {
          filteredDocs = filteredDocs.filter(doc => doc.category === 'hr');
        } else if (category === 'development') {
          filteredDocs = filteredDocs.filter(doc => doc.category === 'reports');
        } else if (category === 'procurement') {
          filteredDocs = filteredDocs.filter(doc => doc.category === 'contracts');
        } else if (category === 'electrical' || category === 'weakening' || category === 'interface' || category === 'pse') {
          filteredDocs = filteredDocs.filter(doc => doc.category === 'invoices' || doc.category === 'marketing');
        } else {
          filteredDocs = filteredDocs.filter(doc => doc.category === category);
        }
      }
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => 
        doc.name.toLowerCase().includes(query) || 
        doc.owner.toLowerCase().includes(query)
      );
    }
    
    setDocuments(filteredDocs);
  }, [category, searchQuery]);

  const handleDocumentClick = (document: Document) => {
    toast({
      title: "Document Selected",
      description: `You selected: ${document.name}`,
    });
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const getCategoryTitle = (type: CategoryType): string => {
    switch (type) {
      case 'all':
        return 'Абен';
      case 'recent':
        return 'Recent Documents';
      case 'shared':
        return 'Shared with Me';
      case 'favorites':
        return 'Favorites';
      case 'trash':
        return 'Trash';
      case 'managers':
        return 'Руководители';
      case 'development':
        return 'Отдел развития';
      case 'procurement':
        return 'Прокюрмент';
      case 'electrical':
        return 'Электрические сети';
      case 'weakening':
        return 'Слаботочные системы';
      case 'interface':
        return 'Отдел интерфейс';
      case 'pse':
        return 'PSE DCC';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeCategory={category} onCategoryChange={setCategory} />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={showSidebar ? 75 : 100} minSize={30}>
          <main className="h-full overflow-auto">
            <div className="p-6">
              <PageHeader 
                title={getCategoryTitle(category)}
                categoryType={category}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
              
              <div className="mt-6 animate-fade-in">
                <DocumentGrid 
                  documents={documents} 
                  onDocumentClick={handleDocumentClick}
                  viewMode={viewMode}
                  selectedDocument={selectedDocument}
                  onDocumentSelect={handleDocumentSelect}
                />
              </div>
            </div>
          </main>
        </ResizablePanel>
        
        {showSidebar && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20}>
              <MetadataSidebar 
                document={selectedDocument || undefined} 
                onClose={handleCloseSidebar} 
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
