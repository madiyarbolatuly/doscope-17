
import { UserRole } from './user';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  permissions?: string[];
  departments?: string[];
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}
