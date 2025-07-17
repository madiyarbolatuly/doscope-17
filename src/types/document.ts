
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size?: string;
  modified: string;
  owner: string;
  owner_id?: string;
  category?: CategoryType;
  shared?: boolean;
  favorited?: boolean;
  thumbnail?: string;
  path?: string;
  file_path?: string;
  dueDate?: string;
  engineer?: string;
  linkedAssets?: string[];
  tags?: string[];
  archived?: boolean;
  starred?: boolean;
  created_at?: string;
  parent_id?: string;
  version?: string;
  file_type?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'draft';
}

export type DocumentType = 'pdf' | 'doc' | 'xlsx' | 'ppt' | 'image' | 'folder' | string;

export interface Version {
  id: string;
  versionNumber?: number;
  date?: string;
  author?: string;
  changes?: string;
  fileSize?: string;
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
onArchiveSelected?: () => void;
  onFavoriteSelected?: () => void;
  onUnfavoriteSelected?: () => void;
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

export interface BackendDocument {
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
  archived?: boolean;
  starred?: boolean;
}

export interface DocumentMeta {
  id: string;
  name: string;
  type: string;
  size?: string;
  modified: string;
  owner: string;
  owner_id: string;
  file_path: string;
  created_at: string;
  file_type: string;
  category?: string;
  shared?: boolean;
  favorited?: boolean;
  thumbnail?: string;
  archived?: boolean;
  starred?: boolean;
}
