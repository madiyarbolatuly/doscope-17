
import React from 'react';
import { Document } from '@/types/document';
import { cn } from '@/lib/utils';
import { 
  FileText, File, FileSpreadsheet, 
  FileImage, FolderOpen, MoreVertical, 
  Star, Calendar, User,
  Folder
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentCardProps {
  document: Document;
  onClick: (document: Document) => void;
}

export function DocumentCard({ document, onClick }: DocumentCardProps) {
  const renderIcon = () => {
    switch (document.type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'image':
        return <FileImage className="h-8 w-8 text-purple-500" />;
      case 'folder':
        return <Folder className="h-8 w-8 text-yellow-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const modifiedDate = new Date(document.modified);
  const formattedDate = format(modifiedDate, 'MMM d, yyyy');

  const isFolder = document.type === 'folder';

  return (
    <div 
      className={cn(
        "document-card bg-card rounded-lg border p-4 cursor-pointer relative",
        isFolder && "border-yellow-200 hover:border-yellow-300"
      )}
      onClick={() => onClick(document)}
    >
      <div className="absolute right-2 top-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Open</DropdownMenuItem>
            {isFolder ? (
              <>
                <DropdownMenuItem>New File</DropdownMenuItem>
                <DropdownMenuItem>New Folder</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem>Download</DropdownMenuItem>
            )}
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col h-full">
        <div className={cn(
          "flex justify-center items-center mb-4 h-24 rounded-md p-4",
          isFolder ? "bg-yellow-50" : "bg-accent"
        )}>
          {document.thumbnail ? (
            <img 
              src={document.thumbnail} 
              alt={document.name} 
              className="max-h-full object-contain" 
            />
          ) : renderIcon()}
        </div>

        <div className="flex-1">
          <h3 className="font-medium truncate text-sm" title={document.name}>
            {document.name}
          </h3>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="h-3 w-3 mr-1" />
              <span>{document.owner}</span>
            </div>
          </div>
        </div>

        {document.favorited && (
          <div className="absolute left-2 top-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </div>
    </div>
  );
}
