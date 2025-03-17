
import React from 'react';
import { Document } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { FolderPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
}

export function DocumentGrid({ documents, onDocumentClick }: DocumentGridProps) {
  // Separate folders and files
  const folders = documents.filter(doc => doc.type === 'folder');
  const files = documents.filter(doc => doc.type !== 'folder');

  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">No documents found</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          No documents match your current search or filter criteria. Try changing your search terms or adding new documents.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Folder
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {folders.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <DocumentCard key={folder.id} document={folder} onClick={onDocumentClick} />
            ))}
          </div>
        </div>
      )}
      
      {files.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Files</h2>
          <div className="border bg-card rounded-md">
            {files.map((file, index) => (
              <React.Fragment key={file.id}>
                {index > 0 && <div className="h-px bg-border mx-4" />}
                <DocumentCard document={file} onClick={onDocumentClick} />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
