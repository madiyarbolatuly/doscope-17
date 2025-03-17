
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Version {
  id: string;
  version: string;
  modified: string;
  modifiedBy: string;
  size: string;
  comment?: string;
}

interface VersionHistoryListProps {
  versions: Version[];
}

export function VersionHistoryList({ versions }: VersionHistoryListProps) {
  return (
    <div className="space-y-4">
      {versions.map((version, index) => (
        <div 
          key={version.id} 
          className={`p-3 border rounded-lg ${index === 0 ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{version.version}</span>
                {index === 0 && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(version.modified), 'MMM d, yyyy h:mm a')}
              </p>
              <p className="text-sm mt-1">
                <span className="text-muted-foreground">By:</span> {version.modifiedBy}
              </p>
              {version.comment && (
                <p className="text-sm mt-2 text-muted-foreground">
                  "{version.comment}"
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                <span className="text-xs">Download</span>
              </Button>
              {index !== 0 && (
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  <span className="text-xs">Restore</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
