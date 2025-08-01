
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderPlus, Edit3, Share, Move, Trash2, Upload, Download, FileText, MoreVertical, Star, Archive } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { TreeNode } from '@/utils/buildTree';

interface TreeViewItemProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  allNodes: TreeNode[];
  onAction: (action: string, nodeId: string, data?: any) => void;
  expandedNodes: Set<string>;
}

export const TreeViewItem: React.FC<TreeViewItemProps> = ({
  node,
  level,
  isExpanded,
  onToggle,
  onSelect,
  selectedId,
  allNodes,
  onAction,
  expandedNodes
}) => {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');

  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isFolder = node.type === 'folder';

  const handleAction = (action: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    switch (action) {
      case 'rename':
        setShowRenameDialog(true);
        break;
      case 'move':
        setShowMoveDialog(true);
        break;
      case 'add-subfolder':
        setShowCreateFolderDialog(true);
        break;
      case 'share':
        onAction('share', node.id);
        break;
      case 'archive':
        onAction('archive', node.id);
        break;
      case 'favorite':
        onAction('favorite', node.id);
        break;
      case 'delete':
        onAction('delete', node.id);
        break;
      case 'upload':
        onAction('upload', node.id);
        break;
      case 'download':
        onAction('download', node.id);
        break;
      case 'view-source':
        onAction('view-source', node.id);
        break;
      default:
        onAction(action, node.id);
    }
  };

  const handleRename = () => {
    if (newName.trim() !== node.name) {
      onAction('rename', node.id, { newName: newName.trim() });
    }
    setShowRenameDialog(false);
  };

  const handleMove = () => {
    if (selectedTargetFolder) {
      onAction('move', node.id, { targetFolderId: selectedTargetFolder });
    }
    setShowMoveDialog(false);
    setSelectedTargetFolder('');
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onAction('create-subfolder', node.id, { folderName: newFolderName.trim() });
    }
    setShowCreateFolderDialog(false);
    setNewFolderName('');
  };

  const getFolderOptions = (excludeId: string): TreeNode[] => {
    const filterFolders = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter(n => n.type === 'folder' && n.id !== excludeId)
        .map(n => ({
          ...n,
          children: filterFolders(n.children || [])
        }));
    };
    return filterFolders(allNodes);
  };

  const renderFolderOptions = (folders: TreeNode[], prefix = ''): React.ReactNode[] => {
    return folders.flatMap(folder => [
      <SelectItem key={folder.id} value={folder.id}>
        {prefix}{folder.name}
      </SelectItem>,
      ...renderFolderOptions(folder.children || [], prefix + '  ')
    ]);
  };

  return (
    <>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-accent/50 group ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/Collapse Button */}
        {isFolder && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}

        {!isFolder && <div className="w-4" />}

        {/* Icon */}
        <Folder className="h-4 w-4 text-yellow-600" />

        {/* Node Name */}
        <span className="flex-1 text-sm truncate">{node.name}</span>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
            <DropdownMenuItem onClick={(e) => handleAction('add-subfolder', e)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Добавить подпапку
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleAction('upload', e)}>
              <Upload className="h-4 w-4 mr-2" />
              Загрузить файлы
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={(e) => handleAction('rename', e)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Переименовать
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={(e) => handleAction('share', e)}>
              <Share className="h-4 w-4 mr-2" />
              Поделиться
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={(e) => handleAction('favorite', e)}>
              <Star className="h-4 w-4 mr-2" />
              Добавить в избранное
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={(e) => handleAction('move', e)}>
              <Move className="h-4 w-4 mr-2" />
              Переместить
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={(e) => handleAction('download', e)}>
              <Download className="h-4 w-4 mr-2" />
              Скачать
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={(e) => handleAction('archive', e)}>
              <Archive className="h-4 w-4 mr-2" />
              Архивировать
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={(e) => handleAction('delete', e)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children?.map((child) => (
            <TreeViewItem
              key={child.id}
              node={child}
              level={level + 1}
              isExpanded={expandedNodes.has(child.id)}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              allNodes={allNodes}
              onAction={onAction}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать {isFolder ? 'папку' : 'файл'}</DialogTitle>
            <DialogDescription>
              Введите новое имя для "{node.name}"
            </DialogDescription>
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
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleRename}>
              Переименовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую папку</DialogTitle>
            <DialogDescription>
              Введите имя для новой подпапки в "{node.name}"
            </DialogDescription>
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

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переместить {isFolder ? 'папку' : 'файл'}</DialogTitle>
            <DialogDescription>
              Выберите папку назначения для "{node.name}"
            </DialogDescription>
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
                  {renderFolderOptions(getFolderOptions(node.id))}
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
