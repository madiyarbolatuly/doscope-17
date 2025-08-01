
import React, { useState, useEffect } from 'react';
import { TreeNode } from '@/utils/buildTree';
import { EnhancedFolderTree } from '@/components/EnhancedFolderTree';
import { ProjectsGrid } from '@/components/ProjectsGrid';
import { ShareModal } from '@/components/ShareModal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [folderTreeData, setFolderTreeData] = useState<TreeNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareNodeId, setShareNodeId] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock folder data for selected project
  useEffect(() => {
    if (selectedProjectId) {
      // This would normally fetch folders for the selected project from API
      const mockFolders: TreeNode[] = [
        {
          id: `project-${selectedProjectId}-folder-1`,
          name: 'Проектная документация',
          type: 'folder',
          parent_id: null,
          modified: new Date().toISOString(),
          owner: 'Система',
          children: [
            {
              id: `project-${selectedProjectId}-folder-1-1`,
              name: 'Архитектурные чертежи',
              type: 'folder',
              parent_id: `project-${selectedProjectId}-folder-1`,
              modified: new Date().toISOString(),
              owner: 'Система',
              children: []
            },
            {
              id: `project-${selectedProjectId}-folder-1-2`,
              name: 'Конструктивные решения',
              type: 'folder',
              parent_id: `project-${selectedProjectId}-folder-1`,
              modified: new Date().toISOString(),
              owner: 'Система',
              children: []
            }
          ]
        },
        {
          id: `project-${selectedProjectId}-folder-2`,
          name: 'Договоры и согласования',
          type: 'folder',
          parent_id: null,
          modified: new Date().toISOString(),
          owner: 'Система',
          children: []
        },
        {
          id: `project-${selectedProjectId}-folder-3`,
          name: 'Техническая документация',
          type: 'folder',
          parent_id: null,
          modified: new Date().toISOString(),
          owner: 'Система',
          children: [
            {
              id: `project-${selectedProjectId}-folder-3-1`,
              name: 'Спецификации',
              type: 'folder',
              parent_id: `project-${selectedProjectId}-folder-3`,
              modified: new Date().toISOString(),
              owner: 'Система',
              children: []
            }
          ]
        }
      ];
      setFolderTreeData(mockFolders);
    }
  }, [selectedProjectId]);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setSelectedNodeId(null);
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleFileUpload = (files: File[], folderId?: string) => {
    toast({
      title: "Загрузка файлов",
      description: `Загружено ${files.length} файл(ов) в папку ${folderId || 'корневую'}`
    });
  };

  const handleShareNode = (nodeId: string) => {
    setShareNodeId(nodeId);
    setShowShareModal(true);
  };

  const handleArchiveNode = (nodeId: string) => {
    toast({
      title: "Архивирование",
      description: "Папка перемещена в архив"
    });
  };

  const handleFavoriteNode = (nodeId: string) => {
    toast({
      title: "Избранное",
      description: "Папка добавлена в избранное"
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    toast({
      title: "Удаление",
      description: "Папка удалена"
    });
  };

  const handleCreateFolder = (folderName: string, parentId?: string) => {
    const newFolder: TreeNode = {
      id: `folder-${Date.now()}`,
      name: folderName,
      type: 'folder',
      parent_id: parentId || null,
      modified: new Date().toISOString(),
      owner: 'Пользователь',
      children: []
    };

    setFolderTreeData(prev => {
      if (!parentId) {
        return [...prev, newFolder];
      }
      
      const updateTree = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newFolder]
            };
          }
          if (node.children) {
            return {
              ...node,
              children: updateTree(node.children)
            };
          }
          return node;
        });
      };
      
      return updateTree(prev);
    });

    toast({
      title: "Папка создана",
      description: `Создана папка "${folderName}"`
    });
  };

  const handleMoveNode = (nodeId: string, targetFolderId: string) => {
    toast({
      title: "Перемещение",
      description: "Элемент перемещен"
    });
  };

  const handleRenameNode = (nodeId: string, newName: string) => {
    setFolderTreeData(prev => {
      const updateTree = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, name: newName };
          }
          if (node.children) {
            return {
              ...node,
              children: updateTree(node.children)
            };
          }
          return node;
        });
      };
      return updateTree(prev);
    });

    toast({
      title: "Переименование",
      description: `Элемент переименован в "${newName}"`
    });
  };

  // Find the selected node for ShareModal
  const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const shareNode = shareNodeId ? findNodeById(folderTreeData, shareNodeId) : null;

  if (!selectedProjectId) {
    return <ProjectsGrid onProjectSelect={handleProjectSelect} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Project Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="sm" onClick={handleBackToProjects}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к проектам
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Проект</h1>
          <p className="text-sm text-muted-foreground">Структура папок проекта</p>
        </div>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-hidden">
        <EnhancedFolderTree
          data={folderTreeData}
          selectedId={selectedNodeId}
          onSelect={handleNodeSelect}
          onFileUpload={handleFileUpload}
          onShare={handleShareNode}
          onArchive={handleArchiveNode}
          onFavorite={handleFavoriteNode}
          onDelete={handleDeleteNode}
          onCreateFolder={handleCreateFolder}
          onMoveNode={handleMoveNode}
          onRenameNode={handleRenameNode}
        />
      </div>

      {/* Share Modal */}
      {shareNode && (
        <ShareModal
          document={shareNode}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default Index;
