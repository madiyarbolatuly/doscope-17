
export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  permissions: Permission[];
  departments: string[];
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer' | 'custom';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory = 
  | 'documents' 
  | 'users' 
  | 'system' 
  | 'approvals' 
  | 'notifications'
  | 'settings';

export interface RolePermissions {
  role: UserRole;
  permissions: string[];
  pageAccess: string[];
}

export const DEFAULT_PERMISSIONS: Permission[] = [
  // Document permissions
  { id: 'doc:view', name: 'View Documents', description: 'Can view documents', category: 'documents' },
  { id: 'doc:create', name: 'Create Documents', description: 'Can upload and create documents', category: 'documents' },
  { id: 'doc:edit', name: 'Edit Documents', description: 'Can edit document metadata', category: 'documents' },
  { id: 'doc:delete', name: 'Delete Documents', description: 'Can delete documents', category: 'documents' },
  { id: 'doc:share', name: 'Share Documents', description: 'Can share documents with others', category: 'documents' },
  { id: 'doc:approve', name: 'Approve Documents', description: 'Can approve document workflows', category: 'documents' },
  
  // User permissions
  { id: 'user:view', name: 'View Users', description: 'Can view user list', category: 'users' },
  { id: 'user:create', name: 'Create Users', description: 'Can create new users', category: 'users' },
  { id: 'user:edit', name: 'Edit Users', description: 'Can edit user information', category: 'users' },
  { id: 'user:delete', name: 'Delete Users', description: 'Can delete users', category: 'users' },
  { id: 'user:manage_roles', name: 'Manage Roles', description: 'Can assign roles to users', category: 'users' },
  
  // System permissions
  { id: 'sys:settings', name: 'System Settings', description: 'Can access system settings', category: 'system' },
  { id: 'sys:notifications', name: 'System Notifications', description: 'Can manage system notifications', category: 'system' },
  { id: 'sys:audit', name: 'Audit Logs', description: 'Can view audit logs', category: 'system' },
];

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    permissions: DEFAULT_PERMISSIONS.map(p => p.id),
    pageAccess: ['/', '/archived', '/notifications', '/fileupload', '/usersmanagement', '/approvals', '/settings', '/trash', '/dashboard', '/favorites']
  },
  {
    role: 'manager',
    permissions: [
      'doc:view', 'doc:create', 'doc:edit', 'doc:share', 'doc:approve',
      'user:view', 'user:edit',
      'sys:notifications'
    ],
    pageAccess: ['/', '/archived', '/notifications', '/fileupload', '/approvals', '/dashboard', '/favorites']
  },
  {
    role: 'user',
    permissions: [
      'doc:view', 'doc:create', 'doc:edit', 'doc:share',
      'user:view'
    ],
    pageAccess: ['/', '/archived', '/notifications', '/fileupload', '/favorites']
  },
  {
    role: 'viewer',
    permissions: ['doc:view'],
    pageAccess: ['/', '/favorites']
  },
  {
    role: 'custom',
    permissions: [],
    pageAccess: []
  }
];
