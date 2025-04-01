
import React from 'react';
import { Document } from '@/types/document';
import { cn } from '@/lib/utils';
import { 
  FileText, File, FileSpreadsheet, 
  FileImage, MoreVertical, 
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
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-purple-500" />;
      case 'folder':
        return <Folder className="h-6 w-6 text-yellow-500" />;
      case 'ppt':
        return <File className="h-6 w-6 text-orange-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const modifiedDate = new Date(document.modified);
  const formattedDate = format(modifiedDate, 'MMM d, yyyy');
  const isFolder = document.type === 'folder';

  if (isFolder) {
    return (
      <div 
        className="group flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 cursor-pointer transition-all duration-200"
        onClick={() => onClick(document)}
      >
        <div className="w-full flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>New File</DropdownMenuItem>
              <DropdownMenuItem>New Folder</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mb-3 text-yellow-500">
          <Folder className="h-12 w-12" />
        </div>
        
        <div className="text-center">
          <p className="font-medium truncate max-w-[120px]" title={document.name}>
            {document.name}
          </p>
        </div>
        
        {document.favorited && (
          <div className="absolute left-2 top-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </div>
    );
  }

  // List-style for files (Google Docs style)
  return (
    <div 
      className="flex items-center px-4 py-3 hover:bg-accent/50 cursor-pointer transition-all duration-200"
      onClick={() => onClick(document)}
    >
      <div className="flex-shrink-0 mr-3">
        {renderIcon()}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-center">
          <h3 className="font-medium truncate mr-2" title={document.name}>
            {document.name}
          </h3>
          {document.favorited && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="truncate">Modified {formattedDate}</span>
          <span className="mx-2">•</span>
          <User className="h-3 w-3 mr-1" />
          <span className="truncate">{document.owner}</span>
          {document.size && (
            <>
              <span className="mx-2">•</span>
              <span>{document.size}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0 ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Open</DropdownMenuItem>
            <DropdownMenuItem>Download</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
