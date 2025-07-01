
import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Document } from '@/types/document';
import { Share2, Grid2X2, List, Download, Clock, FileText, File, FileImage, Folder, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SharedDocument extends Document {
  sharedBy: string;
  shareExpiration: string;
  accessCount: number;
  maxAccess: number;
  previewUrl?: string;
}

// Mock shared documents
const mockSharedDocuments: SharedDocument[] = [
  {
    id: 'shared-1',
    name: 'Quarterly Report Q4 2024.pdf',
    type: 'pdf',
    size: '2.1 MB',
    modified: '2024-12-15T10:30:00Z',
    owner: 'Sarah Johnson',
    sharedBy: 'Sarah Johnson',
    category: 'reports',
    shareExpiration: '2024-12-25T23:59:59Z',
    accessCount: 3,
    maxAccess: 10,
    previewUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop'
  },
  {
    id: 'shared-2',
    name: 'Project Assets',
    type: 'folder',
    size: '45 MB',
    modified: '2024-12-10T14:15:00Z',
    owner: 'Mike Chen',
    sharedBy: 'Mike Chen',
    category: 'projects',
    shareExpiration: '2024-12-30T23:59:59Z',
    accessCount: 1,
    maxAccess: 5
  },
  {
    id: 'shared-3',
    name: 'Marketing Presentation.pptx',
    type: 'ppt',
    size: '8.3 MB',
    modified: '2024-12-12T16:45:00Z',
    owner: 'Emma Davis',
    sharedBy: 'Emma Davis',
    category: 'marketing',
    shareExpiration: '2024-12-20T23:59:59Z',
    accessCount: 7,
    maxAccess: 15,
    previewUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop'
  },
  {
    id: 'shared-4',
    name: 'Design Mockups',
    type: 'image',
    size: '12.7 MB',
    modified: '2024-12-08T09:20:00Z',
    owner: 'Lisa Wang',
    sharedBy: 'Lisa Wang',
    category: 'design',
    shareExpiration: '2024-12-22T23:59:59Z',
    accessCount: 2,
    maxAccess: 8,
    previewUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=200&fit=crop'
  }
];

const SharedDocuments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setDocuments(mockSharedDocuments);
  }, []);

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'ppt':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-purple-500" />;
      case 'folder':
        return <Folder className="h-6 w-6 text-yellow-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getTimeRemaining = (expiration: string) => {
    const now = new Date();
    const expirationDate = new Date(expiration);
    const diffMs = expirationDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleDownload = (document: SharedDocument) => {
    toast({
      title: "Загрузка начата",
      description: `Скачивание ${document.name}`,
    });
  };

  const handlePreview = (document: SharedDocument) => {
    toast({
      title: "Открытие предварительного просмотра",
      description: `Открытие ${document.name}`,
    });
  };

  return (
    <div className="container px-4 ml-0 mr-0 w-full md:px-6" style={{ maxWidth: "none" }}>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Документы</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Поделенные документы</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Поделенные документы</h1>
        <p className="text-muted-foreground">
          Документы и папки, которыми с вами поделились
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <SearchBar 
          query={searchQuery} 
          setQuery={setSearchQuery} 
          placeholder="Поиск поделенных документов..." 
        />
        
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid2X2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Share2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Нет поделенных документов</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Документы, которыми с вами поделились, будут отображаться здесь
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-2'}>
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-md transition-all">
              <CardContent className="p-4">
                {viewMode === 'grid' ? (
                  <div className="space-y-4">
                    {/* Preview */}
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      {doc.previewUrl ? (
                        <img 
                          src={doc.previewUrl} 
                          alt={doc.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {getFileIcon(doc.type)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Просмотр
                        </Button>
                      </div>
                    </div>

                    {/* File info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-sm line-clamp-2" title={doc.name}>
                          {doc.name}
                        </h3>
                        {getFileIcon(doc.type)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                          <AvatarFallback className="text-xs">
                            {doc.sharedBy.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{doc.sharedBy}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{doc.size}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.accessCount}/{doc.maxAccess} просмотров
                        </Badge>
                      </div>

                      {/* Timer */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Истекает через: {getTimeRemaining(doc.shareExpiration)}</span>
                      </div>

                      {/* Download button */}
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Скачать
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Поделился: {doc.sharedBy}</span>
                        <span>{doc.size}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeRemaining(doc.shareExpiration)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.accessCount}/{doc.maxAccess}
                      </Badge>
                      <Button size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedDocuments;
