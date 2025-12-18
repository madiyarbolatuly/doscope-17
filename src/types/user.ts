
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  departments: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  tenantId?: number;
  departmentId?: number;
}

export interface RolePermissions {
  role: UserRole;
  permissions: string[];
  pageAccess: string[];
}

// Default permissions for each role - admin has access to everything
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    permissions: ['*'],
    pageAccess: ['*']
  },
  {
    role: 'editor',
    permissions: ['documents.read', 'documents.write', 'documents.approve', 'users.read'],
    pageAccess: ['/', '/documents', '/shared', '/approvals', '/dashboard', '/favorites']
  },
  {
    role: 'viewer',
    permissions: ['documents.read'],
    pageAccess: ['/shared']              // ← только страница «Поделённые документы»
  },
 
];


export const DEFAULT_PERMISSIONS: Permission[] = [
  {
    id: 'documents.read',
    name: 'Read Documents',
    description: 'View and download documents',
    category: 'Documents'
  },
  {
    id: 'documents.write',
    name: 'Write Documents',
    description: 'Upload and edit documents',
    category: 'Documents'
  },
  {
    id: 'documents.delete',
    name: 'Delete Documents',
    description: 'Delete documents',
    category: 'Documents'
  },
  {
    id: 'documents.approve',
    name: 'Approve Documents',
    description: 'Approve or reject documents',
    category: 'Documents'
  },
  {
    id: 'users.read',
    name: 'Read Users',
    description: 'View user information',
    category: 'Users'
  },
  {
    id: 'users.write',
    name: 'Write Users',
    description: 'Create and edit users',
    category: 'Users'
  }
];
