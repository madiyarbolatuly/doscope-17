import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import {
  ChevronDown, ChevronRight, Folder, FolderPlus, Edit3,
  Share as ShareIcon, Move, Trash2, Download, MoreVertical, Star, Archive
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { DOCUMENT_ENDPOINTS } from "@/config/api";

import { TreeNode } from '@/utils/buildTree';
import { toast } from '@/hooks/use-toast';
import axios from "axios";
const LazyTreeViewDialogs = lazy(() => import('./TreeViewItemDialogs'));

interface TreeViewItemProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  allNodes: TreeNode[];
  onAction: (action: string, nodeId: string, data?: any) =>
    void | Promise<boolean | { ok?: boolean; message?: string }>;
  expandedNodes: Set<string>;
  onRefresh?: () => Promise<void> | void;

}

const TreeViewItemComponent: React.FC<TreeViewItemProps> = ({
  node,
  level,
  isExpanded,
  onToggle,
  onSelect,
  selectedId,
  allNodes,
  onAction,
  expandedNodes,
  onRefresh,
}) => {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');

  
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'folder';
  const hasChildren = !!(node.children && node.children.length > 0);

  // Numbers-first, case-insensitive, natural ordering
  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }),
    []
  );
  const startsWithDigit = (s: string) => /^\s*\d/.test(s || '');
  const compareNodes = useCallback((a: TreeNode, b: TreeNode) => {
    const aNum = startsWithDigit(a.name);
    const bNum = startsWithDigit(b.name);
    if (aNum !== bNum) return aNum ? -1 : 1;
    return collator.compare(a.name || '', b.name || '');
  }, [collator]);

  const sortedChildren = useMemo(
    () => (node.children || []).slice().sort(compareNodes),
    [node.children, compareNodes]
  );

  // Unified runner with safe feedback
  const runAction = async (action: string, payload?: any) => {
    try {
      const res = await Promise.resolve(onAction(action, node.id, payload));
      if (res === false) {
        toast({ title: 'Действие недоступно', description: `Действие "${action}" не реализовано.` });
      } else if (typeof res === 'object' && res) {
        const ok = 'ok' in res ? (res as any).ok : true;
        const message = (res as any).message;
        if (!ok) {
          toast({
            title: 'Ошибка',
            description: message ?? `Не удалось выполнить "${action}"`,
            variant: 'destructive',
          });
        } else if (message) {
          toast({ title: message });
        }
      }
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: `Не удалось выполнить "${action}"`,
        variant: 'destructive',
      });
    }
  };

  const handleAction = (action: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    switch (action) {
      case 'rename':
        setShowRenameDialog(true);
        break;
      case 'move':
        setShowMoveDialog(true);
        break;
      case 'share':
        void runAction('share');

        break;
      case 'add-subfolder':
        if (!isFolder) {
          toast({ title: 'Невозможно', description: 'Подпапка только в папке.' });
          return;
        }
        setShowCreateFolderDialog(true);
        break;
      default:
        void runAction(action);
    }
  };

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== node.name) {
      await runAction('rename', { newName: trimmed });
    }
    setShowRenameDialog(false);
  };

  const handleMove = async () => {
    if (!selectedTargetFolder) return;
  
    // "root" → null, иначе число
    const targetParentId =
      selectedTargetFolder === "root" ? null : Number(selectedTargetFolder);
  
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken") || ""
        : "";
  
    // 1) Сам в себя
    if (targetParentId !== null && String(targetParentId) === String(node.id)) {
      toast({
        title: "Ошибка",
        description: "Нельзя переместить элемент в самого себя",
        variant: "destructive",
      });
      return;
    }
  
    // 2) Нельзя в своего потомка
    const isDescendant = (parent: TreeNode, childId: string): boolean => {
      if (!parent.children) return false;
      return parent.children.some(
        (c) => c.id === childId || isDescendant(c, childId)
      );
    };
    if (targetParentId && isDescendant(node, String(targetParentId))) {
      toast({
        title: "Ошибка",
        description: "Нельзя переместить элемент в собственную подпапку",
        variant: "destructive",
      });
      return;
    }
  
    // 3) Дубликат имени в целевой папке
    const targetFolder = targetParentId
      ? allNodes.find((n) => String(n.id) === String(targetParentId))
      : { children: allNodes.filter((n) => !n.parent_id) };
  
    const hasDuplicate = targetFolder?.children?.some(
      (c) => c.name.trim().toLowerCase() === node.name.trim().toLowerCase()
    );
    if (hasDuplicate) {
      toast({
        title: "Ошибка",
        description: `В целевой папке уже есть элемент с именем "${node.name}"`,
        variant: "destructive",
      });
      return;
    }
  
    // === ВЫЗОВ API (обрати внимание на DOCUMENT_ENDPOINTS.MOVE) ===
    try {
      await axios.post(
        DOCUMENT_ENDPOINTS.MOVE(node.id),
        {
          document_id: Number(node.id),     // ок, сервер этого ждёт в body
          target_parent_id: targetParentId, // null | number
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      
  
  toast({ title: "Готово", description: `«${node.name}» перемещён` });
  if (typeof onRefresh === "function") await onRefresh();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Ошибка",
        description: e?.response?.data?.detail || "Не удалось переместить",
        variant: "destructive",
      });
    } finally {
      setShowMoveDialog(false);
      setSelectedTargetFolder("");
    }
  };
  


  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      await runAction('create-subfolder', { folderName: trimmed });
    }
    setShowCreateFolderDialog(false);
    setNewFolderName('');
  };

  const shouldRenderDialogs = showRenameDialog || showCreateFolderDialog || showMoveDialog;

  return (
    <>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-accent/50 group ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
       {isFolder ? (
  <Button
    variant="ghost"
    size="icon"
    className="h-4 w-4 p-0"
    onClick={(e) => {
      e.stopPropagation();
      if (hasChildren) onToggle(node.id);
    }}
    disabled={!hasChildren} // disables click if no children
  >
    {hasChildren ? (
      isExpanded ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )
    ) : (
      // empty placeholder to keep layout consistent
      <div className="h-3 w-3" />
    )}
  </Button>
) : (
  <div className="w-4" />
)}

        <Folder className="h-4 w-4 text-yellow-600" />
        <span className="flex-1 text-sm truncate">{node.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-background border shadow-lg z-50">
            <DropdownMenuItem onClick={(e) => handleAction('add-subfolder', e)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Добавить подпапку
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => handleAction('rename', e)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Переименовать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleAction('share', e)}>
              <ShareIcon className="h-4 w-4 mr-2" />
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

      {isExpanded && hasChildren && (
        <div>
          {sortedChildren.map((child) => (
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
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {shouldRenderDialogs && (
        <Suspense fallback={null}>
          <LazyTreeViewDialogs
            node={node}
            isFolder={isFolder}
            showRenameDialog={showRenameDialog}
            setShowRenameDialog={setShowRenameDialog}
            showCreateFolderDialog={showCreateFolderDialog}
            setShowCreateFolderDialog={setShowCreateFolderDialog}
            showMoveDialog={showMoveDialog}
            setShowMoveDialog={setShowMoveDialog}
            newName={newName}
            setNewName={setNewName}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            selectedTargetFolder={selectedTargetFolder}
            setSelectedTargetFolder={setSelectedTargetFolder}
            handleRename={handleRename}
            handleCreateFolder={handleCreateFolder}
            handleMove={handleMove}
            allNodes={allNodes}
            compareNodes={compareNodes}
          />
        </Suspense>
      )}
    </>
  );
};

const areEqual = (prev: TreeViewItemProps, next: TreeViewItemProps) => {
  if (prev.node.id !== next.node.id) return false;
  if (prev.node.name !== next.node.name) return false;
  if (prev.node.type !== next.node.type) return false;
  if ((prev.node.children?.length || 0) !== (next.node.children?.length || 0)) return false;
  if (prev.level !== next.level) return false;
  if (prev.isExpanded !== next.isExpanded) return false;
  if (prev.selectedId !== next.selectedId) return false;
  if (prev.expandedNodes !== next.expandedNodes) return false;
  if (prev.allNodes !== next.allNodes) return false;
  return true;
};

export const TreeViewItem = React.memo(TreeViewItemComponent, areEqual);
