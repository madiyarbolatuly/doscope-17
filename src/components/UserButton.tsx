
import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const UserButton: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer">
          <Avatar>
            <AvatarImage src={undefined} alt={user?.username ?? "User"} />
            <AvatarFallback>
              {user
                ? user.username[0].toUpperCase()
                : <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-50">
        {user ? (
          <>
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium truncate flex items-center gap-2">
                  <User className="h-4 w-4 mr-1 text-muted-foreground inline-block" />
                  {user.username}
                </span>
                <span className="text-xs text-muted-foreground truncate">ID: {user.id}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium truncate flex items-center gap-2">
                <User className="h-4 w-4 mr-1 text-muted-foreground inline-block" />
                Не вошли в систему
              </span>
              <span className="text-xs text-muted-foreground truncate">Нет пользователя</span>
            </div>
          </DropdownMenuLabel>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
