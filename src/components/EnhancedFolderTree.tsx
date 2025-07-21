
import React, { useState } from 'react';
import { TreeNode } from '@/utils/buildTree';
import { TreeViewItem } from './TreeViewItem';
import { Button } from './ui/button';
import { FolderPlus, Upload, Archive, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EnhancedFolderTreeProps {
  data: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFileUpload?: (files: File[], folderId?: string) => void;
  onShare?: (nodeId: string) => void;
  onArchive?: (nodeId: string) => void;
  onFavorite?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export const EnhancedFolderTree: React.FC<EnhancedFolderTreeProps> = ({
  data,
  selectedId,
  onSelect,
  onFileUpload,
  onShare,
  onArchive,
  onFavorite,
  onDelete
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAction = (action: string, nodeId: string, data?: any) => {
    switch (action) {
      case 'add-subfolder':
        toast({
          title: 'Add Subfolder',
          description: `Adding subfolder to ${nodeId}`,
        });
        break;
      
      case 'rename':
        toast({
          title: 'Rename',
          description: `Renaming ${nodeId} to ${data?.newName}`,
        });
        break;
      
      case 'share':
        if (onShare) {
          onShare(nodeId);
        } else {
          toast({
            title: 'Share',
            description: `Sharing ${nodeId}`,
          });
        }
        break;
      
      case 'archive':
        if (onArchive) {
          onArchive(nodeId);
        } else {
          toast({
            title: 'Archive',
            description: `Archiving ${nodeId}`,
          });
        }
        break;
      
      case 'favorite':
        if (onFavorite) {
          onFavorite(nodeId);
        } else {
          toast({
            title: 'Favorite',
            description: `Adding ${nodeId} to favorites`,
          });
        }
        break;
      
      case 'move':
        toast({
          title: 'Move',
          description: `Moving ${nodeId} to ${data?.targetFolderId}`,
        });
        break;
      
      case 'delete':
        if (onDelete) {
          onDelete(nodeId);
        } else {
          toast({
            title: 'Delete',
            description: `Deleting ${nodeId}`,
            variant: 'destructive',
          });
        }
        break;
      
      case 'upload':
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          if (files.length > 0 && onFileUpload) {
            onFileUpload(files, nodeId);
          }
        };
        input.click();
        break;
      
      case 'download':
        toast({
          title: 'Download',
          description: `Downloading ${nodeId}`,
        });
        break;
      
      default:
        toast({
          title: 'Action',
          description: `Performing ${action} on ${nodeId}`,
        });
    }
  };

  const handleRootUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0 && onFileUpload) {
        onFileUpload(files);
      }
    };
    input.click();
  };

  const handleCreateRootFolder = () => {
    toast({
      title: 'Create Folder',
      description: 'Creating new folder in root',
    });
  };

  return (
    <div className="space-y-2">
      {/* Root Actions */}
      <div className="flex gap-2 p-2 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateRootFolder}
          className="flex items-center gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          New Folder
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRootUpload}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Tree View */}
      <div className="space-y-1">
        <div className="font-medium text-sm text-muted-foreground px-2 py-1">
          Folders
        </div>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No folders
          </div>
        ) : (
          <div className="group">
            {data.map((node) => (
              <TreeViewItem
                key={node.id}
                node={node}
                level={0}
                isExpanded={expandedNodes.has(node.id)}
                onToggle={toggleNode}
                onSelect={onSelect}
                selectedId={selectedId}
                allNodes={data}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
