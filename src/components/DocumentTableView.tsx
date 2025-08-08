
import React from 'react';
import { Document } from '@/types/document';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileText, File, FileSpreadsheet, FileImage, Folder, MoreVertical, Share } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentTableViewProps {
  documents: Document[];
  selectedDocumentIds: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onDocumentClick: (document: Document) => void;
  onDocumentSelect: (document: Document) => void;
  onSelectAll: () => void;
  onPreview: (document: Document) => void;
  onDownload: (document: Document) => void;
  onShare: (document: Document) => void;
  onArchive: (document: Document) => void;
  onToggleFavorite: (document: Document) => void;
  onDelete: (document: Document) => void;
  isLoading?: boolean;
}

export const DocumentTableView: React.FC<DocumentTableViewProps> = ({
  documents,
  selectedDocumentIds,
  sortBy,
  sortOrder,
  onSort,
  onDocumentClick,
  onDocumentSelect,
  onSelectAll,
  onPreview,
  onDownload,
  onShare,
  onArchive,
  onToggleFavorite,
  onDelete,
  isLoading = false
}) => {
  const Caret = ({ direction }: { direction: 'asc' | 'desc' }) => (
    <span className="text-xs ml-1">{direction === 'asc' ? '▲' : '▼'}</span>
  );

  const renderIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      case 'folder':
        return <Folder className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={selectedDocumentIds.length === documents.length && documents.length > 0}
            onCheckedChange={onSelectAll}
            className="border-2 border-gray-300"
          />
          <span className="text-sm text-gray-600 font-medium">
            {selectedDocumentIds.length > 0
              ? `${selectedDocumentIds.length} selected`
              : `${documents.length} items`}
          </span>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedDocumentIds.length === documents.length && documents.length > 0}
                onCheckedChange={onSelectAll}
                className="border-2 border-gray-300"
              />
            </TableHead>
            <TableHead 
              onClick={() => onSort('name')} 
              className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold text-gray-700"
            >
              <div className="flex items-center">
                Name 
                {sortBy === 'name' && <Caret direction={sortOrder} />}
              </div>
            </TableHead>
            <TableHead className="text-gray-600">Description</TableHead>
            <TableHead className="text-gray-600">Version</TableHead>
            <TableHead 
              onClick={() => onSort('size')} 
              className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold text-gray-700"
            >
              <div className="flex items-center">
                Size 
                {sortBy === 'size' && <Caret direction={sortOrder} />}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => onSort('modified')} 
              className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold text-gray-700"
            >
              <div className="flex items-center">
                Last updated 
                {sortBy === 'modified' && <Caret direction={sortOrder} />}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => onSort('owner')} 
              className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold text-gray-700"
            >
              <div className="flex items-center">
                Updated by 
                {sortBy === 'owner' && <Caret direction={sortOrder} />}
              </div>
            </TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="mt-2 text-gray-500">Loading documents...</p>
              </TableCell>
            </TableRow>
          ) : documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <div className="text-gray-400 mb-2">
                  <Folder className="h-12 w-12 mx-auto opacity-30" />
                </div>
                <p className="text-gray-500 font-medium">No documents found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or upload some files</p>
              </TableCell>
            </TableRow>
          ) : (
            documents.map((document) => (
              <TableRow 
                key={document.id}
                className="hover:bg-gray-50/60 cursor-pointer transition-colors border-b border-gray-100/60"
                onClick={() => onDocumentClick(document)}
              >
                <TableCell>
                  <Checkbox 
                    checked={selectedDocumentIds.includes(document.id)}
                    onCheckedChange={() => onDocumentSelect(document)}
                    onClick={(e) => e.stopPropagation()}
                    className="border-2 border-gray-300"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {renderIcon(document.type)}
                    <span className="font-medium text-gray-800">{document.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-500">--</span>
                </TableCell>
                <TableCell>
                  {document.type === 'folder' ? (
                    <span className="text-gray-500">--</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      V1
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-gray-600 font-mono text-sm">{document.size}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">
                    {format(new Date(document.modified), 'MMM d, yyyy HH:mm')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs text-white font-semibold">
                      MS
                    </div>
                    <span className="text-sm text-gray-700">Madiyar Saduakas</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(document);
                      }}
                      className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-lg">
                        <DropdownMenuItem onClick={() => onPreview(document)} className="hover:bg-gray-50">
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload(document)} className="hover:bg-gray-50">
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare(document)} className="hover:bg-gray-50">
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(document)} className="hover:bg-gray-50">
                          {document.archived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleFavorite(document)} className="hover:bg-gray-50">
                          {document.starred ? 'Remove from favorites' : 'Add to favorites'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => onDelete(document)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
