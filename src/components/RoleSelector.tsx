
import React from "react";

interface RoleSelectorProps {
  roles: any[];
  selectedRole: string;
  onRoleChange: (roleId: string) => void;
  isLoading?: boolean;
}

export function RoleSelector({ roles, selectedRole, onRoleChange, isLoading = false }: RoleSelectorProps) {
  // Return an empty fragment to essentially disable this component
  return <></>;
}
