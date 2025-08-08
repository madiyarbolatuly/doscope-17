
import { useState, useCallback } from 'react';

interface FileWithPath extends File {
  webkitRelativePath?: string;
}

export function useDragAndDrop(onFileUpload: (files: File[], targetFolderId?: string) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const traverseFileTree = useCallback(async (item: any, path: string = ''): Promise<File[]> => {
    return new Promise((resolve) => {
      const files: File[] = [];
      
      if (item.isFile) {
        item.file((file: File) => {
          const fileWithPath = file as FileWithPath;
          fileWithPath.webkitRelativePath = path + file.name;
          files.push(fileWithPath);
          resolve(files);
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries(async (entries: any[]) => {
          const allFiles: File[] = [];
          for (const entry of entries) {
            const entryFiles = await traverseFileTree(entry, path + item.name + '/');
            allFiles.push(...entryFiles);
          }
          resolve(allFiles);
        });
      } else {
        resolve(files);
      }
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files, targetFolderId);
    }
  }, [onFileUpload]);

  const handleDropWithFolders = useCallback(async (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const allFiles: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          const files = await traverseFileTree(entry);
          allFiles.push(...files);
        }
      }
    }

    if (allFiles.length > 0) {
      onFileUpload(allFiles, targetFolderId);
    }
  }, [onFileUpload, traverseFileTree]);

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropWithFolders
  };
}
