
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Clock, Download, FileText, MoreHorizontal, 
  Share, Star, Trash, Eye, Pencil, Move, Copy, Type, 
  ExternalLink, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetadataCard } from '@/components/MetadataCard';
import { PageHeader } from '@/components/PageHeader';
import { VersionHistoryList, Version } from '@/components/VersionHistoryList';
import { Activity, ActivityItem } from '@/components/ActivityItem';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const DocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("metadata");
  
  const document = {
    id: id || '1',
    title: 'Годовой финансовый отчет 2023',
    description: 'Полный финансовый анализ и прогнозы на 2023 финансовый год',
    owner: 'Финансовый отдел',
    createdBy: 'Иван Смирнов',
    createdAt: '2023-01-15T10:30:00Z',
    modifiedAt: '2023-03-22T14:45:00Z',
    size: '4.2 МБ',
    fileType: 'PDF',
    tags: ['Финансы', 'Годовой отчет', 'Конфиденциально'],
    thumbnailUrl: '/placeholder.svg?height=400&width=300&text=PDF',
    downloadUrl: '#',
    versions: 3,
    status: 'Опубликовано',
    permissions: 'Приватный',
    previewUrl: '/placeholder.svg?height=800&width=600&text=PDF Preview'
  };

  const versionHistory: Version[] = [
    {
      id: 'v3',
      version: 'Версия 3 (Текущая)',
      modified: '2023-03-22T14:45:00Z',
      modifiedBy: 'Иван Смирнов',
      size: '4.2 МБ',
      comment: 'Обновлены финансовые прогнозы на основе результатов Q1'
    },
    {
      id: 'v2',
      version: 'Версия 2',
      modified: '2023-02-10T09:15:00Z',
      modifiedBy: 'Елена Иванова',
      size: '3.9 МБ',
      comment: 'Включены отзывы финансовых консультантов'
    },
    {
      id: 'v1',
      version: 'Версия 1',
      modified: '2023-01-15T10:30:00Z',
      modifiedBy: 'Иван Смирнов',
      size: '3.5 МБ',
      comment: 'Первоначальное создание документа'
    }
  ];

  const activityLog: Activity[] = [
    {
      id: 'act5',
      user: 'Сара Вильсон',
      action: 'просмотрела',
      date: '2023-03-25T11:30:00Z'
    },
    {
      id: 'act4',
      user: 'Иван Смирнов',
      action: 'изменил',
      date: '2023-03-22T14:45:00Z'
    },
    {
      id: 'act3',
      user: 'Михаил Браун',
      action: 'скачал',
      date: '2023-03-20T09:15:00Z'
    },
    {
      id: 'act2',
      user: 'Елена Иванова',
      action: 'комментировала',
      date: '2023-02-10T09:15:00Z'
    },
    {
      id: 'act1',
      user: 'Иван Смирнов',
      action: 'загрузил',
      date: '2023-01-15T10:30:00Z'
    }
  ];

  const handleDownload = () => {
    toast.success('Скачивание документа начато');
  };

  const handleShare = () => {
    toast.success('Ссылка для общего доступа скопирована в буфер обмена');
  };

  const handleRename = () => {
    toast.success('Документ переименован');
  };

  const handleMove = () => {
    toast.success('Документ перемещен');
  };

  const handleCopy = () => {
    toast.success('Документ скопирован');
  };

  const handleDelete = () => {
    toast.success('Документ удален');
    navigate('/');
  };
  
  const handleEdit = () => {
    setIsEditMode(true);
    toast.success('Режим редактирования активирован');
  };
  
  const handleViewDetails = () => {
    setActiveTab("metadata");
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <a href="/">
            <ChevronLeft className="h-4 w-4" /> Назад к документам
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PageHeader 
            title={document.title}
            description={document.description}
          >
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-1" />
                Предпросмотр
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePreview}>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Предпросмотр</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Редактировать</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <Info className="mr-2 h-4 w-4" />
                    <span>Детали</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Скачать</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share className="mr-2 h-4 w-4" />
                    <span>Поделиться</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRename}>
                    <Type className="mr-2 h-4 w-4" />
                    <span>Переименовать</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMove}>
                    <Move className="mr-2 h-4 w-4" />
                    <span>Переместить</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Копировать</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Удалить</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </PageHeader>

          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative">
                <img
                  src={document.thumbnailUrl}
                  alt={document.title}
                  className="h-full w-full object-contain"
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button 
                    onClick={handlePreview}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Предпросмотр
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={handleEdit}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Редактировать
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="metadata">Метаданные</TabsTrigger>
              <TabsTrigger value="versions">Версии</TabsTrigger>
              <TabsTrigger value="activity">Активность</TabsTrigger>
            </TabsList>
            <TabsContent value="metadata" className="space-y-4">
              <MetadataCard 
                title="Информация о документе"
                items={[
                  { label: 'Создал', value: document.createdBy },
                  { label: 'Дата создания', value: new Date(document.createdAt).toLocaleDateString() },
                  { label: 'Последнее изменение', value: new Date(document.modifiedAt).toLocaleDateString() },
                  { label: 'Размер файла', value: document.size },
                  { label: 'Тип файла', value: document.fileType },
                  { label: 'Статус', value: document.status },
                  { label: 'Разрешения', value: document.permissions },
                ]}
              />
              <div>
                <h3 className="text-lg font-medium mb-2">Теги</h3>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="versions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    История версий
                  </CardTitle>
                  <CardDescription>
                    Отслеживайте изменения, внесенные в этот документ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VersionHistoryList versions={versionHistory} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Журнал активности
                  </CardTitle>
                  <CardDescription>
                    Недавняя активность, связанная с этим документом
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {activityLog.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Действия с файлом</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Предпросмотр
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleViewDetails}>
                <Info className="mr-2 h-4 w-4" />
                Детали
              </Button>
              <Button className="w-full justify-start" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Скачать
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Поделиться
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleRename}>
                <Type className="mr-2 h-4 w-4" />
                Переименовать
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleMove}>
                <Move className="mr-2 h-4 w-4" />
                Переместить
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Копировать
              </Button>
              <Button className="w-full justify-start" variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Связанные документы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href="#" className="text-sm hover:underline">Финансовый отчет Q1 2023</a>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href="#" className="text-sm hover:underline">Годовой бюджет 2023</a>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href="#" className="text-sm hover:underline">Финансовые прогнозы 2023-2024</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Модальное окно предпросмотра документа */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{document.title}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Скачать
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {document.fileType} • {document.size}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4 h-full">
            <div className="bg-muted rounded-md p-4 h-full flex items-center justify-center">
              <div className="relative w-full h-full">
                <img 
                  src={document.previewUrl} 
                  alt={document.title} 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно редактирования документа */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Редактирование документа: {document.title}</DialogTitle>
            <DialogDescription>
              Внесите изменения в документ
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4 h-full">
            <div className="bg-muted rounded-md p-4 h-full flex items-center justify-center">
              <div className="bg-white rounded-md shadow-md w-full h-full p-8 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Редактор документа будет доступен позже</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditMode(false)}>Отмена</Button>
            <Button onClick={() => {
              setIsEditMode(false);
              toast.success('Изменения сохранены');
            }}>Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentDetails;
