import React, { useState, useEffect } from 'react';
import { mockApi, FolderStructure, MockDocument } from '@/services/mockApi';
import { Document } from '@/types/document';
import { DocumentGrid } from './DocumentGrid';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ArrowLeft, 
  Plus,
  Download,
  Share2,
  Archive,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface FolderNavigationProps {
  currentFolderId?: string;
  onFolderChange: (folderId?: string) => void;
  onDocumentClick: (document: Document) => void;
  onDocumentPreview: (document: Document) => void;
  viewMode: 'grid' | 'list';
  searchQuery?: string;
}

export function FolderNavigation({
  currentFolderId,
  onFolderChange,
  onDocumentClick,
  onDocumentPreview,
  viewMode,
  searchQuery = ''
}: FolderNavigationProps) {
  const [folders, setFolders] = useState<FolderStructure[]>([]);
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFolderContent();
  }, [currentFolderId, searchQuery]);

  const loadFolderContent = async () => {
    setLoading(true);
    try {
      const [foldersData, documentsData] = await Promise.all([
        mockApi.getFolders(currentFolderId),
        mockApi.getDocuments({ 
          folderId: currentFolderId,
          search: searchQuery 
        })
      ]);
      setFolders(foldersData);
      setDocuments(documentsData.documents);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить содержимое папки",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFolderDoubleClick = (folder: FolderStructure) => {
    onFolderChange(folder.id);
  };

  const handleBackClick = () => {
    // For simplicity, going back to root. In real app, maintain folder hierarchy
    onFolderChange(undefined);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await mockApi.createFolder(newFolderName, currentFolderId);
      setNewFolderName('');
      setShowCreateFolder(false);
      loadFolderContent();
      toast({
        title: "Успешно",
        description: `Папка "${newFolderName}" создана`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать папку",
        variant: "destructive"
      });
    }
  };

  const handleDocumentAction = async (action: string, document: MockDocument) => {
    try {
      switch (action) {
        case 'download':
          await mockApi.downloadDocument(document.id);
          toast({
            title: "Загрузка начата",
            description: `Скачивание ${document.name}`
          });
          break;
        case 'share':
          await mockApi.shareDocument(document.id, ['u2', 'u3']);
          toast({
            title: "Документ поделен",
            description: `${document.name} успешно поделен`
          });
          break;
        case 'archive':
          await mockApi.archiveDocument(document.id);
          loadFolderContent();
          toast({
            title: "Документ архивирован",
            description: `${document.name} перемещен в архив`
          });
          break;
        case 'trash':
          await mockApi.moveToTrash(document.id);
          loadFolderContent();
          toast({
            title: "Документ удален",
            description: `${document.name} перемещен в корзину`
          });
          break;
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive"
      });
    }
  };

  const handleToggleFavorite = async (document: MockDocument) => {
    try {
      await mockApi.toggleFavorite(document.id);
      loadFolderContent();
      toast({
        title: document.favorited ? "Удалено из избранного" : "Добавлено в избранное",
        description: `${document.name} ${document.favorited ? 'удален из' : 'добавлен в'} избранное`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус избранного",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentFolderId && (
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
          )}
        </div>
        
        <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Новая папка
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую папку</DialogTitle>
              <DialogDescription>
                Введите название для новой папки
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Название
                </Label>
                <Input
                  id="name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="col-span-3"
                  placeholder="Название папки"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders Grid */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Папки</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <Card 
                key={folder.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onDoubleClick={() => handleFolderDoubleClick(folder)}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    {currentFolderId === folder.id ? (
                      <FolderOpen className="h-12 w-12 text-blue-500" />
                    ) : (
                      <Folder className="h-12 w-12 text-yellow-500 group-hover:text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate" title={folder.name}>
                    {folder.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {folder.children?.length || 0} элементов
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {documents.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">
            Документы {documents.length > 0 && `(${documents.length})`}
          </h3>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDocumentClick(doc)}>
                            Открыть
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDocumentPreview(doc)}>
                            Предпросмотр
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDocumentAction('download', doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Скачать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDocumentAction('share', doc)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Поделиться
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDocumentAction('archive', doc)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Архивировать
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDocumentAction('trash', doc)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="font-medium text-sm mb-1 truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {doc.size} • {doc.owner}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.modified).toLocaleDateString('ru-RU')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <DocumentGrid
              documents={documents}
              onDocumentClick={onDocumentClick}
              onDocumentPreview={onDocumentPreview}
              onDocumentSelect={() => {}}
              onToggleFavorite={handleToggleFavorite}
              viewMode={viewMode}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'Документы не найдены' : 'Папка пуста'}
        </div>
      )}
    </div>
  );
}