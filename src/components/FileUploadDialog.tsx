
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, FolderPlus, Plus, Share2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDestination: (destination: 'downloads' | 'new') => void;
  onCreateFolder: () => void;
  onUpload: () => void;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  onSelectDestination,
  onCreateFolder,
  onUpload
}: FileUploadDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'downloads' | 'new'>('downloads');

  const handleSelectOption = (option: 'downloads' | 'new') => {
    setSelectedOption(option);
    onSelectDestination(option);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 flex justify-between items-center">
          <DialogTitle className="text-xl font-bold text-left">Куда загрузить?</DialogTitle>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-8 h-8 bg-muted hover:bg-muted/80"
              onClick={() => onOpenChange(false)}
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Поделиться</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-8 h-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Закрыть</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-3">
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

        <div className="flex items-center justify-between p-6 pt-2 border-t">
          <Button onClick={onCreateFolder} className="gap-2">
            <Plus className="h-4 w-4" />
            Новая папка
          </Button>
          <Button onClick={onUpload} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Загрузить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
