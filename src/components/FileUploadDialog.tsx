
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, FolderPlus, RefreshCw, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDestination: (destination: 'downloads' | 'new') => void;
  onCreateFolder: () => void;
  onUpload: (files: FileList | null) => void;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  onSelectDestination,
  onCreateFolder,
  onUpload
}: FileUploadDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'downloads' | 'new'>('downloads');
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectOption = (option: 'downloads' | 'new') => {
    setSelectedOption(option);
    onSelectDestination(option);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const handleUploadClick = () => {
    onUpload(files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0 flex justify-between items-center">
            <DialogTitle className="text-xl font-bold text-left">Загрузка файлов</DialogTitle>
          
          </DialogHeader>

          <div className="p-6 pt-4 space-y-4">
            <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition cursor-pointer" onClick={handleButtonClick}>
              <Upload className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">Нажмите, чтобы выбрать файлы</h3>
              <p className="text-sm text-muted-foreground">
                или перетащите файлы сюда
              </p>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
            </div>

            {files && files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium">Выбранные файлы ({files.length})</h4>
                <ul className="mt-2 space-y-2">
                  {Array.from(files).map((file, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-medium">Выберите место назначения:</h4>
              <button
                type="button"
                className={cn(
                  "w-full text-left flex items-center gap-3 p-4 rounded-lg transition-colors",
                  selectedOption === 'downloads'
                    ? "bg-accent border border-accent/50"
                    : "hover:bg-accent/50"
                )}
                onClick={() => handleSelectOption('downloads')}
              >
                <Folder className="h-6 w-6 text-primary" />
                <span className="font-medium">Загрузки</span>
              </button>

              <button
                type="button"
                className={cn(
                  "w-full text-left flex items-center gap-3 p-4 rounded-lg transition-colors",
                  selectedOption === 'new'
                    ? "bg-accent border border-accent/50"
                    : "hover:bg-accent/50"
                )}
                onClick={() => handleSelectOption('new')}
              >
                <FolderPlus className="h-6 w-6 text-primary" />
                <span className="font-medium">Новая папка</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 pt-2 border-t">

            <Button 
              onClick={handleUploadClick} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 "
              disabled={!files || files.length === 0}
            >
              <Upload className="h-4 w-4" />
              Загрузить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
}
