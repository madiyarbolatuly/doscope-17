import React, { useState, useRef } from 'react';
import { Upload, X, File, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

interface FileUploaderProps {
  onUploadComplete?: (fileNames: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export function FileUploader({ 
  onUploadComplete,
  maxFiles = 5,
  acceptedFileTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.txt"
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'uploading' | 'success' | 'error'}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles);
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    
    setFiles(updatedFiles);
    
    // Initialize progress and status for new files
    const newProgress = { ...uploadProgress };
    const newStatus = { ...uploadStatus };
    
    newFiles.forEach(file => {
      const fileId = `${file.name}-${Date.now()}`;
      newProgress[fileId] = 0;
      newStatus[fileId] = 'idle';
    });
    
    setUploadProgress(newProgress);
    setUploadStatus(newStatus);
  };
  
  const handleUploadClick = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    try {
      // Replace with your actual API endpoint
      const response = await axios.post('/v2/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add auth header if needed
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              files.forEach(file => {
                newProgress[file.name] = percent;
              });
              return newProgress;
            });
          }
        }
      });
      setUploadStatus((prev) => {
        const newStatus = { ...prev };
        files.forEach(file => {
          newStatus[file.name] = 'success';
        });
        return newStatus;
      });
      if (onUploadComplete) onUploadComplete(files.map(f => f.name));
    } catch (error) {
      setUploadStatus((prev) => {
        const newStatus = { ...prev };
        files.forEach(file => {
          newStatus[file.name] = 'error';
        });
        return newStatus;
      });
    }
  };
  
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dropAreaRef.current?.classList.add('border-primary');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dropAreaRef.current?.classList.remove('border-primary');
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dropAreaRef.current?.classList.remove('border-primary');
    handleFileChange(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div 
        ref={dropAreaRef}
        className="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-primary"
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor="file-upload-input" className="sr-only">
          Выберите файлы для загрузки
        </label>
        <input
          id="file-upload-input"
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept={acceptedFileTypes}
          onChange={(e) => handleFileChange(e.target.files)}
          // @ts-expect-error: webkitdirectory is not standard but needed for folder upload
          webkitdirectory="true"
          directory="true"
          title="Выберите файлы для загрузки"
        />
        
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-1">Перетащите файлы для загрузки</h3>
          <p className="text-sm text-muted-foreground mb-2">
            или нажмите для выбора
          </p>
          <p className="text-xs text-muted-foreground">
            Принимаются {acceptedFileTypes.split(',').join(', ')}
          </p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-medium">Выбранные файлы ({files.length}/{maxFiles})</h4>
          
          <div className="space-y-2">
            {files.map((file, index) => {
              const fileId = `${file.name}-${Date.now()}`;
              const progress = uploadProgress[fileId] || 0;
              const status = uploadStatus[fileId] || 'idle';
              
              return (
                <div key={index} className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                  <File className="h-5 w-5 text-primary" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    
                    {status !== 'idle' && (
                      <div className="w-full mt-1">
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    {status === 'success' ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <span 
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
            className="ml-1 mt-2"
          >
            {files.length} {files.length === 1 ? 'файл' : files.length >= 2 && files.length <= 4 ? 'файла' : 'файлов'}
          </span>
        </div>
      )}
    </div>
  );
}
