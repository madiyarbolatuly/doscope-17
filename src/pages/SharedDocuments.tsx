
import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Share2, Download, FileText, File, FileImage, Folder, Eye, Calendar, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SharedDocument extends Document {
  sharedBy: string;
  shareExpiration: string;
  previewUrl?: string;
}

// Mock shared documents - только не истекшие
const mockSharedDocuments: SharedDocument[] = [
 {
    id: 'shared-5',
    name: 'Спецификация до 31 августа 2025',
    type: 'folder',
    size: '18.6 MB',
    modified: '2025-07-20T11:00:00Z',
    owner: 'Madiyar Saduakas',
    sharedBy: 'Madiyar Saduakas',
    category: 'спецификации',
    shareExpiration: '2025-08-31T18:59:59Z',
    favorited: false
  }
];

const SharedDocuments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Фильтруем только не истекшие документы
    const now = new Date();
    const activeDocuments = mockSharedDocuments.filter(doc => {
      const expirationDate = new Date(doc.shareExpiration);
      return expirationDate > now;
    });
    setDocuments(activeDocuments);
  }, []);

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'ppt':
        return <FileText className="h-8 w-8 text-orange-500" />;
      case 'image':
        return <FileImage className="h-8 w-8 text-purple-500" />;
      case 'folder':
        return <Folder className="h-8 w-8 text-yellow-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatExpirationDate = (expiration: string) => {
    const expirationDate = new Date(expiration);
    return expirationDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (document: SharedDocument) => {
    toast({
      title: "Загрузка начата",
      description: `Скачивание ${document.name}`,
    });
    console.log('Downloading document:', document.name);
  };

  const handlePreview = (document: SharedDocument) => {
    toast({
      title: "Открытие предварительного просмотра",
      description: `Открытие ${document.name}`,
    });
    console.log('Opening preview for document:', document.name);
  };

  const handleToggleFavorite = (document: SharedDocument) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === document.id 
          ? { ...doc, favorited: !doc.favorited }
          : doc
      )
    );
    
    const isFavorited = !document.favorited;
    toast({
      title: isFavorited ? "Добавлено в избранное" : "Удалено из избранного",
      description: `${document.name} ${isFavorited ? 'добавлен в' : 'удален из'} избранное`,
    });
    console.log('Toggled favorite for document:', document.name, 'favorited:', isFavorited);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-blue-600 hover:text-blue-800">
                  Документы
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-700">Поделенные документы</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Поделенные файлы
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Безопасно загружайте файлы, которыми с вами поделились
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <SearchBar 
              query={searchQuery} 
              setQuery={setSearchQuery} 
              placeholder="Поиск файлов..." 
              showFilterButton={false}
            />
          </div>
        </div>

        {/* Files Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Файлы не найдены
              </h3>
              <p className="text-gray-600">
                Поделенные с вами файлы будут отображаться здесь
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {filteredDocuments.map((doc) => {
              return (
                <Card 
                  key={doc.id} 
                  className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white border-0 shadow-lg overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Preview Section */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {doc.previewUrl ? (
                        <img 
                          src={doc.previewUrl} 
                          alt={doc.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50">
                          {getFileIcon(doc.type)}
                        </div>
                      )}
                      
                      {/* Favorite Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorite(doc)}
                        className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-lg transition-all duration-300 ${
                          doc.favorited 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-white/80 hover:bg-white text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${doc.favorited ? 'fill-current' : ''}`} />
                      </Button>
                      
                      {/* Preview Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={() => handlePreview(doc)}
                          className="bg-white/90 hover:bg-white text-gray-900 font-semibold px-6 py-3 rounded-full shadow-lg"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          Предпросмотр
                        </Button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-4">
                      {/* File Name */}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">{doc.size}</p>
                      </div>

                      {/* Shared By */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {doc.sharedBy.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-gray-600">Поделился</p>
                          <p className="text-sm font-semibold text-gray-900">{doc.sharedBy}</p>
                        </div>
                      </div>

                      {/* Expiration Date */}
                      <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">
                            Действует до
                          </p>
                          <p className="font-bold text-sm text-green-700">
                            {formatExpirationDate(doc.shareExpiration)}
                          </p>
                        </div>
                      </div>

                      {/* Download Button */}
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Скачать файл
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedDocuments;
