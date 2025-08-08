
import React, { useState, useEffect, useCallback } from 'react';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { useNavigate } from 'react-router-dom';
import { ShareModal } from '@/components/ShareModal';
import { buildTree, TreeNode } from '@/utils/buildTree';
import { useShare } from '@/hooks/useShare';
import { EnhancedFolderTree } from '@/components/EnhancedFolderTree';
import { mockDocuments } from '@/pages/mdocuments';
import { DocumentTableView } from '@/components/DocumentTableView';
import { DocumentBulkActions } from '@/components/DocumentBulkActions';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import { useDocumentSort } from '@/hooks/useDocumentSort';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import { documentApiService } from '@/services/documentApiService';
import { archiveDocument, unarchiveDocument, toggleStar, renameDocument } from '@/services/archiveService';

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
  parent_id: string | null;
}

const Index = () => {
  const [category] = useState<CategoryType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  
  // Custom hooks for reusable logic
  const { searchQuery, setSearchQuery, filteredDocuments } = useDocumentSearch(documents);
  const { sortBy, sortOrder, handleSort, sortedDocuments } = useDocumentSort(filteredDocuments);
  const { 
    selectedDocumentIds, 
    handleDocumentSelect, 
    handleSelectAll, 
    handleClearSelection,
    setSelectedDocumentIds 
  } = useDocumentSelection();

  const { createShareLink, shareWithUsers } = useShare();

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await documentApiService.fetchDocuments({ 
        limit: 50, 
        offset: 0, 
        folderId: folderId || undefined 
      });
      
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
          archived: doc.status === 'archived',
          starred: false,
        }));
        const combined = [...transformedDocuments, ...mockDocuments];
        setDocuments(combined);      
      } else {
        setDocuments(mockDocuments);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments(mockDocuments);
      toast({
        title: "Info",
        description: "Files loaded from local data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Document actions
  const handleFileUpload = async (files: File[], targetFolderId?: string) => {
    try {
      await documentApiService.uploadFiles(files, targetFolderId);
      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s) successfully`,
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handlePreviewFile = async (document: Document) => {
    try {
      const blob = await documentApiService.previewDocument(document.name);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setSelectedDocument(document);
      setShowSidebar(true);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Could not load preview',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadFile = async (doc: Document) => {
    try {
      const blob = await documentApiService.downloadDocument(doc.name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast({
        title: "Success",
        description: `Downloading: ${doc.name}`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      await documentApiService.deleteDocument(document.name);
      toast({
        title: "Success",
        description: `Document moved to bin`,
      });
      fetchDocuments();
      if (selectedDocument && selectedDocument.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to move document to bin",
        variant: "destructive"
      });
    }
  };

  const handleArchiveDocument = async (document: Document) => {
    try {
      await archiveDocument(document.name, token!);
      toast({
        title: "Success",
        description: `Document "${document.name}" archived successfully`,
      });
      fetchDocuments();
      if (selectedDocument && selectedDocument.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to archive document",
        variant: "destructive"
      });
    }
  };

  const handleToggleFavorite = async (document: Document) => {
    try {
      await toggleStar(document.name, token!);
      toast({
        title: "Success",
        description: `Document "${document.name}" ${document.starred ? 'unstarred' : 'starred'} successfully`,
      });
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle favorite status",
        variant: "destructive"
      });
    }
  };

  const handleDocumentClick = (document: Document) => {
    if (document.type === 'folder') {
      setFolderId(document.id);
    } else {
      setSelectedDocument(document);
      setShowSidebar(true);
    }
  };

  const openShare = (doc: Document) => {
    setShareDoc(doc);
    setIsShareOpen(true);
  };

  // Bulk actions
  const handleBulkDownload = () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));
    selectedDocs.forEach(doc => handleDownloadFile(doc));
  };

  const handleBulkArchive = async () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));
    for (const doc of selectedDocs) {
      try {
        await archiveDocument(doc.name, token!);
      } catch (error) {
        console.error(`Error archiving ${doc.name}:`, error);
      }
    }
    setSelectedDocumentIds([]);
    fetchDocuments();
    toast({
      title: "Success",
      description: `Archived ${selectedDocs.length} document(s)`,
    });
  };

  const handleBulkDelete = async () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));
    for (const doc of selectedDocs) {
      try {
        await documentApiService.deleteDocument(doc.name);
      } catch (error) {
        console.error(`Error deleting ${doc.name}:`, error);
      }
    }
    setSelectedDocumentIds([]);
    fetchDocuments();
    toast({
      title: "Success",
      description: `${selectedDocs.length} document(s) moved to bin`,
    });
  };

  const handleBulkShare = () => {
    if (selectedDocumentIds.length > 0) {
      const doc = documents.find(d => d.id === selectedDocumentIds[0]);
      if (doc) openShare(doc);
    }
  };

  // Get visible documents based on current folder
  const visibleDocuments = React.useMemo(() => {
    const nonArchivedDocs = documents.filter(d => !d.archived);
    
    if (folderId === null) {
      return nonArchivedDocs.filter(d => d.parent_id === null);
    }
    return nonArchivedDocs.filter(d => d.parent_id === folderId);
  }, [documents, folderId]);

  const folderDocuments = documents.filter(doc => doc.type === 'folder');
  const treeData: TreeNode[] = React.useMemo(() => buildTree(folderDocuments), [folderDocuments]);

  const getCategoryTitle = (type: CategoryType): string => {
    switch (type) {
      case 'all': return 'All Documents';
      case 'recent': return 'Recent Documents';
      case 'shared': return 'Shared Documents';  
      case 'favorites': return 'Favorite Documents';
      case 'trash': return 'Trash';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="border-b shrink-0 bg-white/95 backdrop-blur-sm shadow-sm">
        <PageHeader
          title={getCategoryTitle(category)}
          categoryType={category}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-80 overflow-y-auto border-r bg-white/60 backdrop-blur-sm p-4 shadow-sm">
          <div className="mb-6">
            <ProjectSwitcher
              folders={folderDocuments}
              selectedFolderId={folderId}
              onFolderSelect={setFolderId}
            />
          </div>
          <EnhancedFolderTree
            data={treeData}
            selectedId={folderId}
            onSelect={(id) => setFolderId(prev => (prev === id ? null : id))}
            onFileUpload={handleFileUpload}
            onShare={(nodeId) => {
              const doc = documents.find(d => d.id === nodeId);
              if (doc) openShare(doc);
            }}
          />
        </nav>

        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-blue-50/20">
          <DocumentBulkActions
            selectedCount={selectedDocumentIds.length}
            onShare={handleBulkShare}
            onArchive={handleBulkArchive}
            onDownload={handleBulkDownload}
            onDelete={handleBulkDelete}
          />

          {viewMode === 'list' ? (
            <DocumentTableView
              documents={sortedDocuments}
              selectedDocumentIds={selectedDocumentIds}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onDocumentClick={handleDocumentClick}
              onDocumentSelect={handleDocumentSelect}
              onSelectAll={() => handleSelectAll(sortedDocuments)}
              onPreview={handlePreviewFile}
              onDownload={handleDownloadFile}
              onShare={openShare}
              onArchive={handleArchiveDocument}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteDocument}
              isLoading={isLoading}
            />
          ) : (
            <DocumentGrid
              documents={sortedDocuments}
              onDocumentClick={handleDocumentClick}
              onDocumentPreview={handlePreviewFile}
              viewMode={viewMode}
              selectedDocument={selectedDocument}
              onDocumentSelect={handleDocumentSelect}
              multipleSelection={true}
              selectionActions={{
                selectedIds: selectedDocumentIds,
                onSelectAll: () => handleSelectAll(sortedDocuments),
                onClearSelection: handleClearSelection,
                onDeleteSelected: handleBulkDelete,
                onDownloadSelected: handleBulkDownload,
                onShareSelected: handleBulkShare,
                onArchiveSelected: handleBulkArchive
              }}
              toggleFavorite={async (documentId: string) => {
                const doc = documents.find(d => d.id === documentId);
                if (doc) await handleToggleFavorite(doc);
              }}
            />
          )}
        </div>
      </div>

      {isShareOpen && shareDoc && (
        <ShareModal
          document={shareDoc}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {previewUrl && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm">
          <button
            className="absolute top-4 right-4 z-60 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
            onClick={() => setPreviewUrl(null)}
          >
            <span className="sr-only">Close preview</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {selectedDocument.type === 'pdf' ? (
            <iframe
              src={`${previewUrl}#toolbar=0`}
              className="w-[90vw] h-[90vh] bg-white rounded-lg shadow-2xl"
              title={selectedDocument.name}
            />
          ) : selectedDocument.type === 'image' ? (
            <img
              src={previewUrl}
              alt={selectedDocument.name}
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
            />
          ) : (
            <iframe
              src={previewUrl}
              className="w-[90vw] h-[90vh] border-none rounded-lg shadow-2xl"
              allowFullScreen
              title={selectedDocument.name || 'Document Preview'}
            />
          )}
        </div>
      )}

      {!previewUrl && showSidebar && selectedDocument && (
        <div className="w-96 border-l bg-white fixed right-0 top-16 h-full z-40 shadow-xl">
          <MetadataSidebar
            document={selectedDocument}
            previewUrl={previewUrl}
            onClose={() => {
              setSelectedDocument(null);
              setPreviewUrl(null);
              setShowSidebar(false);
            }}
            onDownload={selectedDocument ? () => handleDownloadFile(selectedDocument) : undefined}
            onDelete={selectedDocument ? () => handleDeleteDocument(selectedDocument) : undefined}
            onUpdateMetadata={async (documentId: string, newName: string, tags?: string[], categories?: string[]) => {
              try {
                await documentApiService.updateMetadata(documentId, {
                  name: newName,
                  tags,
                  categories
                });
                toast({
                  title: "Success",
                  description: "Document updated successfully",
                });
                fetchDocuments();
                if (selectedDocument && selectedDocument.id === documentId) {
                  setSelectedDocument({
                    ...selectedDocument,
                    name: newName,
                    tags: tags || selectedDocument.tags,
                    category: categories && categories.length > 0 ? categories[0] : selectedDocument.category,
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to update document metadata",
                  variant: "destructive"
                });
              }
            }}
            token={token}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
