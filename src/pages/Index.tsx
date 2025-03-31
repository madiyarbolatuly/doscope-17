import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { useToast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { RoleSelector } from '@/components/RoleSelector';
import { useRoleBasedDocuments } from '@/hooks/useRoleBasedDocuments';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { useNavigate } from 'react-router-dom';

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
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    roles,
    selectedRole,
    documents: roleDocuments,
    isLoading,
    handleRoleChange,
    uploadFile,
    downloadFile,
    deleteFile,
    fetchDocumentsByRole
  } = useRoleBasedDocuments();

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  useEffect(() => {
    let filteredDocs = [...mockDocuments];
    
    if (selectedRole) {
      filteredDocs = roleDocuments;
    } else {
      if (category !== 'all') {
        if (category === 'favorites') {
          filteredDocs = filteredDocs.filter(doc => doc.favorited);
        } else if (category === 'shared') {
          filteredDocs = filteredDocs.filter(doc => doc.shared);
        } else if (category === 'recent') {
          filteredDocs = [...filteredDocs]
            .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
            .slice(0, 5);
        } else if (category === 'trash') {
          filteredDocs = [];
        } else {
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
    }
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => 
        doc.name.toLowerCase().includes(query) || 
        doc.owner.toLowerCase().includes(query)
      );
    }
    
    setDocuments(filteredDocs);
  }, [category, searchQuery, selectedRole, roleDocuments]);

  const handleDocumentClick = (document: Document) => {
    if (selectedRole && document.type !== 'folder') {
      downloadFile();
    } else {
      toast({
        title: "Документ выбран",
        description: `Вы выбрали: ${document.name}`,
      });
    }
  };

  const handleDocumentSelect = (document: Document) => {
    if (selectedDocumentIds.includes(document.id)) {
      setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== document.id));
      
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } else {
      setSelectedDocumentIds([...selectedDocumentIds, document.id]);
      
      if (selectedDocumentIds.length === 0) {
        setSelectedDocument(document);
        setShowSidebar(true);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedDocumentIds.length === documents.length) {
      setSelectedDocumentIds([]);
      setSelectedDocument(null);
      setShowSidebar(false);
    } else {
      setSelectedDocumentIds(documents.map(doc => doc.id));
      
      if (!selectedDocument && documents.length > 0) {
        setSelectedDocument(documents[0]);
        setShowSidebar(true);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedDocumentIds([]);
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const handleDeleteSelected = () => {
    if (selectedRole && selectedDocumentIds.length > 0) {
      const selectedDocuments = documents.filter(doc => selectedDocumentIds.includes(doc.id));
      
      selectedDocuments.forEach(() => {
        deleteFile();
      });
      
      setSelectedDocumentIds([]);
      setSelectedDocument(null);
      setShowSidebar(false);
    } else {
      toast({
        title: "Удаление документов",
        description: `Выбрано ${selectedDocumentIds.length} документов для удаления`,
      });
      setSelectedDocumentIds([]);
      setSelectedDocument(null);
      setShowSidebar(false);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedRole && selectedDocumentIds.length > 0) {
      const selectedDocuments = documents.filter(doc => selectedDocumentIds.includes(doc.id));
      
      selectedDocuments.forEach(() => {
        downloadFile();
      });
    } else {
      toast({
        title: "Скачивание документов",
        description: `Выбрано ${selectedDocumentIds.length} документов для скачивания`,
      });
    }
  };

  const handleShareSelected = () => {
    toast({
      title: "Общий доступ",
      description: `Выбрано ${selectedDocumentIds.length} документов для общего доступа`,
    });
  };

  const handleCloseSidebar = () => {
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const getCategoryTitle = (type: CategoryType): string => {
    if (selectedRole) {
      return `Папка: ${selectedRole}`;
    }
    
    switch (type) {
      case 'all':
        return 'Все документы';
      case 'recent':
        return 'Недавние документы';
      case 'shared':
        return 'Общий доступ';
      case 'favorites':
        return 'Избранное';
      case 'trash':
        return 'Корзина';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (fileToUpload) {
      uploadFile();
      setFileToUpload(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } else {
      toast({
        title: "Ошибка загрузки",
        description: "Пожалуйста, выберите файл для загрузки",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    if (selectedRole) {
      fetchDocumentsByRole();
    }
  };

  const handleSelectDestination = (destination: 'downloads' | 'new') => {
    toast({
      title: "Папка выбрана",
      description: destination === 'downloads' ? "Выбрана папка Загрузки" : "Выбрана Новая папка",
    });
  };

  const handleCreateFolder = () => {
    toast({
      title: "Создание новой папки",
      description: "Функция создания новой папки будет реализована в будущем.",
    });
  };

  const handleUploadToDestination = () => {
    toast({
      title: "Переход к загрузке",
      description: "Переход на страницу загрузки файлов.",
    });
    setShowUploadDialog(false);
    navigate('/upload');
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
              
              <div className="mt-4 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Обновить
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowUploadDialog(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Загрузить
                </Button>
              </div>
              
              <div className="mt-4 animate-fade-in">
                <DocumentGrid 
                  documents={documents} 
                  onDocumentClick={handleDocumentClick}
                  viewMode={viewMode}
                  selectedDocument={selectedDocument}
                  onDocumentSelect={handleDocumentSelect}
                  multipleSelection={true}
                  selectionActions={{
                    selectedIds: selectedDocumentIds,
                    onSelectAll: handleSelectAll,
                    onClearSelection: handleClearSelection,
                    onDeleteSelected: handleDeleteSelected,
                    onDownloadSelected: handleDownloadSelected,
                    onShareSelected: handleShareSelected
                  }}
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
      
      <FileUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSelectDestination={handleSelectDestination}
        onCreateFolder={handleCreateFolder}
        onUpload={handleUploadToDestination}
      />
    </div>
  );
};

export default Index;
