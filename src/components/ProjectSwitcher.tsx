// src/components/ProjectSwitcher.tsx
import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
  userEmail?: string;
}

interface ProjectSwitcherProps {
  className?: string;
  /** Full list of projects (top-level folders) */
  projects: Project[];
  /** Currently selected project (folder) id */
  selectedProjectId?: string | null;
  /** Called when user picks a project */
  onProjectChange: (id: string, name: string) => void;
}

export function ProjectSwitcher({
  className,
  projects,
  selectedProjectId,
  onProjectChange,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId]
  );

  const filtered = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.userEmail ?? "").toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[280px] justify-between bg-background">
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
                {filtered.map(project => (
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
                      <span className="font-medium truncate max-w-[200px]">{project.name}</span>
                      {!!project.userEmail && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {project.userEmail}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn("ml-2 h-4 w-4",
                        selectedProject?.id === project.id ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
