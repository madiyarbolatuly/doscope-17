export type DocumentType = 'pdf' | 'doc' | 'docx' | 'xlsx' | 'xls' | 'ppt' | 'pptx' | 'jpg' | 'jpeg' | 'png' | 'txt' | 'folder' | 'image';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: string;
  modified: string;
  owner: string;
  category: string;
  thumbnail?: string;
  favorited?: boolean;
  path?: string;
  dueDate?: string;
  engineer?: string;
  linkedAssets?: string[];
}

// Add the missing Version interface
export interface Version {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  comments: string;
}
