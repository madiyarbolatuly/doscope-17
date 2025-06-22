
import React from 'react';
import { Document } from '@/types/document';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, File, FileImage, Folder, MoreVertical, Download, Share2, Trash2, RotateCcw, Archive } from 'lucide-react';

interface DocumentTableProps {
  documents: Document[];
  selectedDocuments: string[];
  onDocumentSelect: (document: Document) => void;
  onSelectAll: () => void;
  isTrashMode?: boolean;
  onRestore?: (document: Document) => void;
  onPermanentDelete?: (document: Document) => void;
  onArchive?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onShare?: (document: Document) => void;
}

export function DocumentTable({
  documents,
  selectedDocuments,
  onDocumentSelect,
  onSelectAll,
  isTrashMode = false,
  onRestore,
  onPermanentDelete,
  onArchive,
  onDownload,
  onShare
}: DocumentTableProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileImage className="h-4 w-4 text-purple-500" />;
      case 'folder':
        return <Folder className="h-4 w-4 text-yellow-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'public': return 'default';
      case 'private': return 'secondary';
      case 'shared': return 'outline';
      case 'deleted': return 'destructive';
      case 'archived': return 'outline';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox 
              checked={selectedDocuments.length === documents.length && documents.length > 0}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Last updated</TableHead>
          <TableHead>Updated by</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <Checkbox 
                checked={selectedDocuments.includes(doc.id)}
                onCheckedChange={() => onDocumentSelect(doc)}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                {getFileIcon(doc.type)}
                <span className="font-medium">{doc.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground text-sm">
                {doc.category || 'No description'}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                v{Math.floor(Math.random() * 5) + 1}.{Math.floor(Math.random() * 10)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {doc.size}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(doc.modified)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(doc.owner)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{doc.owner}</span>
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isTrashMode ? (
                    <>
                      {onRestore && (
                        <DropdownMenuItem onClick={() => onRestore(doc)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                      )}
                      {onPermanentDelete && (
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onPermanentDelete(doc)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete permanently
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : (
                    <>
                      {onDownload && (
                        <DropdownMenuItem onClick={() => onDownload(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {onShare && (
                        <DropdownMenuItem onClick={() => onShare(doc)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                      )}
                      {onArchive && (
                        <DropdownMenuItem onClick={() => onArchive(doc)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Move to trash
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
