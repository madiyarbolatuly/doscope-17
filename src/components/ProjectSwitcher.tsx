
import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Folder } from 'lucide-react';
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
import { Document } from '@/types/document';

interface ProjectSwitcherProps {
  folders: Document[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  className?: string;
}

export function ProjectSwitcher({ 
  folders, 
  selectedFolderId, 
  onFolderSelect, 
  className 
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allFolders = [
    { id: null, name: 'Root Folder', description: 'All documents' },
    ...folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      description: `Folder • ${folder.owner || 'Unknown owner'}`
    }))
  ];

  const filteredFolders = useMemo(() => {
    if (!searchQuery) return allFolders;
    
    return allFolders.filter(folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allFolders]);

  const selectedFolder = allFolders.find(folder => folder.id === selectedFolderId);

  const handleSelectFolder = (folderId: string | null) => {
    onFolderSelect(folderId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-2 text-left">
              <Folder className="h-4 w-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="font-medium text-gray-800 truncate max-w-[200px]">
                  {selectedFolder?.name || 'Select folder'}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                  {selectedFolder?.description || 'Choose a folder to view'}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0 bg-white border border-gray-200 shadow-lg" align="start">
          <Command className="bg-white">
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Search folders..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 bg-transparent focus:ring-0 placeholder:text-gray-400"
              />
            </div>
            <CommandList className="max-h-64">
              <CommandEmpty className="py-4 text-center text-gray-500">
                No folders found.
              </CommandEmpty>
              <CommandGroup>
                {filteredFolders.map((folder) => (
                  <CommandItem
                    key={folder.id || 'root'}
                    value={`${folder.name} ${folder.description}`}
                    onSelect={() => handleSelectFolder(folder.id)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-600" />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 truncate max-w-[180px]">
                          {folder.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[180px]">
                          {folder.description}
                        </span>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 text-blue-600",
                        selectedFolderId === folder.id ? "opacity-100" : "opacity-0"
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
