
import React from 'react';
import { Document } from '@/types/document';
import { cn } from '@/lib/utils';
import { 
  FileText, File, FileSpreadsheet, 
  FileImage, MoreVertical, 
  Star, Calendar, User,
  Folder, CheckCircle2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface DocumentCardProps {
  document: Document;
  onClick: (document: Document) => void;
  isSelected?: boolean;
  onSelect: () => void;
  multipleSelection?: boolean;
}

export function DocumentCard({ 
  document, 
  onClick, 
  isSelected, 
  onSelect,
  multipleSelection = false
}: DocumentCardProps) {
  const renderIcon = () => {
    switch (document.type) {
      case 'pdf':
        return <FileText className="h-10 w-10 text-red-500" />;
      case 'doc':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
      case 'image':
        return <FileImage className="h-10 w-10 text-purple-500" />;
      case 'folder':
        return <Folder className="h-10 w-10 text-yellow-500" />;
      default:
        return <File className="h-10 w-10 text-gray-500" />;
    }
  };

  const isFolder = document.type === 'folder';

  return (
    <div 
      className={cn(
        "document-card group relative border p-3 rounded-lg cursor-pointer transition-all",
        isSelected ? "bg-primary/5 border-primary" : "bg-card hover:bg-accent/50",
        isFolder && "border-yellow-200 hover:border-yellow-300"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={() => onClick(document)}
    >
      {/* Selection UI that appears on hover */}
      <div className={cn(
        "absolute left-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
        isSelected && "opacity-100"
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                {isSelected ? (
                  multipleSelection ? (
                    <Checkbox checked className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )
                ) : (
                  <Check className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isSelected ? "Deselect" : "Select"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="absolute right-2 top-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onClick(document)}>Open</DropdownMenuItem>
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

      {document.favorited && (
        <div className="absolute left-2 top-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
      )}

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
              <span>{new Date(document.modified).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
