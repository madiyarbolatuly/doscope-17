import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, FileSpreadsheet, FileImage, File, 
  MoreHorizontal, Download, Share2, Trash, Grid2X2, List
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityItem } from '@/components/ActivityItem';
import { MetadataCard } from '@/components/MetadataCard';
import { VersionHistoryList } from '@/components/VersionHistoryList';
import { Document, ActivityAction } from '@/types/document';
import { DocumentGrid } from '@/components/DocumentGrid';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    action: "viewed",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: 'Alex Johnson'
  },
  {
    id: '2',
    action: "modified",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    user: 'Sarah Miller'
  },
  {
    id: '3',
    action: "commented",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    user: 'David Chen'
  },
  {
    id: '4',
    action: "uploaded",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    user: 'Emily Wang'
  },
  {
    id: '5',
    action: "downloaded",
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    user: 'Alex Johnson'
  }
];

const MOCK_VERSIONS = [
  { id: '1', version: '1.0', modified: '2023-01-01', user: 'John Doe' },
  { id: '2', version: '1.1', modified: '2023-02-15', user: 'Jane Smith' },
  { id: '3', version: '1.2', modified: '2023-03-20', user: 'John Doe' },
];

const MOCK_RELATED_DOCUMENTS: Document[] = [
  {
    id: '7',
    name: 'Competitor Analysis.pdf',
    type: 'pdf',
    size: '2.9 MB',
    modified: new Date(Date.now() - 518400000).toISOString(),
    owner: 'Michelle Lee',
    category: 'marketing'
  },
  {
    id: '8',
    name: 'Sales Report Q1 2023.xlsx',
    type: 'xlsx',
    size: '2.1 MB',
    modified: new Date(Date.now() - 604800000).toISOString(),
    owner: 'David Chen',
    category: 'sales'
  },
  {
    id: '9',
    name: 'Customer Feedback Survey.doc',
    type: 'doc',
    size: '1.5 MB',
    modified: new Date(Date.now() - 691200000).toISOString(),
    owner: 'Emily Wang',
    category: 'customer'
  }
];

const MOCK_DOCUMENT: Document =   {
  id: '1',
  name: 'Annual Report 2023.pdf',
  type: 'pdf',
  size: '4.2 MB',
  modified: new Date(Date.now() - 3600000).toISOString(),
  owner: 'Alex Johnson',
  category: 'reports',
  favorited: true
};

const DocumentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [versions, setVersions] = useState(MOCK_VERSIONS);
  const [relatedDocuments, setRelatedDocuments] = useState<Document[]>(MOCK_RELATED_DOCUMENTS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Mock fetch document details
    setTimeout(() => {
      setDocument(MOCK_DOCUMENT);
      setActivities(MOCK_ACTIVITIES);
    }, 500);
  }, [id]);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Документы</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{document?.name || 'Загрузка...'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{document?.name || 'Загрузка...'}</CardTitle>
                    <CardDescription>
                      {document?.type.toUpperCase()} • {document?.size} • Обновлено {document?.modified ? new Date(document.modified).toLocaleDateString() : '...'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Скачать</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        <span>Поделиться</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Удалить</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center p-6 bg-accent rounded-md">
                    {document?.type === 'pdf' && (
                      <FileText className="h-40 w-40 text-primary" />
                    )}
                    {document?.type === 'doc' && (
                      <FileText className="h-40 w-40 text-blue-500" />
                    )}
                    {document?.type === 'xlsx' && (
                      <FileSpreadsheet className="h-40 w-40 text-green-500" />
                    )}
                    {document?.type === 'ppt' && (
                      <File className="h-40 w-40 text-orange-500" />
                    )}
                    {document?.type === 'image' && (
                      <FileImage className="h-40 w-40 text-purple-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Похожие документы</CardTitle>
                  <div className="flex items-center space-x-2">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
                      <ToggleGroupItem value="grid" aria-label="Сетка">
                        <Grid2X2 className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" aria-label="Список">
                        <List className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </CardHeader>
                <CardContent>
                  <DocumentGrid 
                    documents={relatedDocuments} 
                    onDocumentClick={() => {}} 
                    viewMode={viewMode}
                    selectedDocument={null}
                    onDocumentSelect={() => {}}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Метаданные</CardTitle>
                  <CardDescription>Информация о документе</CardDescription>
                </CardHeader>
                <CardContent>
                  <MetadataCard document={document} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Активность</CardTitle>
                  <CardDescription>Недавние действия с документом</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    {activities.map(activity => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>История версий</CardTitle>
                  <CardDescription>Предыдущие версии документа</CardDescription>
                </CardHeader>
                <CardContent>
                  <VersionHistoryList versions={versions} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;
