
import React from 'react';
import { Document } from '@/types/document';
import { cn } from '@/lib/utils';
import { 
  FileText, File, FileSpreadsheet, 
  FileImage, Folder, MoreVertical, 
  Star, Download, Trash,
  Share2, CheckCircle2, Check
} from 'lucide-react';
import { format } from 'date-fns';
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

interface DocumentListItemProps {
  document: Document;
  onClick: (document: Document) => void;
  isSelected?: boolean;
  onSelect: () => void;
  multipleSelection?: boolean;
}

export function DocumentListItem({ 
  document, 
  onClick, 
  isSelected, 
  onSelect,
  multipleSelection = false
}: DocumentListItemProps) {
  const renderIcon = () => {
    switch (document.type) {
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

  const modifiedDate = new Date(document.modified);
  const formattedDate = format(modifiedDate, 'MMM d, yyyy');
  
  return (
    <div 
      className={cn(
        "group flex items-center py-2 px-4 hover:bg-accent/50 border-b last:border-0",
        isSelected ? "bg-primary/5" : "bg-card"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={() => onClick(document)}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-shrink-0 relative">
          {/* Selection state display */}
          <div className={cn(
            "absolute -left-1 -top-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
            isSelected && "opacity-100"
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                  >
                    {isSelected ? (
                      multipleSelection ? (
                        <Checkbox checked className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <Check className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isSelected ? "Deselect" : "Select"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Regular icon or selected state display */}
          {isSelected ? (
            multipleSelection ? (
              <Checkbox checked className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            )
          ) : renderIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h3 className="font-medium truncate flex-1" title={document.name}>
              {document.name}
            </h3>
            {document.favorited && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 ml-2" />
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 text-sm text-muted-foreground w-32 px-2">
        {formattedDate}
      </div>
      
      <div className="flex-shrink-0 text-sm text-muted-foreground w-32 px-2 truncate">
        {document.owner}
      </div>
      
      <div className="flex-shrink-0 text-sm text-muted-foreground w-20 px-2">
        {document.size || '-'}
      </div>
      
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onClick(document)}>Open</DropdownMenuItem>
            {document.type === 'folder' ? (
              <>
                <DropdownMenuItem>New File</DropdownMenuItem>
                <DropdownMenuItem>New Folder</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
