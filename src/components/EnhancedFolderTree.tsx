import React, { useState, useEffect } from 'react';
import { TreeNode } from '@/utils/buildTree';
import { TreeViewItem } from './TreeViewItem';
import { Button } from './ui/button';
import { FolderPlus, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EnhancedFolderTreeProps {
  data: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFileUpload?: (files: File[], folderId?: string) => void;
  onShare?: (nodeId: string) => void;
  onArchive?: (nodeId: string) => void;
  onFavorite?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onCreateFolder?: (folderName: string, parentId?: string) => void;
  onMoveNode?: (nodeId: string, targetFolderId: string) => void;
  onRenameNode?: (nodeId: string, newName: string) => void;
  onAction: (action: string, nodeId: string, data?: any) => void;  // <-- 🔥 add this
}

export const EnhancedFolderTree: React.FC<EnhancedFolderTreeProps> = ({
  data,
  selectedId,
  onSelect,
  onFileUpload,
  onShare,
  onArchive,
  onFavorite,
  onDelete,
  onCreateFolder,
  onMoveNode,
  onRenameNode
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    // Start with all root nodes expanded
    const rootNodes = new Set(data.map(node => node.id));
    setExpandedNodes(rootNodes);
  }, [data]);

  // Synchronise selected folder with URL query parameter.
  // When the component is first mounted, if no folder is selected
  // via props but a `folderId` is present in the current URL
  // (e.g. `?folderId=xyz`), call the `onSelect` callback so the
  // parent can update its state accordingly. This makes it possible
  // for users to copy the URL and share it with others – when they
  // navigate to that URL, the same folder will be selected automatically.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only initialise from the URL if there isn't already a selected
    // folder provided from the parent. Without this guard we would
    // continually overwrite the parent's selection whenever the
    // component re-renders.
    if (!selectedId) {
      const searchParams = new URLSearchParams(window.location.search);
      const folderFromUrl = searchParams.get('folderId');
      if (folderFromUrl) {
        onSelect(folderFromUrl);
      }
    }
    // We intentionally only run this effect once on mount. The empty
    // dependency array means it will not re-run when `selectedId`
    // changes, preventing an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      case 'share': 
        return onShare?.(nodeId);
      case 'archive': 
        return onArchive?.(nodeId);
      case 'favorite': 
        return onFavorite?.(nodeId);
      case 'delete': 
        return onDelete?.(nodeId);
      case 'rename':
        return onRenameNode?.(nodeId, data?.newName);
      case 'move':
        return onMoveNode?.(nodeId, data?.targetFolderId);
      case 'create-subfolder':
        return onCreateFolder?.(data?.folderName, nodeId);
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

  const handleCreateRootFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolderDialog(false);
    }
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
            {data.map((node) => {
              // Wrap the provided onSelect to update the URL when a folder is selected.
              // This ensures that the folder ID is reflected in the query string, enabling
              // the URL to be shared with others so that they will see the same folder
              // selected when they open it. The wrapper persists the rest of the
              // existing behaviour and forwards the call to the parent-provided
              // `onSelect` callback.
              const handleSelect = (id: string) => {
                // Update the URL without causing a full page reload. We modify
                // the current query parameters rather than clobbering all of them,
                // preserving other potential parameters.
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('folderId', id);
                  // Use `replaceState` to avoid adding a new entry to the browser
                  // history on every click; copying the URL still reflects the
                  // current folder.
                  window.history.replaceState({}, '', url.toString());
                }
                onSelect(id);
              };
              return (
                <TreeViewItem
                  key={node.id}
                  node={node}
                  level={0}
                  isExpanded={expandedNodes.has(node.id)}
                  onToggle={toggleNode}
                  onSelect={handleSelect}
                  selectedId={selectedId}
                  allNodes={data}
                  onAction={handleAction}
                  expandedNodes={expandedNodes}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Create Root Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую папку</DialogTitle>
            <DialogDescription>
              Введите имя для новой папки в корневом каталоге
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rootFolderName" className="text-right">
                Имя папки
              </Label>
              <Input
                id="rootFolderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
                placeholder="Имя новой папки"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateRootFolder} disabled={!newFolderName.trim()}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
