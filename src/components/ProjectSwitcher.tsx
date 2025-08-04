
import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  userEmail: string;
}

// Mock projects data - replace with your actual data source
const mockProjects: Project[] = [
  { id: '1', name: 'Pepsico', userEmail: 'smth@pepsico.com' },
  { id: '2', name: 'ПГУ Туркестан', userEmail: 'snk@samruk.kz' },
  { id: '3', name: 'Жем', userEmail: 'srv@skbs.com' },
  { id: '4', name: 'Караганда AБЗ', userEmail: 'snk@samruk.kz' },
  { id: '5', name: 'Кызылорда Стадион', userEmail: 'snk@samruk.kz' },
];

interface ProjectSwitcherProps {
  className?: string;
}

export function ProjectSwitcher({ className }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return mockProjects;
    
    return mockProjects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setOpen(false);
    setSearchQuery('');
    // Add any additional logic for project switching here
    console.log('Switched to project:', project);
  };

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
                {selectedProject.name}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {selectedProject.userEmail}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Найти проекты..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 bg-transparent focus:ring-0"
              />
            </div>
            <CommandList>
              <CommandEmpty>Ничего не найдено.</CommandEmpty>
              <CommandGroup>
                {filteredProjects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.userEmail}`}
                    onSelect={() => handleSelectProject(project)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">
                        {project.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {project.userEmail}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedProject.id === project.id ? "opacity-100" : "opacity-0"
                      )}
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
