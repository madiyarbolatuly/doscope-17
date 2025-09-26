import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  onAction: (action: string, nodeId: string, data?: any)
    => void | Promise<boolean | { ok?: boolean; message?: string }>;

  /** 🔹 Контролируемое раскрытие (необяз.) */
  expandedIds?: string[];
  onToggleExpanded?: (ids: string[]) => void;

  /** 🔹 Ключ для localStorage (например, `expanded:${projectRootId}`) */
  persistKey?: string;
}

/** Найти путь от корня до узла (список id) */
function findPath(nodes: TreeNode[], targetId: string): string[] | null {
  const stack: { node: TreeNode; path: string[] }[] = nodes.map(n => ({ node: n, path: [n.id] }));
  while (stack.length) {
    const { node, path } = stack.pop()!;
    if (node.id === targetId) return path;
    (node.children ?? []).forEach(ch => stack.push({ node: ch, path: [...path, ch.id] }));
  }
  return null;
}

export const EnhancedFolderTree: React.FC<EnhancedFolderTreeProps> = ({
  data,
  selectedId,
  onSelect,
  onFileUpload,
  onAction,
  expandedIds,
  onToggleExpanded,
  persistKey,
}) => {
  /** ====== сортировка корня по «числа сначала» ====== */
  const collator = useMemo(
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
  const sortedRoot = useMemo(() => data.slice().sort(compareNodes), [data, compareNodes]);

  /** ====== раскрытие: controlled / uncontrolled ====== */
  const isControlled = Array.isArray(expandedIds) && typeof onToggleExpanded === 'function';
  const [uncontrolled, setUncontrolled] = useState<string[]>([]);
  const expandedSet = useMemo(
    () => new Set(isControlled ? expandedIds! : uncontrolled),
    [isControlled, expandedIds, uncontrolled]
  );

  // Инициализация: читаем из localStorage один раз
  const didInitRef = useRef(false);
  useEffect(() => {
    if (isControlled || didInitRef.current) return;
    didInitRef.current = true;
    if (persistKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(persistKey) || '[]');
        if (Array.isArray(saved)) setUncontrolled(saved);
      } catch {}
    } else {
      // по дефолту чуть-чуть UX: раскрыть только корневые, без навязчивого «expand all»
      setUncontrolled(sortedRoot.map(n => n.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сохраняем раскрытие при каждом апдейте (только для uncontrolled)
  useEffect(() => {
    if (!isControlled && persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(uncontrolled));
    }
  }, [isControlled, persistKey, uncontrolled]);

  // Если меняется selectedId — раскрываем «путь до узла», чтобы узел был видим
  useEffect(() => {
    if (!selectedId) return;
    const path = findPath(sortedRoot, selectedId);
    if (!path || path.length <= 1) return;

    const ensureExpanded = (ids: string[]) => {
      const next = new Set(ids);
      // раскрываем все предки (кроме последнего — это сам узел)
      path.slice(0, -1).forEach(id => next.add(id));
      return Array.from(next);
    };

    if (isControlled) {
      onToggleExpanded!(ensureExpanded(expandedIds || []));
    } else {
      setUncontrolled(prev => ensureExpanded(prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, sortedRoot]);

  // При изменении набора узлов не сбрасываем раскрытие: чистим несуществующие id
  useEffect(() => {
    const allIds = new Set<string>();
    const walk = (nodes: TreeNode[]) => nodes.forEach(n => {
      allIds.add(n.id);
      (n.children ?? []).length && walk(n.children!);
    });
    walk(sortedRoot);

    const reconcile = (ids: string[]) => ids.filter(id => allIds.has(id));

    if (isControlled) {
      // В controlled режиме ничего не трогаем — родитель решает
    } else {
      setUncontrolled(prev => reconcile(prev));
    }
  }, [sortedRoot, isControlled]);

  const setExpanded = (updater: (curr: string[]) => string[]) => {
    if (isControlled) {
      onToggleExpanded!(updater(expandedIds || []));
    } else {
      setUncontrolled(updater);
    }
  };

  const toggleNode = (id: string) => {
    setExpanded(curr => {
      const set = new Set(curr);
      set.has(id) ? set.delete(id) : set.add(id);
      return Array.from(set);
    });
  };

  /** ====== действия ====== */
  const handleItemAction = (action: string, nodeId: string, data?: any) => {
    if (!onAction) {
      toast({ title: 'Не реализовано', description: `Действие "${action}" не настроено` });
      return;
    }
    return onAction(action, nodeId, data);
  };

  /** ====== загрузка в корень (файлы/папка) ====== */
  const spawnInput = (folderMode: boolean, onFiles: (files: File[]) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    if (folderMode) {
      (input as any).webkitdirectory = true;
      (input as any).directory = true;
    }
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const list = Array.from(target.files ?? []);
      if (list.length === 0) return;
      const prepared = list.map(f => {
        (f as any).relativePath = (f as any).webkitRelativePath || f.name;
        return f;
      });
      onFiles(prepared);
    });
    input.click();
  };

  const handleRootUploadFiles = () => {
    if (!onFileUpload) return;
    spawnInput(false, (files) => onFileUpload(files)); // parent_id берёт текущая папка
  };
  const handleRootUploadFolder = () => {
    if (!onFileUpload) return;
    spawnInput(true, (files) => onFileUpload(files));
  };

  /** ====== создание корневой папки ====== */
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const handleCreateRootFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    await onAction('create-subfolder', 'root', { folderName: name }); // обработка 'root' на уровне родителя
    setNewFolderName('');
    setShowCreateFolderDialog(false);
  };

  /** ====== рендер ====== */
  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-2 border-b">
        <Button variant="outline" size="sm" onClick={handleRootUploadFiles} className="flex items-center gap-2" title="Загрузить файлы">
          <Upload className="h-4 w-4" /> Файлы
        </Button>
        <Button variant="outline" size="sm" onClick={handleRootUploadFolder} className="flex items-center gap-2" title="Загрузить папку c подпапками">
          <Upload className="h-4 w-4" /> Папку
        </Button>
        {/* при желании добавьте кнопку создания корневой папки */}
        {/* <Button size="sm" onClick={() => setShowCreateFolderDialog(true)}>+ Папка</Button> */}
      </div>

      <div className="space-y-1">
        <div className="font-medium text-sm text-muted-foreground px-2 py-1">Папки</div>
        {sortedRoot.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Нет папок</div>
        ) : (
          <div className="group">
            {sortedRoot.map((node) => {
              const handleSelect = (id: string) => {
                // обновляем URL (сохраняем контекст)
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
                  isExpanded={expandedSet.has(node.id)}
                  onToggle={toggleNode}
                  onSelect={handleSelect}
                  selectedId={selectedId}
                  allNodes={sortedRoot}
                  onAction={handleItemAction}
                  expandedNodes={expandedSet}  // для вложенных элементов
                />
              );
            })}
          </div>
        )}
      </div>

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
