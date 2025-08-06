import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import axios from 'axios';
import { ShareModal } from '@/components/ShareModal';
import { buildTree, TreeNode } from '@/utils/buildTree';
import { useShare } from '@/hooks/useShare';
import { Button } from '@/components/ui/button';
import { Plus, Share, ArrowLeft, Folder } from "lucide-react";
import { archiveDocument, unarchiveDocument, getArchivedDocuments, toggleStar, renameDocument, deleteDocument } from '@/services/archiveService';

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, File, FileSpreadsheet, FileImage, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnhancedFolderTree } from '@/components/EnhancedFolderTree';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';

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

interface FolderInfo {
  id: string;
  name: string;
  parent_id: string | null;
  file_path: string;
}

// Add size formatting function
const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FolderView = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [category] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const treeData: TreeNode[] = React.useMemo(() => buildTree(documents), [documents]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<FolderInfo[]>([]);

  const token = localStorage.getItem('authToken');

  // Fetch folder information and contents
  const fetchFolderContents = useCallback(async () => {
    if (!folderId) return;
    
    setIsLoading(true);
    try {
      // Fetch folder information
      const folderResponse = await fetch(`/api/v2/metadata/${folderId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (folderResponse.ok) {
        const folderData = await folderResponse.json();
        setCurrentFolder(folderData);
      }

      // Fetch folder contents (children)
      const contentsResponse = await fetch(`/api/v2/folders/${folderId}/children`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (contentsResponse.ok) {
        const contentsData = await contentsResponse.json();
        const docsKey = Object.keys(contentsData).find(key => Array.isArray(contentsData[key]));
        const docs = docsKey ? contentsData[docsKey] : [];
        
        const transformedDocs: Document[] = docs.map((doc: BackendDocument) => ({
          id: doc.id,
          name: doc.name,
          title: doc.name,
          type: doc.file_type,
          size: formatFileSize(doc.size), // Use proper size formatting
          created: new Date(doc.created_at),
          modified: new Date(doc.created_at),
          tags: doc.tags || [],
          categories: doc.categories || [],
          status: doc.status,
          isArchived: doc.status === 'archived',
          favorited: false, // Use correct property name
          path: doc.file_path,
          parentId: doc.parent_id,
        }));

        setDocuments(transformedDocs);
      }

      // Build breadcrumb path
      await buildBreadcrumbPath(folderId);

    } catch (error) {
      console.error('Error fetching folder contents:', error);
      toast({
        title: "Error",
        description: "Failed to load folder contents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [folderId, token]);

  // Build breadcrumb path by traversing up the folder hierarchy
  const buildBreadcrumbPath = async (currentFolderId: string) => {
    const path: FolderInfo[] = [];
    let currentId = currentFolderId;

    while (currentId) {
      try {
        const response = await fetch(`/api/v2/metadata/${currentId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const folderData = await response.json();
          path.unshift(folderData);
          currentId = folderData.parent_id;
        } else {
          break;
        }
      } catch (error) {
        console.error('Error building breadcrumb:', error);
        break;
      }
    }

    setBreadcrumbPath(path);
  };

  useEffect(() => {
    fetchFolderContents();
  }, [fetchFolderContents]);

  // Navigation handlers
  const handleFolderClick = (folder: Document) => {
    if (folder.type === 'folder') {
      navigate(`/folder/${folder.id}`);
    }
  };

  const handleFolderSelect = (id: string) => {
    navigate(`/folder/${id}`);
  };

  const handleBackToRoot = () => {
    navigate('/');
  };

  const handleBreadcrumbClick = (folderId: string) => {
    if (folderId === 'root') {
      navigate('/');
    } else {
      navigate(`/folder/${folderId}`);
    }
  };

  // Reuse existing handlers from Index.tsx
  const handleDocumentClick = (document: Document) => {
    if (document.type === 'folder') {
      handleFolderClick(document);
    } else {
      setSelectedDocument(document);
      setShowSidebar(true);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocumentIds(prev => 
      prev.includes(document.id) 
        ? prev.filter(id => id !== document.id)
        : [...prev, document.id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocumentIds(documents.map(doc => doc.id));
  };

  const handleClearSelection = () => {
    setSelectedDocumentIds([]);
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      await deleteDocument(document.id, token!);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      fetchFolderContents(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleArchiveDocument = async (document: Document) => {
    try {
      await archiveDocument(document.name, token!);
      toast({
        title: "Success",
        description: "Document archived successfully",
      });
      fetchFolderContents(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive document",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (document: Document) => {
    try {
      await toggleStar(document.name, token!);
      toast({
        title: "Success",
        description: "Document favorited successfully",
      });
      fetchFolderContents(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to favorite document",
        variant: "destructive",
      });
    }
  };

  const handleRenameDocument = async (document: Document, newName: string) => {
    try {
      await renameDocument(document.id, newName, token!);
      toast({
        title: "Success",
        description: "Document renamed successfully",
      });
      fetchFolderContents(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename document",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: string) => {
    setSortBy(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortedDocuments = React.useMemo(() => {
    return [...documents].sort((a, b) => {
      let aValue: any = a[sortBy as keyof Document];
      let bValue: any = b[sortBy as keyof Document];

      if (sortBy === 'created' || sortBy === 'modified') {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, sortBy, sortOrder]);

  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery) return sortedDocuments;
    return sortedDocuments.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedDocuments, searchQuery]);

  const renderIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'folder':
        return <Folder className="h-5 w-5 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToRoot}
          className="flex items-center space-x-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Root</span>
        </Button>
        
        {breadcrumbPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <span className="text-gray-400">/</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBreadcrumbClick(folder.id)}
              className="hover:underline"
            >
              {folder.name}
            </Button>
          </React.Fragment>
        ))}
      </div>

      {/* Page Header */}
      <PageHeader
        title={currentFolder?.name || 'Folder'}
        description={`Contents of ${currentFolder?.name || 'folder'}`}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={75}>
            <div className="h-full p-4">
              {viewMode === 'list' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDocumentIds.length === documents.length && documents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-gray-500">
                        {selectedDocumentIds.length} of {documents.length} selected
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={selectedDocumentIds.length === 0}
                    >
                      Clear Selection
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('name')}
                        >
                          Name
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('type')}
                        >
                          Type
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('size')}
                        >
                          Size
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('created')}
                        >
                          Created
                        </TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((document) => (
                        <TableRow
                          key={document.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedDocumentIds.includes(document.id) ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleDocumentClick(document)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedDocumentIds.includes(document.id)}
                              onCheckedChange={() => handleDocumentSelect(document)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="flex items-center space-x-2">
                            {renderIcon(document.type)}
                            <span className="font-medium">{document.name}</span>
                          </TableCell>
                          <TableCell className="capitalize">{document.type}</TableCell>
                          <TableCell>{document.size}</TableCell>
                          <TableCell>{format(new Date(document.created_at || document.modified), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleToggleFavorite(document)}>
                                  {document.favorited ? 'Remove from Favorites' : 'Add to Favorites'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleArchiveDocument(document)}>
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteDocument(document)}
                                  className="text-red-600"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <DocumentGrid
                  documents={filteredDocuments}
                  onDocumentClick={handleDocumentClick}
                  onDocumentSelect={handleDocumentSelect}
                  selectedDocumentIds={selectedDocumentIds}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={25}>
            <div className="h-full p-4">
              <EnhancedFolderTree
                data={treeData}
                selectedId={folderId || null}
                onSelect={handleFolderSelect}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Metadata Sidebar */}
      {showSidebar && selectedDocument && (
        <MetadataSidebar
          document={selectedDocument}
          onClose={() => setShowSidebar(false)}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        onClose={() => setIsShareOpen(false)}
        document={shareDoc}
      />
    </div>
  );
};

export default FolderView; 