import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  Upload,
  Search,
  List,
  LayoutGrid,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

// Types

type FolderNode = {
  id: string;
  name: string;
  children?: FolderNode[];
};

type FileItem = {
  id: string;
  name: string;
  version: string;
  size: string;
  updated: string;
  owner: string;
  description?: string;
};

interface Props {
  folders?: FolderNode[];
  items?: FileItem[];
}

export const FileManager: React.FC<Props> = ({
  folders = demoFolders,
  items = demoFiles,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background border rounded-md overflow-hidden">
      {/* ---------- Folder tree ---------- */}
      <aside className="w-56 border-r bg-muted/40">
        <div className="flex items-center justify-between px-3 py-2 text-sm font-medium">
          Folders
          <Button variant="ghost" size="icon">
            <FolderPlus className="w-4 h-4" />
          </Button>
        </div>
        <Separator />
        <div className="overflow-y-auto h-full px-2 py-1 space-y-1">
          {folders.map((node) => (
            <FolderRow
              key={node.id}
              node={node}
              onSelect={setSelectedFolder}
              level={0}
              activeId={selectedFolder?.id}
            />
          ))}
        </div>
      </aside>

      {/* ---------- Main area ---------- */}
      <main className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          {/* Upload split button */}
          <div className="flex">
            <Button size="sm" className="rounded-r-none">
              <Upload className="w-4 h-4 mr-2" />
              Upload files
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="rounded-l-none">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Upload folder…</DropdownMenuItem>
                <DropdownMenuItem>From URL…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-60">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search and filter"
              className="pl-8 h-8"
            />
          </div>

          {/* View toggles */}
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* File table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[6%]">Version</TableHead>
                <TableHead className="w-[5%] text-center">M.</TableHead>
                <TableHead className="w-[8%] text-right">Size</TableHead>
                <TableHead className="w-[12%]">Last updated</TableHead>
                <TableHead className="w-[10%]">Updated by</TableHead>
                <TableHead className="w-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items
                .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
                .map((file) => (
                  <TableRow key={file.id} className="hover:bg-muted/50">
                    <TableCell className="flex items-center gap-2">
                      <input type="checkbox" className="mr-2" />
                      <span>{file.name}</span>
                    </TableCell>
                    <TableCell>{file.description ?? '--'}</TableCell>
                    <TableCell>{file.version}</TableCell>
                    <TableCell className="text-center">--</TableCell>
                    <TableCell className="text-right">{file.size}</TableCell>
                    <TableCell>{file.updated}</TableCell>
                    <TableCell>{file.owner}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

// Helper: recursive folder row
const FolderRow: React.FC<{
  node: FolderNode;
  level: number;
  onSelect: (f: FolderNode) => void;
  activeId?: string;
}> = ({ node, level, onSelect, activeId }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children?.length;
  return (
    <>
      <div
        className={`flex items-center cursor-pointer px-2 py-1 rounded 
          ${activeId === node.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
        style={{ paddingLeft: 8 + level * 12 }}
        onClick={() => {
          if (hasChildren) setOpen(!open);
          onSelect(node);
        }}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1 text-muted-foreground" />
          )
        ) : (
          <span className="w-4 h-4 mr-1" />
        )}
        <Folder className="w-4 h-4 mr-2 text-yellow-600" />
        <span className="truncate text-sm">{node.name}</span>
      </div>
      {open &&
        node.children?.map((child) => (
          <FolderRow
            key={child.id}
            node={child}
            level={level + 1}
            onSelect={onSelect}
            activeId={activeId}
          />
        ))}
    </>
  );
};

// Demo placeholder data
const demoFolders: FolderNode[] = [
  {
    id: 'pf',
    name: 'Project Files',
    children: [
      { id: 'pf1', name: 'Project Files.1' },
      { id: 'rt', name: 'rtrv' },
    ],
  },
];

const demoFiles: FileItem[] = [
  {
    id: '1',
    name: 'check (1).pdf',
    version: 'V1',
    size: '28.5 KB',
    updated: 'May 14, 2025 5:46',
    owner: 'Madiyar S.',
  },
  {
    id: '2',
    name: 'check.pdf',
    version: 'V1',
    size: '28.5 KB',
    updated: 'May 14, 2025 12:39',
    owner: 'Madiyar S.',
  },
  {
    id: '3',
    name: 'Final Project Excel R4T1.xlsx',
    version: 'V3',
    size: '27.2 KB',
    updated: 'May 14, 2025 5:44',
    owner: 'Madiyar S.',
  },
];