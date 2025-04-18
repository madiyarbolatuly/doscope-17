
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'xlsx' | 'ppt' | 'image' | 'folder' | string;
  size?: string;
  modified: string;
  owner: string;
  category?: CategoryType;
  shared?: boolean;
  favorited?: boolean;
  thumbnail?: string;
}

export interface Version {
  id: string;
  versionNumber: number;
  date: string;
  author: string;
  changes: string;
  fileSize: string;
}

export type CategoryType = 
  | 'all' 
  | 'recent' 
  | 'favorites' 
  | 'shared' 
  | 'trash'
  | 'reports'
  | 'projects'
  | 'finance'
  | 'marketing'
  | 'products'
  | 'design';
