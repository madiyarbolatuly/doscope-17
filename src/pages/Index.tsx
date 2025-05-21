import React, { useState, useEffect } from 'react';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { useToast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShareModal } from '@/components/ShareModal';
import { useShare } from '@/hooks/useShare';
import { DocumentList } from "@/components/DocumentList";

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
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [category, setCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);


  // Auth token
  const token = localStorage.getItem('authToken')

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
                    doc.file_type.includes('pptx') ? 'pptx' :
                      doc.file_type.includes('png') ? 'png' :
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

  const { createShareLink, shareWithUsers, loading: shareLoading, error: shareError } = useShare();

  // Handler that you’ll pass down to your grid/item “Share” button:
  const openShare = (doc: Document) => {
    setShareDoc(doc);
    setIsShareOpen(true);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Preview document
  const handlePreviewFile = async (document: Document) => {
    try {
      const encoded = encodeURIComponent(document.name);
      // 1) Fetch with auth header
      const res = await fetch(`http://localhost:8000/v2/preview/${encoded}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Preview fetch failed');

      // 2) Read it as a Blob
      const blob = await res.blob();

      // 3) Create an object URL so the browser can render it
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      setSelectedDocument(document);
      setShowSidebar(true);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Не удалось загрузить предпросмотр',
        variant: 'destructive',
      });
    }
  };

  // Download document
  const handleDownloadFile = async (doc: Document) => {
    try {
      const encodedFileName = encodeURIComponent(doc.name);
      const downloadUrl = `http://localhost:8000/v2/file/${encodedFileName}/download`;

      const response = await fetch(downloadUrl, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
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



  // Upload document
  const traverseFileTree = async (
    item: FileSystemEntry,
    path = '',
    fileList: File[] = []
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        const fileEntry = item as FileSystemFileEntry;
        fileEntry.file((file) => {
          (file as any).relativePath = path + file.name;
          fileList.push(file);
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + '/', fileList);
          }
          resolve();
        });
      }
    });
  };

  const handleDropWithFolders = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry?.();
      if (item) {
        await traverseFileTree(item, '', files);
      }
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, (file as any).relativePath || file.name);
    });

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
          tags: tags || selectedDocument.tags,
          category: categories && categories.length > 0 ? categories[0] : selectedDocument.category,
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
    setSelectedDocument(document);
    setShowSidebar(true);
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
      // Do not open sidebar or set selectedDocument here
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
    if (selectedDocumentIds.length > 0) {
      const doc = documents.find(d => d.id === selectedDocumentIds[0]);
      if (doc) openShare(doc);
    }
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

  const handleUploadToDestination = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const formData = new FormData();

    fileList.forEach(file => {
      formData.append('files', file, (file as any).relativePath || file.name);
    });

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

  const handleCloseSidebar = () => {
    setSelectedDocument(null);
    setPreviewUrl(null);
    setShowSidebar(false);
  };

  const getCategoryTitle = (type: CategoryType): string => {
    switch (type) {
      case 'all':
        return 'Все документы';
      case 'recent':
        return 'Недавние документы';
      case 'shared':
        return 'Общие документы';
      case 'favorites':
        return 'Избранные документы';
      case 'trash':
        return 'Корзина';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Drag and drop handlers for a dedicated drop area
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => c + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c - 1;
      if (next <= 0) {
        setIsDragging(false);
        return 0;
      }
      return next;
    });
  };

  const handleDragOverArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropArea = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragging(false);
    await handleDropWithFolders(e);
  };
  return (
    <div className="relative">
      <div
        className="fixed inset-0 z-50"
        style={{ pointerEvents: isDragging ? 'auto' : 'none', display: isDragging ? 'block' : 'none' }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOverArea}
        onDrop={handleDropArea}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100/50 border-4 border-dashed border-blue-400 flex items-center justify-center">
            <p className="text-lg font-semibold text-blue-600">Перетащите файлы для загрузки
            </p>
          </div>
        )}
      </div>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOverArea}
        onDrop={handleDropArea}
      >
        <PageHeader
          title={getCategoryTitle(category)}
          categoryType={category}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <div className="flex justify-between items-center mb-4">

          <button
            className=" flex items-center mt-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 rounded-md mb-6 transition-colors"
            onClick={() => setShowUploadDialog(true)}
          ><svg height="24" width="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="Icon___StyledSvg-sc-1qxn6g3-0 huCDol" data-testid="cloudUpArrow" aria-label="облакоСтрелка вверх"><path d="M15.52,15.81A.78.78,0,0,1,15,16a.72.72,0,0,1-.55-.24l-1.71-1.85V19.6a.75.75,0,0,1-1.5,0V13.92L9.54,15.77a.76.76,0,0,1-1.06,0,.74.74,0,0,1,0-1.06l3-3.25a.76.76,0,0,1,.55-.24.77.77,0,0,1,.55.24l3,3.25A.76.76,0,0,1,15.52,15.81ZM14.79,3.44A7.94,7.94,0,0,0,7.27,8.8a5.81,5.81,0,0,0-.72-.05,5.3,5.3,0,0,0,0,10.6.75.75,0,1,0,0-1.5,3.8,3.8,0,1,1,1-7.48.65.65,0,0,0,.31,0,.75.75,0,0,0,.72-.57,6.46,6.46,0,1,1,8.21,7.74.77.77,0,0,0-.49.95A.75.75,0,0,0,17,19a.57.57,0,0,0,.22,0,8,8,0,0,0-2.4-15.54Z"></path></svg> Загрузить файлы
          </button>
        </div>
        <div className="mt-4 animate-fade-in">
          <DocumentGrid
            documents={documents}
            onDocumentClick={handleDocumentClick}
            onDocumentPreview={handlePreviewFile}
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
      {isShareOpen && shareDoc && (
        <ShareModal
          document={shareDoc}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {previewUrl && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <button
            className="absolute top-4 right-4 z-60 bg-white rounded-full p-2 shadow hover:bg-gray-200"
            onClick={() => { setPreviewUrl(null); }}
          >
            <span className="sr-only">Закрыть предпросмотр</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {selectedDocument.type === 'pdf' ? (
            <iframe
              src={`${previewUrl}#toolbar=0`}
              className="w-[90vw] h-[90vh] bg-white rounded shadow-xl"
              title={selectedDocument.name}
            />
          ) : selectedDocument.type === 'image' ? (
            <img
              src={previewUrl}
              alt={selectedDocument.name}
              className="max-h-[90vh] max-w-[90vw] rounded shadow-xl bg-white"
            />
          ) : (
            <div className="text-white">Предпросмотр не доступен </div>
          )}
        </div>
      )}

      {/* Metadata sidebar only if not previewing */}
      {!previewUrl && showSidebar && selectedDocument && (
        <div className="w-128 border bg-background fixed right-0 top-56 h-full z-40">
          <MetadataSidebar
            document={selectedDocument}
            previewUrl={previewUrl}
            onClose={handleCloseSidebar}
            onDownload={selectedDocument ? () => handleDownloadFile(selectedDocument) : undefined}
            onDelete={selectedDocument ? () => handleDeleteDocument(selectedDocument) : undefined}
            onUpdateMetadata={handleUpdateMetadata}
            token={token}
          />
        </div>
      )}

      <FileUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSelectDestination={handleSelectDestination}
        onCreateFolder={handleCreateFolder}
        onUpload={(files) => { handleUploadToDestination(files); }}
      />


    </div>
  );
};

export default Index;
