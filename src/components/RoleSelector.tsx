
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "@/types/document";

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: string;
  onRoleChange: (roleId: string) => void;
  isLoading?: boolean;
}

export function RoleSelector({ roles, selectedRole, onRoleChange, isLoading = false }: RoleSelectorProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-2">Выберите папку (по роли):</h2>
      <Select
        disabled={isLoading || roles.length === 0}
        value={selectedRole}
        onValueChange={onRoleChange}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Выберите роль" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Все документы</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.name}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
