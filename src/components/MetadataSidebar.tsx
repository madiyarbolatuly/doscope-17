
import React from 'react';
import { Document } from '@/types/document';
import { MetadataCard } from './MetadataCard';
import {
  FileText, File, FileSpreadsheet, FileImage, 
  Folder, X, Download, Share2, Star, Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface MetadataSidebarProps {
  document?: Document;
  onClose: () => void;
}

export function MetadataSidebar({ document, onClose }: MetadataSidebarProps) {
  if (!document) {
    return (
      <div className="h-full flex items-center justify-center border-l p-6">
        <p className="text-muted-foreground text-center">
          Select a file or folder to view its details
        </p>
      </div>
    );
  }

  const renderIcon = () => {
    switch (document.type) {
      case 'pdf':
        return <FileText className="h-16 w-16 text-red-500" />;
      case 'doc':
        return <FileText className="h-16 w-16 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-16 w-16 text-green-500" />;
      case 'image':
        return <FileImage className="h-16 w-16 text-purple-500" />;
      case 'folder':
        return <Folder className="h-16 w-16 text-yellow-500" />;
      default:
        return <File className="h-16 w-16 text-gray-500" />;
    }
  };

  const isFolder = document.type === 'folder';
  const fileExtension = document.name.split('.').pop()?.toUpperCase() || '';
  const modifiedDate = new Date(document.modified);
  
  return (
    <div className="h-full border-l bg-background overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium">Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {document.thumbnail ? (
              <img 
                src={document.thumbnail} 
                alt={document.name} 
                className="max-h-28 object-contain" 
              />
            ) : renderIcon()}
          </div>
          
          <h3 className="text-lg font-medium">{document.name}</h3>
          <p className="text-sm text-muted-foreground">
            {isFolder ? 'Folder' : fileExtension}
          </p>
        </div>
        
        <div className="flex gap-2 justify-center">
          {!isFolder && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button variant="outline" size="sm">
            <Star className="h-4 w-4 mr-2" />
            {document.favorited ? 'Unstar' : 'Star'}
          </Button>
          
          <Button variant="outline" size="sm" className="text-destructive border-destructive">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">
              {isFolder ? 'Folder' : fileExtension}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Size</span>
            <span className="text-sm font-medium">{document.size || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Owner</span>
            <span className="text-sm font-medium">{document.owner}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Modified</span>
            <span className="text-sm font-medium">{format(modifiedDate, 'MMM d, yyyy h:mm a')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Location</span>
            <span className="text-sm font-medium">{document.path || '/'}</span>
          </div>
        </div>
        
        <Separator />
        
        <MetadataCard 
          title="Activity" 
          items={[
            { label: 'Last opened by', value: document.owner },
            { label: 'Last modified', value: format(modifiedDate, 'MMM d, yyyy h:mm a') },
          ]} 
        />
      </div>
    </div>
  );
}
