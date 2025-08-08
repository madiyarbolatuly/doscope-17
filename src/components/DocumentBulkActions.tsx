
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share, Archive, Download, Trash2 } from 'lucide-react';

interface DocumentBulkActionsProps {
  selectedCount: number;
  onShare: () => void;
  onArchive: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const DocumentBulkActions: React.FC<DocumentBulkActionsProps> = ({
  selectedCount,
  onShare,
  onArchive,
  onDownload,
  onDelete
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-800">
          {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onArchive}
            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
