import { Document, CategoryType } from '@/types/document';

// Mock folder structure
export interface FolderStructure {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId?: string;
  path: string;
  children?: FolderStructure[];
  document?: Document;
}

// Mock users
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  createdAt: string;
  lastActive: string;
}

// Enhanced Document interface for mock API
export interface MockDocument extends Document {
  parentFolderId?: string;
  path: string;
  permissions: string[];
  sharedWith: string[];
  versions: {
    id: string;
    version: string;
    date: string;
    author: string;
    comment: string;
    size: string;
  }[];
  shareExpiration?: string;
  downloadCount: number;
  viewCount: number;
}

// Mock data
const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'alex@company.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-01-15T10:00:00Z',
    lastActive: '2024-12-10T15:30:00Z'
  },
  {
    id: 'u2',
    name: 'Sarah Miller',
    email: 'sarah@company.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-02-01T09:15:00Z',
    lastActive: '2024-12-09T14:20:00Z'
  },
  {
    id: 'u3',
    name: 'David Chen',
    email: 'david@company.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-01-20T11:30:00Z',
    lastActive: '2024-12-08T16:45:00Z'
  },
  {
    id: 'u4',
    name: 'Emily Wang',
    email: 'emily@company.com',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-03-05T08:45:00Z',
    lastActive: '2024-12-07T12:10:00Z'
  }
];

const mockDocuments: MockDocument[] = [
  {
    id: '1',
    name: 'Annual Report 2023.pdf',
    type: 'pdf',
    size: '4.2 MB',
    modified: new Date(Date.now() - 3600000).toISOString(),
    owner: 'Alex Johnson',
    owner_id: 'u1',
    category: 'reports',
    favorited: true,
    path: '/documents/reports/Annual Report 2023.pdf',
    parentFolderId: 'f1',
    permissions: ['read', 'write', 'share'],
    sharedWith: ['u2', 'u3'],
    downloadCount: 15,
    viewCount: 32,
    versions: [
      { id: 'v1', version: '1.0', date: '2024-11-01T10:00:00Z', author: 'Alex Johnson', comment: 'Initial version', size: '4.2 MB' },
      { id: 'v2', version: '1.1', date: '2024-11-15T14:30:00Z', author: 'Alex Johnson', comment: 'Updated financial data', size: '4.2 MB' }
    ]
  },
  {
    id: '2',
    name: 'Project Proposal.doc',
    type: 'doc',
    size: '2.7 MB',
    modified: new Date(Date.now() - 86400000).toISOString(),
    owner: 'Sarah Miller',
    owner_id: 'u2',
    category: 'projects',
    path: '/documents/projects/Project Proposal.doc',
    parentFolderId: 'f2',
    permissions: ['read', 'write'],
    sharedWith: [],
    downloadCount: 8,
    viewCount: 24,
    versions: [
      { id: 'v3', version: '1.0', date: '2024-12-01T09:00:00Z', author: 'Sarah Miller', comment: 'Draft version', size: '2.7 MB' }
    ]
  },
  {
    id: '3',
    name: 'Financial Analysis.xlsx',
    type: 'xlsx',
    size: '1.8 MB',
    modified: new Date(Date.now() - 172800000).toISOString(),
    owner: 'David Chen',
    owner_id: 'u3',
    category: 'finance',
    path: '/documents/finance/Financial Analysis.xlsx',
    parentFolderId: 'f3',
    permissions: ['read'],
    sharedWith: ['u1'],
    downloadCount: 22,
    viewCount: 45,
    versions: [
      { id: 'v4', version: '2.1', date: '2024-11-20T11:45:00Z', author: 'David Chen', comment: 'Q4 updates', size: '1.8 MB' }
    ]
  },
  {
    id: '4',
    name: 'Marketing Presentation.ppt',
    type: 'ppt',
    size: '5.3 MB',
    modified: new Date(Date.now() - 259200000).toISOString(),
    owner: 'Emily Wang',
    owner_id: 'u4',
    category: 'marketing',
    shared: true,
    path: '/documents/marketing/Marketing Presentation.ppt',
    parentFolderId: 'f4',
    permissions: ['read', 'share'],
    sharedWith: ['u1', 'u2', 'u3'],
    shareExpiration: '2025-01-15T23:59:59Z',
    downloadCount: 11,
    viewCount: 38,
    versions: [
      { id: 'v5', version: '1.0', date: '2024-12-05T16:20:00Z', author: 'Emily Wang', comment: 'Initial presentation', size: '5.3 MB' }
    ]
  }
];

const mockFolders: FolderStructure[] = [
  {
    id: 'f1',
    name: 'Reports',
    type: 'folder',
    path: '/documents/reports',
    children: []
  },
  {
    id: 'f2',
    name: 'Projects',
    type: 'folder',
    path: '/documents/projects',
    children: []
  },
  {
    id: 'f3',
    name: 'Finance',
    type: 'folder',
    path: '/documents/finance',
    children: []
  },
  {
    id: 'f4',
    name: 'Marketing',
    type: 'folder',
    path: '/documents/marketing',
    children: []
  },
  {
    id: 'f5',
    name: 'Archive',
    type: 'folder',
    path: '/documents/archive',
    children: []
  }
];

// Mock state
let documents = [...mockDocuments];
let folders = [...mockFolders];
let users = [...mockUsers];
let trashedDocuments: MockDocument[] = [];
let archivedDocuments: MockDocument[] = [];

// Helper functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getUserById = (id: string) => users.find(u => u.id === id);

const getDocumentsByFolder = (folderId?: string) => {
  return documents.filter(doc => doc.parentFolderId === folderId);
};

// Mock API functions
export const mockApi = {
  // Documents
  async getDocuments(options: {
    category?: CategoryType;
    search?: string;
    folderId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    await delay(300);
    
    let filteredDocs = documents;
    
    if (options.folderId) {
      filteredDocs = getDocumentsByFolder(options.folderId);
    }
    
    if (options.category && options.category !== 'all') {
      if (options.category === 'recent') {
        filteredDocs = filteredDocs.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()).slice(0, 10);
      } else if (options.category === 'favorites') {
        filteredDocs = filteredDocs.filter(doc => doc.favorited);
      } else if (options.category === 'shared') {
        filteredDocs = filteredDocs.filter(doc => doc.shared || doc.sharedWith.length > 0);
      } else {
        filteredDocs = filteredDocs.filter(doc => doc.category === options.category);
      }
    }
    
    if (options.search) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.name.toLowerCase().includes(options.search!.toLowerCase())
      );
    }
    
    const start = options.offset || 0;
    const limit = options.limit || 50;
    const paginatedDocs = filteredDocs.slice(start, start + limit);
    
    return {
      documents: paginatedDocs,
      total: filteredDocs.length,
      hasMore: start + limit < filteredDocs.length
    };
  },

  async getDocument(id: string) {
    await delay(200);
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  async toggleFavorite(id: string) {
    await delay(200);
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.favorited = !doc.favorited;
    return doc;
  },

  async downloadDocument(id: string) {
    await delay(500);
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.downloadCount++;
    return { downloadUrl: `https://mock-download.com/${doc.name}`, document: doc };
  },

  async previewDocument(id: string) {
    await delay(300);
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.viewCount++;
    return { previewUrl: `https://mock-preview.com/${doc.id}`, document: doc };
  },

  async shareDocument(id: string, userIds: string[], expirationDate?: string) {
    await delay(300);
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.sharedWith = [...new Set([...doc.sharedWith, ...userIds])];
    if (expirationDate) doc.shareExpiration = expirationDate;
    doc.shared = true;
    return doc;
  },

  async moveToTrash(id: string) {
    await delay(200);
    const docIndex = documents.findIndex(d => d.id === id);
    if (docIndex === -1) throw new Error('Document not found');
    const doc = documents.splice(docIndex, 1)[0];
    trashedDocuments.push(doc);
    return doc;
  },

  async restoreFromTrash(id: string) {
    await delay(200);
    const docIndex = trashedDocuments.findIndex(d => d.id === id);
    if (docIndex === -1) throw new Error('Document not found in trash');
    const doc = trashedDocuments.splice(docIndex, 1)[0];
    documents.push(doc);
    return doc;
  },

  async permanentDelete(id: string) {
    await delay(200);
    const docIndex = trashedDocuments.findIndex(d => d.id === id);
    if (docIndex === -1) throw new Error('Document not found in trash');
    trashedDocuments.splice(docIndex, 1);
    return true;
  },

  async archiveDocument(id: string) {
    await delay(200);
    const docIndex = documents.findIndex(d => d.id === id);
    if (docIndex === -1) throw new Error('Document not found');
    const doc = documents.splice(docIndex, 1)[0];
    doc.archived = true;
    archivedDocuments.push(doc);
    return doc;
  },

  async unarchiveDocument(id: string) {
    await delay(200);
    const docIndex = archivedDocuments.findIndex(d => d.id === id);
    if (docIndex === -1) throw new Error('Document not found in archive');
    const doc = archivedDocuments.splice(docIndex, 1)[0];
    doc.archived = false;
    documents.push(doc);
    return doc;
  },

  // Folders
  async getFolders(parentId?: string) {
    await delay(200);
    const filteredFolders = folders.filter(f => f.parentId === parentId);
    return filteredFolders.map(folder => ({
      ...folder,
      documents: getDocumentsByFolder(folder.id),
      subfolders: folders.filter(f => f.parentId === folder.id)
    }));
  },

  async createFolder(name: string, parentId?: string) {
    await delay(300);
    const newFolder: FolderStructure = {
      id: `f${Date.now()}`,
      name,
      type: 'folder',
      parentId,
      path: parentId ? `${folders.find(f => f.id === parentId)?.path}/${name}` : `/documents/${name}`,
      children: []
    };
    folders.push(newFolder);
    return newFolder;
  },

  async deleteFolder(id: string) {
    await delay(200);
    const folderIndex = folders.findIndex(f => f.id === id);
    if (folderIndex === -1) throw new Error('Folder not found');
    
    // Move all documents in folder to trash
    const docsInFolder = documents.filter(d => d.parentFolderId === id);
    docsInFolder.forEach(doc => {
      const docIndex = documents.findIndex(d => d.id === doc.id);
      if (docIndex !== -1) {
        const deletedDoc = documents.splice(docIndex, 1)[0];
        trashedDocuments.push(deletedDoc);
      }
    });
    
    folders.splice(folderIndex, 1);
    return true;
  },

  // File upload
  async uploadFiles(files: File[], folderId?: string) {
    await delay(1000);
    const uploadedDocs: MockDocument[] = [];
    
    files.forEach((file, index) => {
      const newDoc: MockDocument = {
        id: `doc${Date.now()}_${index}`,
        name: file.name,
        type: file.type.split('/')[1] || 'file',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        modified: new Date().toISOString(),
        owner: 'Current User',
        owner_id: 'current',
        category: 'uploads',
        path: `${folderId ? folders.find(f => f.id === folderId)?.path : '/documents'}/${file.name}`,
        parentFolderId: folderId,
        permissions: ['read', 'write', 'share'],
        sharedWith: [],
        downloadCount: 0,
        viewCount: 0,
        versions: [
          {
            id: `v${Date.now()}_${index}`,
            version: '1.0',
            date: new Date().toISOString(),
            author: 'Current User',
            comment: 'Initial upload',
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
          }
        ]
      };
      uploadedDocs.push(newDoc);
      documents.push(newDoc);
    });
    
    return uploadedDocs;
  },

  // Trash
  async getTrash() {
    await delay(200);
    return trashedDocuments;
  },

  async emptyTrash() {
    await delay(300);
    trashedDocuments = [];
    return true;
  },

  // Archive
  async getArchived() {
    await delay(200);
    return archivedDocuments;
  },

  // Users
  async getUsers() {
    await delay(200);
    return users;
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>) {
    await delay(300);
    const newUser: User = {
      ...userData,
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    users.push(newUser);
    return newUser;
  },

  async updateUser(id: string, userData: Partial<User>) {
    await delay(300);
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    users[userIndex] = { ...users[userIndex], ...userData };
    return users[userIndex];
  },

  async deleteUser(id: string) {
    await delay(200);
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    users.splice(userIndex, 1);
    return true;
  },

  // Analytics
  async getAnalytics() {
    await delay(300);
    return {
      totalDocuments: documents.length,
      totalUploads: documents.filter(d => d.category === 'uploads').length,
      totalDownloads: documents.reduce((sum, doc) => sum + doc.downloadCount, 0),
      totalViews: documents.reduce((sum, doc) => sum + doc.viewCount, 0),
      activeUsers: users.filter(u => new Date(u.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
      storageUsed: documents.reduce((sum, doc) => {
        const sizeMatch = doc.size.match(/(\d+\.?\d*)/);
        return sum + (sizeMatch ? parseFloat(sizeMatch[1]) : 0);
      }, 0),
      weeklyActivity: [
        { name: 'Пн', uploads: 4, downloads: 12, views: 28 },
        { name: 'Вт', uploads: 3, downloads: 15, views: 32 },
        { name: 'Ср', uploads: 5, downloads: 18, views: 45 },
        { name: 'Чт', uploads: 2, downloads: 9, views: 22 },
        { name: 'Пт', uploads: 6, downloads: 21, views: 38 },
        { name: 'Сб', uploads: 1, downloads: 5, views: 12 },
        { name: 'Вс', uploads: 0, downloads: 3, views: 8 }
      ]
    };
  }
};