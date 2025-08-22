import React, { useEffect, useState } from 'react';
import { TreeNode } from '@/utils/buildTree';
import { TreeViewItem } from './TreeViewItem';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EnhancedFolderTreeProps {
  data: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFileUpload?: (files: File[], folderId?: string) => void;
  onAction: (action: string, nodeId: string, data?: any) =>
    void | Promise<boolean | { ok?: boolean; message?: string }>;
}

export const EnhancedFolderTree: React.FC<EnhancedFolderTreeProps> = ({
  data,
  selectedId,
  onSelect,
  onFileUpload,
  onAction,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // natural numbers-first sorting for root
  const collator = React.useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }),
    []
  );
  const startsWithDigit = (s: string) => /^\s*\d/.test(s || '');
  const compareNodes = React.useCallback((a: TreeNode, b: TreeNode) => {
    const aNum = startsWithDigit(a.name);
    const bNum = startsWithDigit(b.name);
    if (aNum !== bNum) return aNum ? -1 : 1;
    return collator.compare(a.name || '', b.name || '');
  }, [collator]);

  const sortedRoot = React.useMemo(
    () => data.slice().sort(compareNodes),
    [data, compareNodes]
  );

  useEffect(() => {
    setExpandedNodes(new Set(sortedRoot.map((n) => n.id)));
  }, [sortedRoot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedId) {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get('folderId');
      if (fromUrl) onSelect(fromUrl);
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleItemAction = (action: string, nodeId: string, data?: any) => {
    if (!onAction) {
      toast({ title: 'Не реализовано', description: `Действие "${action}" не настроено` });
      return;
    }
    return onAction(action, nodeId, data);
  };

  const handleRootUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0 && onFileUpload) onFileUpload(files);
    };
    input.click();
  };

  const handleCreateRootFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    // Convention: nodeId "root" means parent is null on the server
    await onAction('create-subfolder', 'root', { folderName: name });
    setNewFolderName('');
    setShowCreateFolderDialog(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-2 border-b">
        <Button variant="outline" size="sm" onClick={handleRootUpload} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Загрузить
        </Button>
        {/* Optional: New root folder button
        <Button variant="outline" size="sm" onClick={() => setShowCreateFolderDialog(true)} className="flex items-center gap-2">
          <FolderPlus className="h-4 w-4" />
          Новая папка
        </Button>
        */}
      </div>

      <div className="space-y-1">
        <div className="font-medium text-sm text-muted-foreground px-2 py-1">Папки</div>
        {sortedRoot.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Нет папок</div>
        ) : (
          <div className="group">
            {sortedRoot.map((node) => {
              const handleSelect = (id: string) => {
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('folderId', id);
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
                  allNodes={sortedRoot}
                  onAction={handleItemAction}
                  expandedNodes={expandedNodes}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Optional: create root folder dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую папку</DialogTitle>
            <DialogDescription>Введите имя для новой папки в корне</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rootFolderName" className="text-right">Имя папки</Label>
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
            <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>Отмена</Button>
            <Button onClick={handleCreateRootFolder} disabled={!newFolderName.trim()}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
