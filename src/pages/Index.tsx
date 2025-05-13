
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { useToast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { useNavigate } from 'react-router-dom';
import { UserButton } from "@/components/UserButton";
import axios from 'axios';
import { DOCUMENT_ENDPOINTS } from '@/config/api';

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

const Index = () => {
  const [category, setCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentPath, setCurrentPath] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auth token
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDcxMTM0NzgsImlkIjoiMDFKVFE4SzZDSDk5WFdSV1FHRzlXUVlaUUgiLCJ1c2VybmFtZSI6InN0cmluZyJ9.8cgLb1wVYrB8dHrwmMaZv1Jv-q7uas33306G_PdaXGM";

  // Fetch documents
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/v2/metadata?limit=10&offset=0", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
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
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Preview document
  const handlePreviewFile = async (document: Document) => {
    try {
      // Encode the file name properly for the URL
      const encodedFileName = encodeURIComponent(document.name);
      const response = await fetch(`http://localhost:8000/v2/preview/${encodedFileName}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to preview document');
      }
      
      // For PDF and images, we can set a preview URL
      if (document.type === 'pdf' || document.type === 'image') {
        setPreviewUrl(`http://localhost:8000/v2/preview/${encodedFileName}`);
      } else {
        setPreviewUrl(null);
      }
      
      setSelectedDocument(document);
      setShowSidebar(true);
    } catch (error) {
      console.error('Error previewing document:', error);
      toast({
        title: "Error",
        description: "Failed to preview document",
        variant: "destructive"
      });
    }
  };

  // Download document
  const handleDownloadFile = async (document: Document) => {
    try {
      // Encode the file name properly for the URL
      const encodedFileName = encodeURIComponent(document.name);
      const downloadUrl = `http://localhost:8000/v2/file/${encodedFileName}/download`;
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', document.name);
      link.setAttribute('target', '_blank');
      link.click();
      
      toast({
        title: "Success",
        description: `Downloading: ${document.name}`,
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

  // Upload document
  const handleUploadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await axios.post("http://localhost:8000/v2/upload", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s) successfully`,
      });

      // Refresh document list
      fetchDocuments();
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  // Rename/update document metadata
  const handleUpdateMetadata = async (documentId: string, newName: string, tags?: string[], categories?: string[]) => {
    try {
      const response = await axios.put(`http://localhost:8000/v2/metadata/${documentId}`, {
        name: newName,
        tags: tags,
        categories: categories
      }, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      toast({
        title: "Success",
        description: `Document updated successfully`,
      });

      // Refresh document list
      fetchDocuments();
      
      // If this is the selected document, update it
      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument({
          ...selectedDocument,
          name: newName,
          tags: tags || selectedDocument.tags
        });
      }
    } catch (error) {
      console.error('Error updating document metadata:', error);
      toast({
        title: "Error",
        description: "Failed to update document metadata",
        variant: "destructive"
      });
    }
  };

  // Delete document (move to bin)
  const handleDeleteDocument = async (document: Document) => {
    try {
      // Encode the file name properly for the URL
      const encodedFileName = encodeURIComponent(document.name);
      await axios.delete(`http://localhost:8000/v2/${encodedFileName}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      toast({
        title: "Success",
        description: `Document moved to bin`,
      });

      // Refresh document list
      fetchDocuments();
      
      // If this document was selected, clear selection
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

  const handleDocumentClick = (document: Document) => {
    if (document.type === 'folder') {
      handleFolderOpen(document);
    } else {
      handlePreviewFile(document);
    }
  };

  const handleFolderOpen = (folder: Document) => {
    toast({
      title: "Opening folder",
      description: `Opening folder: ${folder.name}`,
    });
    setCurrentPath([...currentPath, folder]);
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

  const handleDeleteSelected = async () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));
    
    let successCount = 0;
    let failCount = 0;
    
    for (const doc of selectedDocs) {
      try {
        const encodedFileName = encodeURIComponent(doc.name);
        await axios.delete(`http://localhost:8000/v2/${encodedFileName}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        successCount++;
      } catch (error) {
        console.error(`Error deleting document ${doc.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `${successCount} document(s) moved to bin`,
      });
      
      // Refresh document list
      fetchDocuments();
    }
    
    if (failCount > 0) {
      toast({
        title: "Error",
        description: `Failed to move ${failCount} document(s) to bin`,
        variant: "destructive"
      });
    }
    
    setSelectedDocumentIds([]);
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const handleDownloadSelected = () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));
    
    for (const doc of selectedDocs) {
      handleDownloadFile(doc);
    }
  };

  const handleShareSelected = () => {
    toast({
      title: "Sharing documents",
      description: `Selected ${selectedDocumentIds.length} documents for sharing`,
    });
  };

  const handleSelectDestination = (destination: 'downloads' | 'new') => {
    toast({
      title: "Folder selected",
      description: destination === 'downloads' ? "Selected Downloads folder" : "Selected New folder",
    });
  };

  const handleCreateFolder = () => {
    toast({
      title: "Creating folder",
      description: "Creating new folder",
    });
  };

  const handleUploadToDestination = (files: FileList | null) => {
    handleUploadFile(files);
  };

  const handleCloseSidebar = () => {
    setSelectedDocument(null);
    setPreviewUrl(null);
    setShowSidebar(false);
  };

  const getCategoryTitle = (type: CategoryType): string => {
    switch (type) {
      case 'all':
        return 'All Documents';
      case 'recent':
        return 'Recent Documents';
      case 'shared':
        return 'Shared Documents';
      case 'favorites':
        return 'Favorite Documents';
      case 'trash':
        return 'Trash';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 h-16 border-b border-muted bg-background">
        <div className="text-lg font-semibold">DocFlow EDMS 1.0.0</div>
        <UserButton />
      </header>
      <div className="flex flex-1 overflow-hidden">
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
                  previewUrl={previewUrl}
                  onClose={handleCloseSidebar}
                  onDownload={selectedDocument ? () => handleDownloadFile(selectedDocument) : undefined}
                  onDelete={selectedDocument ? () => handleDeleteDocument(selectedDocument) : undefined}
                  onUpdateMetadata={handleUpdateMetadata}
                  token={token}
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
    </div>
  );
};

export default Index;
