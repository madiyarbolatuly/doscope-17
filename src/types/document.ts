
export type DocumentType = 'pdf' | 'doc' | 'xlsx' | 'ppt' | 'image' | 'folder';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size?: string;
  modified: string;
  owner: string;
  category?: string;
  path?: string;
  thumbnail?: string;
  shared?: boolean;
  favorited?: boolean;
}

export type CategoryType = 
  | 'all' 
  | 'recent' 
  | 'shared' 
  | 'favorites' 
  | 'trash' 
  | 'managers' 
  | 'development' 
  | 'procurement' 
  | 'electrical' 
  | 'weakening' 
  | 'interface' 
  | 'pse'
  | string;

export type ActivityAction = 
  | "viewed" 
  | "modified" 
  | "commented" 
  | "uploaded" 
  | "deleted" 
  | "restored" 
  | "downloaded" 
  | "shared";

export interface MultipleSelectionActions {
  selectedIds: string[];
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onRestoreSelected?: () => void;
  onDownloadSelected?: () => void;
  onMoveSelected?: () => void;
  onShareSelected?: () => void;
}
