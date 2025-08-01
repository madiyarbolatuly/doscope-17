import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryType, Document } from '@/types/document';
import { PageHeader } from '@/components/PageHeader';
import { Sidebar } from '@/components/Sidebar';
import { FolderNavigation } from '@/components/FolderNavigation';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';
import { RootFolderAccess } from '@/components/RootFolderAccess';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { DocumentControls } from '@/components/features/documents/DocumentControls';
import { useDocumentsManagement } from '@/hooks/useDocumentsManagement';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

const Documents = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Custom hooks for state management
  const {
    documents,
    loading,
    sortField,
    sortOrder,
    searchQuery,
    setSortField,
    setSortOrder,
    setSearchQuery,
    loadDocuments,
    handleFileUpload
  } = useDocumentsManagement({ activeCategory, currentFolderId });

  const {
    selectedDocuments,
    handleDocumentSelect,
    handleSelectAll,
    clearSelection
  } = useDocumentSelection();

  const {
    handleDocumentPreview,
    handleToggleFavorite,
    handleBulkAction
  } = useDocumentActions();

  const {
    breadcrumbs,
    updateBreadcrumbs,
    handleBreadcrumbNavigate
  } = useBreadcrumbNavigation();

  const handleDocumentClick = (document: Document) => {
    navigate(`/document/${document.id}`);
  };

  const handleFolderChange = (folderId?: string) => {
    setCurrentFolderId(folderId);
    clearSelection();
    updateBreadcrumbs(folderId);
  };

  const handleBreadcrumbNavigateLocal = (item: any) => {
    const folderId = handleBreadcrumbNavigate(item);
    setCurrentFolderId(folderId);
  };

  const handleBulkActionWithReload = (action: string) => {
    handleBulkAction(action, selectedDocuments, () => {
      loadDocuments();
      clearSelection();
    });
  };

  const handleCreateDocument = () => {
    setShowUploadDialog(true);
  };

  const handleNavigateToRoot = () => {
    setCurrentFolderId(undefined);
    clearSelection();
    updateBreadcrumbs(undefined);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Root Folder Access and Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4">
            <RootFolderAccess 
              currentFolderId={currentFolderId}
              onNavigateToRoot={handleNavigateToRoot}
            />
            <BreadcrumbNavigation 
              items={breadcrumbs}
              onNavigate={handleBreadcrumbNavigateLocal}
            />
          </div>

          <PageHeader 
            title="Документы"
            categoryType={activeCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
          >
            <DocumentControls
              selectedCount={selectedDocuments.length}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortFieldChange={setSortField}
              onSortOrderChange={setSortOrder}
              onBulkAction={handleBulkActionWithReload}
              onCreateDocument={handleCreateDocument}
              onToggleFilters={() => setShowFilters(!showFilters)}
            />
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
