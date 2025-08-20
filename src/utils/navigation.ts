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
      navigate(`/?folderId=${folderId}`);
    },
    
    navigateToRoot: () => {
      navigate('/');
    },
    
    navigateToDocument: (documentId: string) => {
      navigate(`/document/${documentId}`);
    },
    
    getCurrentPath: () => {
      return window.location.pathname + window.location.search;
    },
    
    buildBreadcrumbPath: async (folderId: string): Promise<string[]> => {
      // You can fetch parent chain from API if needed
      return [];
    }
  };
};


export const useFolderNavigation = (navigate: NavigateFunction) => {
  return createFolderNavigation(navigate);
}; 