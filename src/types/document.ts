
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
  path?: string;
  dueDate?: string;
  engineer?: string;
  linkedAssets?: string[];
}

export interface Version {
  id: string;
  versionNumber: number;
  date: string;
  author: string;
  changes: string;
  fileSize: string;
  version?: string;
  modified?: string;
  modifiedBy?: string;
  size?: string;
  comment?: string;
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
  | 'meetings';

export type DocumentType = 
  | 'pdf'
  | 'doc'
  | 'xlsx'
  | 'ppt'
  | 'image'
  | 'folder'
  | string;

export type ActivityAction = 
  | 'viewed'
  | 'modified'
  | 'commented'
  | 'uploaded'
  | 'downloaded'
  | 'deleted'
  | 'shared'
  | 'created';

export interface MultipleSelectionActions {
  selectedIds: string[];
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onDownloadSelected?: () => void;
  onShareSelected?: () => void;
  onRestoreSelected?: () => void;
}
