import React from 'react';
import { Document } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { DocumentListItem } from './DocumentListItem';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, File, FileSpreadsheet, FileImage, Folder } from 'lucide-react';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
  onDocumentPreview: (document: Document) => Promise<void>;
  viewMode: 'grid' | 'list';
  selectedDocument: Document | null;
  onDocumentSelect: (document: Document) => void;
  multipleSelection: boolean;
  onOpen?: (item: Document) => void; // 👈 add this

  selectionActions: {
    selectedIds: string[];
    onSelectAll: () => void;
    onClearSelection: () => void;
    onDeleteSelected: () => Promise<void>;
    onDownloadSelected: () => void;
    onShareSelected: () => void;
    onArchiveSelected: () => Promise<void>;
  };
  toggleFavorite: (documentId: string) => Promise<void>;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onDocumentClick,
  onDocumentSelect,
  onDocumentPreview,
  viewMode,
  selectedDocument,
  multipleSelection,
  selectionActions,
  toggleFavorite,
}) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => (
        <div
          key={document.id}
          className={`relative group cursor-pointer rounded-lg border p-4 hover:shadow-md transition-shadow ${
            selectionActions.selectedIds.includes(document.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onDocumentClick(document)}
        >
          <div className="flex items-center justify-between mb-2">
            <Checkbox
              checked={selectionActions.selectedIds.includes(document.id)}
              onCheckedChange={() => onDocumentSelect(document)}
              onClick={(e) => e.stopPropagation()}
            />
            {document.type === 'folder' && (
              <Link
                to={`/?folderId=${document.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-500 hover:text-blue-700"
              >
                Open
              </Link>
            )}
          </div>
          
          <div className="text-center">
            {renderIcon(document.type)}
            <h3 className="mt-2 text-sm font-medium truncate">{document.name}</h3>
            <p className="text-xs text-gray-500">{document.size}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
