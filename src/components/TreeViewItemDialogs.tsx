import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { Button } from './ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { TreeNode } from '@/utils/buildTree';

export interface TreeViewItemDialogsProps {
  node: TreeNode;
  isFolder: boolean;
  showRenameDialog: boolean;
  setShowRenameDialog: Dispatch<SetStateAction<boolean>>;
  showCreateFolderDialog: boolean;
  setShowCreateFolderDialog: Dispatch<SetStateAction<boolean>>;
  showMoveDialog: boolean;
  setShowMoveDialog: Dispatch<SetStateAction<boolean>>;
  newName: string;
  setNewName: Dispatch<SetStateAction<string>>;
  newFolderName: string;
  setNewFolderName: Dispatch<SetStateAction<string>>;
  selectedTargetFolder: string;
  setSelectedTargetFolder: Dispatch<SetStateAction<string>>;
  handleRename: () => void | Promise<void>;
  handleCreateFolder: () => void | Promise<void>;
  handleMove: () => void | Promise<void>;
  allNodes: TreeNode[];
  compareNodes: (a: TreeNode, b: TreeNode) => number;
}

const TreeViewItemDialogs: React.FC<TreeViewItemDialogsProps> = ({
  node,
  isFolder,
  showRenameDialog,
  setShowRenameDialog,
  showCreateFolderDialog,
  setShowCreateFolderDialog,
  showMoveDialog,
  setShowMoveDialog,
  newName,
  setNewName,
  newFolderName,
  setNewFolderName,
  selectedTargetFolder,
  setSelectedTargetFolder,
  handleRename,
  handleCreateFolder,
  handleMove,
  allNodes,
  compareNodes,
}) => {
  const folderTree = useMemo(() => {
    if (!showMoveDialog) return [];

    const sortLevel = (nodes: TreeNode[] = []): TreeNode[] =>
      nodes
        .filter((child) => child.type === 'folder' && String(child.id) !== String(node.id))
        .slice()
        .sort(compareNodes)
        .map((child) => ({ ...child, children: sortLevel(child.children || []) }));

    return sortLevel(allNodes);
  }, [allNodes, compareNodes, node.id, showMoveDialog]);

  const folderOptions = useMemo(() => {
    if (!showMoveDialog) return null;

    const render = (folders: TreeNode[], prefix = ''): React.ReactNode[] =>
      folders.flatMap((folder) => [
        <SelectItem key={folder.id} value={String(folder.id)}>
          {prefix}
          {folder.name}
        </SelectItem>,
        ...render(folder.children || [], `${prefix}  `),
      ]);

    return render(folderTree);
  }, [folderTree, showMoveDialog]);

  return (
    <>
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать {isFolder ? 'папку' : 'файл'}</DialogTitle>
            <DialogDescription>Введите новое имя для “{node.name}”.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Имя
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleRename}>Переименовать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую папку</DialogTitle>
            <DialogDescription>Введите имя для новой подпапки в “{node.name}”.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folderName" className="text-right">
                Имя папки
              </Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) handleCreateFolder();
                }}
                className="col-span-3"
                placeholder="Имя новой папки"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переместить {isFolder ? 'папку' : 'файл'}</DialogTitle>
            <DialogDescription>Выберите папку назначения для “{node.name}”.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right">
                Папка назначения
              </Label>
              <Select value={selectedTargetFolder} onValueChange={setSelectedTargetFolder}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите папку назначения" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Корневая папка</SelectItem>
                  {folderOptions}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleMove} disabled={!selectedTargetFolder}>
              Переместить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TreeViewItemDialogs;
