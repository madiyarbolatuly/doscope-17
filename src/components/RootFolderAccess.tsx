
import React from 'react';
import { Button } from './ui/button';
import { Home, Folder } from 'lucide-react';

interface RootFolderAccessProps {
  onNavigateToRoot: () => void;
  currentFolderId?: string;
}

export const RootFolderAccess: React.FC<RootFolderAccessProps> = ({
  onNavigateToRoot,
  currentFolderId
}) => {
  if (!currentFolderId) {
    return null; // Already at root
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onNavigateToRoot}
      className="flex items-center gap-2"
    >
      <Home className="h-4 w-4" />
      Корневая папка
    </Button>
  );
};
