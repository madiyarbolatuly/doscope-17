import { NavigateFunction } from 'react-router-dom';

export interface FolderNavigation {
  navigateToFolder: (folderId: string) => void;
  navigateToRoot: () => void;
  navigateToDocument: (documentId: string) => void;
  getCurrentPath: () => string;
  buildBreadcrumbPath: (folderId: string) => Promise<string[]>;
}

export const createFolderNavigation = (navigate: NavigateFunction): FolderNavigation => {
  return {
    navigateToFolder: (folderId: string) => {
      navigate(`/folder/${folderId}`);
    },
    
    navigateToRoot: () => {
      navigate('/');
    },
    
    navigateToDocument: (documentId: string) => {
      navigate(`/document/${documentId}`);
    },
    
    getCurrentPath: () => {
      return window.location.pathname;
    },
    
    buildBreadcrumbPath: async (folderId: string): Promise<string[]> => {
      // This would fetch the breadcrumb path from the API
      // Implementation depends on your backend structure
      return [];
    }
  };
};

export const useFolderNavigation = (navigate: NavigateFunction) => {
  return createFolderNavigation(navigate);
}; 