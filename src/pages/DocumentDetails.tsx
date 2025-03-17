
import React from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Download, FileText, MoreHorizontal, Share, Star, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetadataCard } from '@/components/MetadataCard';
import { PageHeader } from '@/components/PageHeader';
import { VersionHistoryList, Version } from '@/components/VersionHistoryList';
import { Activity, ActivityItem } from '@/components/ActivityItem';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const DocumentDetails = () => {
  const { id } = useParams();
  
  // В реальном приложении здесь был бы запрос к API для получения данных документа
  const document = {
    id: id || '1',
    title: 'Annual Financial Report 2023',
    description: 'Complete financial analysis and projections for fiscal year 2023',
    owner: 'Financial Department',
    createdBy: 'John Smith',
    createdAt: '2023-01-15T10:30:00Z',
    modifiedAt: '2023-03-22T14:45:00Z',
    size: '4.2 MB',
    fileType: 'PDF',
    tags: ['Financial', 'Annual Report', 'Confidential'],
    thumbnailUrl: '/placeholder.svg?height=400&width=300&text=PDF',
    downloadUrl: '#',
    versions: 3,
    status: 'Published',
    permissions: 'Private'
  };

  // История версий в формате, соответствующем типу Version
  const versionHistory: Version[] = [
    {
      id: 'v3',
      version: 'Version 3 (Current)',
      modified: '2023-03-22T14:45:00Z',
      modifiedBy: 'John Smith',
      size: '4.2 MB',
      comment: 'Updated financial projections based on Q1 results'
    },
    {
      id: 'v2',
      version: 'Version 2',
      modified: '2023-02-10T09:15:00Z',
      modifiedBy: 'Emily Johnson',
      size: '3.9 MB',
      comment: 'Incorporated feedback from financial advisors'
    },
    {
      id: 'v1',
      version: 'Version 1',
      modified: '2023-01-15T10:30:00Z',
      modifiedBy: 'John Smith',
      size: '3.5 MB',
      comment: 'Initial document creation'
    }
  ];

  const activityLog: Activity[] = [
    {
      id: 'act5',
      user: 'Sarah Wilson',
      action: 'viewed',
      date: '2023-03-25T11:30:00Z'
    },
    {
      id: 'act4',
      user: 'John Smith',
      action: 'modified',
      date: '2023-03-22T14:45:00Z'
    },
    {
      id: 'act3',
      user: 'Michael Brown',
      action: 'downloaded',
      date: '2023-03-20T09:15:00Z'
    },
    {
      id: 'act2',
      user: 'Emily Johnson',
      action: 'commented',
      date: '2023-02-10T09:15:00Z'
    },
    {
      id: 'act1',
      user: 'John Smith',
      action: 'uploaded',
      date: '2023-01-15T10:30:00Z'
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <a href="/">
            <ChevronLeft className="h-4 w-4" /> Back to Documents
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PageHeader 
            title={document.title}
            description={document.description}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="mr-2 h-4 w-4" />
                  <span>Add to Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PageHeader>

          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <img
                  src={document.thumbnailUrl}
                  alt={document.title}
                  className="h-full w-full object-contain"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="metadata">
            <TabsList>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="metadata" className="space-y-4">
              <MetadataCard 
                title="Document Information"
                items={[
                  { label: 'Created By', value: document.createdBy },
                  { label: 'Created Date', value: new Date(document.createdAt).toLocaleDateString() },
                  { label: 'Last Modified', value: new Date(document.modifiedAt).toLocaleDateString() },
                  { label: 'File Size', value: document.size },
                  { label: 'File Type', value: document.fileType },
                  { label: 'Status', value: document.status },
                  { label: 'Permissions', value: document.permissions },
                ]}
              />
              <div>
                <h3 className="text-lg font-medium mb-2">Tags</h3>
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
                    Version History
                  </CardTitle>
                  <CardDescription>
                    Track changes made to this document over time
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
                    Activity Log
                  </CardTitle>
                  <CardDescription>
                    Recent activity related to this document
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
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Share className="mr-2 h-4 w-4" />
                Share Document
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Star className="mr-2 h-4 w-4" />
                Add to Favorites
              </Button>
              <Button className="w-full justify-start" variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href="#" className="text-sm hover:underline">Q1 Financial Report 2023</a>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href="#" className="text-sm hover:underline">Annual Budget 2023</a>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href="#" className="text-sm hover:underline">Financial Projections 2023-2024</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;
