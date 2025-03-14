
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Share, Star, Trash2, 
  Clock, FileText, User, Tag, MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Document } from '@/types/document';
import { ActivityItem } from '@/components/ActivityItem';
import { MetadataCard } from '@/components/MetadataCard';
import { VersionHistoryList } from '@/components/VersionHistoryList';

// Mock document data - this would come from your API in production
const getMockDocument = (id: string): Document => {
  return {
    id,
    name: "Annual Report 2023.pdf",
    type: "pdf",
    size: "4.2 MB",
    modified: new Date().toISOString(),
    owner: "Alex Johnson",
    category: "reports",
    path: "/reports/financial",
    favorited: true
  };
};

// Mock activities
const activities = [
  { id: '1', user: 'Alex Johnson', action: 'modified', date: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', user: 'Sarah Miller', action: 'viewed', date: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', user: 'David Chen', action: 'commented', date: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', user: 'Alex Johnson', action: 'uploaded', date: new Date(Date.now() - 172800000).toISOString() }
];

// Mock versions
const versions = [
  { 
    id: '1', 
    version: 'v3.0', 
    modified: new Date(Date.now() - 3600000).toISOString(),
    modifiedBy: 'Alex Johnson',
    size: '4.2 MB',
    comment: 'Final revisions incorporated'
  },
  { 
    id: '2', 
    version: 'v2.0', 
    modified: new Date(Date.now() - 604800000).toISOString(),
    modifiedBy: 'Sarah Miller',
    size: '4.1 MB',
    comment: 'Updated financial data'
  },
  { 
    id: '3', 
    version: 'v1.0', 
    modified: new Date(Date.now() - 2592000000).toISOString(),
    modifiedBy: 'Alex Johnson',
    size: '3.8 MB',
    comment: 'Initial version'
  }
];

const DocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const document = getMockDocument(id || '');

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Documents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/reports">Reports</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{document.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 bg-card rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Star className="h-4 w-4 mr-2" />
                    Favorite
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Tag className="h-4 w-4 mr-2" />
                    Add Tags
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Move to Trash
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex justify-center items-center bg-accent rounded-lg h-96 mb-6">
            <FileText className="h-24 w-24 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold mb-2">{document.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Modified {format(new Date(document.modified), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>Owner: {document.owner}</span>
            </div>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              <span>Size: {document.size}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-card rounded-lg border overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                <TabsTrigger value="versions" className="flex-1">Versions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="p-4">
                <MetadataCard document={document} />
              </TabsContent>
              
              <TabsContent value="activity" className="p-4">
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {activities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="versions" className="p-4">
                <h3 className="text-lg font-medium mb-4">Version History</h3>
                <VersionHistoryList versions={versions} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;
