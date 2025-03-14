
import React from 'react';
import { Document } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface MetadataCardProps {
  document: Document;
}

export function MetadataCard({ document }: MetadataCardProps) {
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  const getMetadataFields = () => {
    const fileExtension = getFileExtension(document.name);
    
    return [
      { label: 'File Type', value: fileExtension },
      { label: 'Size', value: document.size || 'Unknown' },
      { label: 'Created By', value: document.owner },
      { label: 'Modified', value: format(new Date(document.modified), 'MMM d, yyyy h:mm a') },
      { label: 'Location', value: document.path || '/' },
      { label: 'Status', value: 'Active', type: 'badge' }
    ];
  };

  const metadataFields = getMetadataFields();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Document Metadata</h3>
      
      <div className="space-y-3">
        {metadataFields.map((field, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-sm text-muted-foreground">{field.label}:</span>
            <div className="text-right">
              {field.type === 'badge' ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  {field.value}
                </Badge>
              ) : (
                <span className="text-sm font-medium">{field.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4">
        <h4 className="text-sm font-medium mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Financial
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Report
          </Badge>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            2023
          </Badge>
        </div>
      </div>
    </div>
  );
}
