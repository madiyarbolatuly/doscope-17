
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size?: string;
  modified: string;
  owner: string;
  category?: CategoryType;
  shared?: boolean;
  favorited?: boolean;
  thumbnail?: string;
  path?: string;
  dueDate?: string;
  engineer?: string;
  linkedAssets?: string[];
  tags?: string[];
}

export type DocumentType = 'pdf' | 'doc' | 'xlsx' | 'ppt' | 'image' | 'folder' | string;

export interface Version {
  id: string;
  versionNumber?: number;
  date?: string;
  author?: string;
  changes?: string;
  fileSize?: string;
  // Alternative properties for the same data
  version?: string;
  modified?: string;
  modifiedBy?: string;
  size?: string;
  comment?: string;
}

export interface MultipleSelectionActions {
  selectedIds: string[];
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onDownloadSelected?: () => void;
  onShareSelected?: () => void;
  onRestoreSelected?: () => void;
}

export type ActivityAction = 
  | 'viewed' 
  | 'modified' 
  | 'commented' 
  | 'uploaded' 
  | 'downloaded'
  | 'deleted'
  | 'shared'
  | 'restored';

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
  | 'design'
  | 'managers'
  | 'development'
  | 'procurement'
  | 'electrical'
  | 'weakening'
  | 'interface'
  | 'pse'
  | 'hr'
  | 'contracts'
  | 'invoices'
  | 'sales'
  | 'customer'
  | 'meetings'
  | string;
