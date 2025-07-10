
import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { PageHeader } from '@/components/PageHeader';
import { DocumentGrid } from '@/components/DocumentGrid';
import { Sidebar } from '@/components/Sidebar';
import { FolderNavigation } from '@/components/FolderNavigation';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';
import { Document, CategoryType } from '@/types/document';
import { mockApi, MockDocument } from '@/services/mockApi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Filter, 
  Upload, 
  Download, 
  Share2, 
  Archive, 
  Trash2,
  RotateCcw,
  MoreVertical,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BreadcrumbItem {
  id?: string;
  name: string;
  path: string;
  isActive?: boolean;
}

type SortField = 'name' | 'modified' | 'size' | 'owner';
type SortOrder = 'asc' | 'desc';

const Documents = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { name: 'Документы', path: '/', isActive: true }
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load documents when category or folder changes
  useEffect(() => {
    loadDocuments();
  }, [activeCategory, currentFolderId, sortField, sortOrder]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const result = await mockApi.getDocuments({
        category: activeCategory,
        search: searchQuery,
        folderId: currentFolderId
      });
      
      let sortedDocs = [...result.documents];
      
      // Apply sorting
      sortedDocs.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'modified':
            aValue = new Date(a.modified);
            bValue = new Date(b.modified);
            break;
          case 'size':
            aValue = parseFloat(a.size);
            bValue = parseFloat(b.size);
            break;
          case 'owner':
            aValue = a.owner.toLowerCase();
            bValue = b.owner.toLowerCase();
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      setDocuments(sortedDocs);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить документы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDocumentClick = (document: Document) => {
    navigate(`/document/${document.id}`);
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.includes(document.id);
      if (isSelected) {
        return prev.filter(id => id !== document.id);
      } else {
        return [...prev, document.id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map(doc => doc.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedDocuments.length === 0) return;
    
    try {
      switch (action) {
        case 'download':
          for (const docId of selectedDocuments) {
            await mockApi.downloadDocument(docId);
          }
          toast({
            title: "Загрузки начаты",
            description: `Скачивание ${selectedDocuments.length} документов`
          });
          break;
        case 'archive':
          for (const docId of selectedDocuments) {
            await mockApi.archiveDocument(docId);
          }
          loadDocuments();
          toast({
            title: "Документы архивированы",
            description: `${selectedDocuments.length} документов перемещено в архив`
          });
          break;
        case 'trash':
          for (const docId of selectedDocuments) {
            await mockApi.moveToTrash(docId);
          }
          loadDocuments();
          toast({
            title: "Документы удалены",
            description: `${selectedDocuments.length} документов перемещено в корзину`
          });
          break;
      }
      setSelectedDocuments([]);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive"
      });
    }
  };

  const handleFolderChange = (folderId?: string) => {
    setCurrentFolderId(folderId);
    setSelectedDocuments([]);
    
    // Update breadcrumbs (simplified)
    if (!folderId) {
      setBreadcrumbs([{ name: 'Документы', path: '/', isActive: true }]);
    } else {
      setBreadcrumbs([
        { name: 'Документы', path: '/', isActive: false },
        { id: folderId, name: 'Текущая папка', path: `/folder/${folderId}`, isActive: true }
      ]);
    }
  };

  const handleBreadcrumbNavigate = (item: BreadcrumbItem) => {
    if (item.id) {
      setCurrentFolderId(item.id);
    } else {
      setCurrentFolderId(undefined);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      await mockApi.uploadFiles(files, currentFolderId);
      loadDocuments();
      toast({
        title: "Файлы загружены",
        description: `Успешно загружено ${files.length} файлов`
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файлы",
        variant: "destructive"
      });
    }
  };

  const handleDocumentPreview = async (document: Document) => {
    try {
      await mockApi.previewDocument(document.id);
      toast({
        title: 'Предпросмотр',
        description: `Открытие ${document.name}`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть предпросмотр",
        variant: "destructive"
      });
    }
  };

  const handleToggleFavorite = async (document: Document) => {
    try {
      await mockApi.toggleFavorite(document.id);
      loadDocuments();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус избранного",
        variant: "destructive"
      });
    }
  };

  const handleCreateDocument = () => {
    setShowUploadDialog(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation 
            items={breadcrumbs}
            onNavigate={handleBreadcrumbNavigate}
          />

          <PageHeader 
            title="Документы"
            categoryType={activeCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
          >
            <div className="flex items-center gap-2">
              {/* Selection Actions */}
              {selectedDocuments.length > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <Badge variant="secondary">{selectedDocuments.length} выбрано</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Действия
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('download')}>
                        <Download className="h-4 w-4 mr-2" />
                        Скачать выбранные
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                        <Archive className="h-4 w-4 mr-2" />
                        Архивировать
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleBulkAction('trash')}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              
              {/* Sort Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-1" /> : <SortDesc className="h-4 w-4 mr-1" />}
                    Сортировка
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'name'}
                    onCheckedChange={() => setSortField('name')}
                  >
                    Название
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'modified'}
                    onCheckedChange={() => setSortField('modified')}
                  >
                    Дата изменения
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'size'}
                    onCheckedChange={() => setSortField('size')}
                  >
                    Размер
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'owner'}
                    onCheckedChange={() => setSortField('owner')}
                  >
                    Владелец
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                    {sortOrder === 'asc' ? 'По убыванию' : 'По возрастанию'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Фильтры
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateDocument}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Загрузить
              </Button>
            </div>
          </PageHeader>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Загрузка...</div>
            </div>
          ) : (
            <FolderNavigation
              currentFolderId={currentFolderId}
              onFolderChange={handleFolderChange}
              onDocumentClick={handleDocumentClick}
              onDocumentPreview={handleDocumentPreview}
              viewMode={viewMode}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>
      
      <FileUploadDialog 
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSelectDestination={() => {}}
        onCreateFolder={() => {}}
        onUpload={() => {
          setShowUploadDialog(false);
          navigate('/fileupload');
        }}
      />
    </div>
  );
};

export default Documents;
