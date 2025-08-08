
import { useCallback, useState } from 'react';

interface FileWithPath extends File {
  webkitRelativePath: string;
  path?: string;
}

export function useDragAndDrop(onFilesUploaded?: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const traverseFileTree = useCallback(async (entry: any): Promise<File[]> => {
    const files: File[] = [];
    
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => {
        entry.file((f: File) => {
          const fileWithPath = Object.assign(f, { 
            webkitRelativePath: entry.fullPath || f.webkitRelativePath || '',
            path: entry.fullPath 
          });
          resolve(fileWithPath as File);
        });
      });
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise<any[]>((resolve) => {
        reader.readEntries(resolve);
      });
      
      for (const childEntry of entries) {
        const childFiles = await traverseFileTree(childEntry);
        files.push(...childFiles);
      }
    }
    
    return files;
  }, []);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files: File[] = [];
    
    if (e.dataTransfer?.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            const entryFiles = await traverseFileTree(entry);
            files.push(...entryFiles);
          }
        }
      }
    } else if (e.dataTransfer?.files) {
      files.push(...Array.from(e.dataTransfer.files));
    }

    if (files.length > 0 && onFilesUploaded) {
      onFilesUploaded(files);
    }
  }, [onFilesUploaded, traverseFileTree]);

  const handleDropWithFolders = useCallback(async (e: DragEvent) => {
    await handleDrop(e);
  }, [handleDrop]);

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDropWithFolders
  };
}
