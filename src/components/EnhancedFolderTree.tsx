
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
          title: 'Добавить подпапку',
          description: `Добавление подпапки в ${nodeId}`,
        });
        break;
      
      case 'rename':
        toast({
          title: 'Переименовать',
          description: `Переименование ${nodeId} в ${data?.newName}`,
        });
        break;
      
      case 'share':
        if (onShare) {
          onShare(nodeId);
        } else {
          toast({
            title: 'Поделиться',
            description: `Поделиться ${nodeId}`,
          });
        }
        break;
      
      case 'archive':
        if (onArchive) {
          onArchive(nodeId);
        } else {
          toast({
            title: 'Архивировать',
            description: `Архивирование ${nodeId}`,
          });
        }
        break;
      
      case 'favorite':
        if (onFavorite) {
          onFavorite(nodeId);
        } else {
          toast({
            title: 'Избранное',
            description: `Добавление ${nodeId} в избранное`,
          });
        }
        break;
      
      case 'move':
        toast({
          title: 'Переместить',
          description: `Перемещение ${nodeId} в ${data?.targetFolderId}`,
        });
        break;
      
      case 'delete':
        if (onDelete) {
          onDelete(nodeId);
        } else {
          toast({
            title: 'Удалить',
            description: `Удаление ${nodeId}`,
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
          title: 'Скачать',
          description: `Скачивание ${nodeId}`,
        });
        break;
      
      default:
        toast({
          title: 'Действие',
          description: `Выполнение ${action} для ${nodeId}`,
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
      title: 'Создать папку',
      description: 'Создание новой папки в корне',
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
          Новая папка
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRootUpload}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Загрузить
        </Button>
      </div>

      {/* Tree View */}
      <div className="space-y-1">
        <div className="font-medium text-sm text-muted-foreground px-2 py-1">
          Папки
        </div>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Нет папок
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
