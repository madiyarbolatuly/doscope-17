import React, { useState, useEffect } from 'react';
import { TreeNode } from '@/utils/buildTree';
import { TreeViewItem } from './TreeViewItem';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
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

  useEffect(() => {
    const expandAll = (nodes: TreeNode[], expanded: Set<string>) => {
      for (const node of nodes) {
        expanded.add(node.id);
        if (node.children) expandAll(node.children, expanded);
      }
      return expanded;
    };
    setExpandedNodes(expandAll(data, new Set()));
  }, [data]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleAction = (action: string, nodeId: string, data?: any) => {
    switch (action) {
      case 'share': return onShare?.(nodeId);
      case 'archive': return onArchive?.(nodeId);
      case 'favorite': return onFavorite?.(nodeId);
      case 'delete': return onDelete?.(nodeId);
      case 'upload': {
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
      }
      default:
        toast({ title: 'Действие', description: `Действие '${action}' для ${nodeId}` });
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

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-2 border-b">
        <Button variant="outline" size="sm" onClick={handleRootUpload} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Загрузить
        </Button>
      </div>

      <div className="space-y-1">
        <div className="font-medium text-sm text-muted-foreground px-2 py-1">Папки</div>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Нет папок</div>
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
