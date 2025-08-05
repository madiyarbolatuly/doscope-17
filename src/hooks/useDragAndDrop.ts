import { useState } from 'react';

export function useDragAndDrop({ onDrop }: { onDrop: (files: File[]) => Promise<void> }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Traverse file tree for folders
  const traverseFileTree = async (
    item: FileSystemEntry,
    path = '',
    fileList: File[] = []
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        const fileEntry = item as FileSystemFileEntry;
        fileEntry.file((file) => {
          (file as File & { relativePath?: string }).relativePath = path + file.name;
          fileList.push(file);
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + '/', fileList);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  // Handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => c + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c - 1;
      if (next <= 0) {
        setIsDragging(false);
        return 0;
      }
      return next;
    });
  };

  const handleDragOverArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropArea = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragging(false);
    await handleDropWithFolders(e);
  };

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOverArea,
    handleDropArea,
  };
}
