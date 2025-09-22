import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_ROOT } from "@/config/api";

export interface Project {
  id: string;
  name: string;
  userEmail?: string;
}

export interface ProjectSwitcherProps {
  className?: string;
  /** Имена корневых проектов (parent_id = null). */
  projects: Project[];
  /** Выбранный проект. */
  selectedProjectId?: string | null;
  /** Смена проекта. Родитель после этого грузит только детей выбранного. */
  onProjectChange: (id: string, name: string) => void;
  /** Добавление нового проекта (корневая папка). */
  onProjectCreate?: (newProject: Project) => void;
}

export function ProjectSwitcher({
  className,
  projects,
  selectedProjectId,
  onProjectChange,
  onProjectCreate,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filtered = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.userEmail ?? "").toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  // Создание нового корневого проекта (parent_id = null)
  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.post(
        `${API_ROOT}/api/v2/folders/`,
        { name: trimmed, parent_id: null },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const folder = res.data;
      const created: Project = { id: String(folder.id), name: folder.name };
      onProjectCreate?.(created);
      onProjectChange(created.id, created.name); // сразу переходим в проект
    } catch (e) {
      console.error("Ошибка создания проекта:", e);
    } finally {
      setShowCreate(false);
      setNewName("");
      setOpen(false);
    }
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between bg-background"
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium truncate max-w-[200px]">
                {selectedProject?.name ?? "Выберите проект"}
              </span>
              {!!selectedProject?.userEmail && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {selectedProject.userEmail}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Найти проекты…"
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 bg-transparent focus:ring-0"
              />
            </div>
            <CommandList>
              <CommandEmpty>Ничего не найдено.</CommandEmpty>
              <CommandGroup>
                {filtered.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.userEmail ?? ""}`}
                    onSelect={() => {
                      onProjectChange(project.id, project.name);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">
                        {project.name}
                      </span>
                      {!!project.userEmail && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {project.userEmail}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedProject?.id === project.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}

                <div className="border-t my-2" />

                {!showCreate ? (
                  <CommandItem
                    onSelect={() => setShowCreate(true)}
                    className="text-blue-600 cursor-pointer"
                  >
                    + Создать проект
                  </CommandItem>
                ) : (
                  <div className="p-2 space-y-2">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Название проекта"
                      className="w-full border rounded px-2 py-1"
                    />
                    <Button
                      onClick={handleCreate}
                      disabled={!newName.trim()}
                      className="w-full"
                    >
                      Создать
                    </Button>
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
