import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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
import { Share2, Download, FileText, File, FileImage, Folder, Eye, Calendar, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ROOT } from '@/config/api';
import type { Document } from '@/types/document';
import { downloadByFileName } from '@/services/downloadService';


type SharedWithMeItem = {
  id: number;
  token: string;
  shared_with: string;       // user id текущего
  filename: string;          // имя файла
  expires_at: string;        // ISO
  document_id: number;       // id документа
  shared_by: string;         // user id того, кто поделился (у тебя сейчас без имени)
  created_at: string;        // ISO
  file_type?: string;
};

interface SharedDocument extends Document {
  sharedBy: string;
  shareExpiration: string;   // ISO
  token: string;
  documentId: number;
  previewUrl?: string;
  favorited?: boolean;
}

const fileTypeFromName = (name: string, forceFolder = false): Document['type'] => {
  if (forceFolder) return 'folder';

  const parts = name.split('.');
  const last = parts[parts.length - 1].toLowerCase();

  // если точка есть, но это не известное расширение → это папка
  const knownExts = ['pdf','ppt','pptx','xls','xlsx','doc','docx',
                     'png','jpg','jpeg','gif','webp','bmp','tiff','zip'];

  if (knownExts.includes(last)) {
    if (['png','jpg','jpeg','gif','webp','bmp','tiff'].includes(last)) return 'image';
    if (['xls','xlsx'].includes(last)) return 'xlsx';
    if (['ppt','pptx'].includes(last)) return 'ppt';
    if (['doc','docx'].includes(last)) return 'doc';
    if (last === 'pdf') return 'pdf';
    if (last === 'zip') return 'zip';
    return 'file';
  }

  // иначе считаем папкой
  return 'folder';
};



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



const SharedDocuments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const token = localStorage.getItem('authToken') || '';

  // Получение данных с /v2/sharing/shared-with-me
  const fetchSharedWithMe = async () => { 
    setIsLoading(true);
    try {
      const resp = await axios.get<SharedWithMeItem[]>(
        `${API_ROOT}/sharing/shared-with-me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      const now = new Date();

      const mapped: SharedDocument[] = (resp.data || [])
        // берём только неистёкшие
        .filter(item => new Date(item.expires_at) > now)
        // преобразуем к твоей структуре
        .map((item): SharedDocument => {
          const type = fileTypeFromName(item.filename, item.file_type === 'folder');
          return {
            id: String(item.id),              // твой Document.id — string
            name: item.filename,
            type,
            size: '—',                        // нет в ответе — оставим прочерк
            modified: item.created_at,
            owner: item.shared_by,            // у тебя сейчас нет имени - только id
            category: '--',
            path: '',                         // нет в ответе
            tags: [],
            favorited: false,

            // дополнительные поля
            sharedBy: item.shared_by,
            shareExpiration: item.expires_at,
            token: item.token,
            documentId: item.document_id,
          };
        });

      setDocuments(mapped);
    } catch (e: any) {
      console.error('shared-with-me error:', e);
      toast({
        title: 'Ошибка',
        description: e?.response?.data?.detail || 'Не удалось загрузить «Поделенные со мной»',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedWithMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDocuments = useMemo(
    () => documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [documents, searchQuery]
  );

  
const handleDownload = async (doc: SharedDocument) => {
  try {
    // ВАЖНО: передаём точное имя из backend (без decode/трансформаций)
    await downloadByFileName(doc.name, token);
    // toast({ title: 'Готово', description: `Скачивание ${doc.name} запущено` });
  } catch (e: any) {
    console.error('Error downloading document:', e);
    toast({
      title: 'Ошибка',
      description: e?.response?.status === 404
        ? 'Файл не найден на сервере'
        : (e?.message || 'Не удалось скачать файл'),
      variant: 'destructive',
    });
  }
};
  const handlePreview = (document: SharedDocument) => {
    toast({
      title: "Предпросмотр",
      description: `Открытие ${document.name}`,
    });
    console.log('Preview shared doc:', document);
  };

  const handleToggleFavorite = (document: SharedDocument) => {
    setDocuments(prev =>
      prev.map(d =>
        d.id === document.id ? { ...d, favorited: !d.favorited } : d
      )
    );
    const fav = !document.favorited;
    toast({
      title: fav ? "Добавлено в избранное" : "Удалено из избранного",
      description: `${document.name} ${fav ? 'добавлен в' : 'удалён из'} избранного`,
    });
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
              Здесь отображаются файлы, которыми с вами поделились
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

        {/* Скелет/пустой/список */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Share2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Загружаем…
              </h3>
              <p className="text-gray-600">Пожалуйста, подождите</p>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Файлы не найдены
              </h3>
              <p className="text-gray-600">
                Поделенные с вами активные файлы будут отображаться здесь
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
                            {/* Инициалы из sharedBy (сейчас это id — просто первые 2 символа) */}
                            {(doc.sharedBy?.slice(0, 2) || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-gray-600">Поделился</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {doc.sharedBy}
                          </p>
                        </div>
                      </div>

                      {/* Expiration Date */}
                      <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Действует до</p>
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
