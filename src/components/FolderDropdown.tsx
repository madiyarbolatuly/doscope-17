import * as React from "react";
import { ChevronDown, ChevronRight, Folder as FolderIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FolderNode = {
  id: string;
  name: string;
  type: "folder" | string;
  children?: FolderNode[];
};

type Props = {
  tree: FolderNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  showRootItem?: boolean; // if true, shows "All (root)" at top
};

export default function FolderDropdown({
  tree,
  selectedId,
  onSelect,
  placeholder = "Выберите папку…",
  showRootItem = true,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  // ensure only folders (safety)
  const foldersOnly = React.useMemo(() => {
    const prune = (nodes: FolderNode[] = []) =>
      nodes
        .filter((n) => n.type === "folder")
        .map((n) => ({ ...n, children: prune(n.children || []) }));
    return prune(tree || []);
  }, [tree]);

  // flatten for label lookup
  const flat = React.useMemo(() => {
    const out: { id: string; name: string }[] = [];
    const walk = (nodes: FolderNode[]) => {
      for (const n of nodes) {
        out.push({ id: n.id, name: n.name });
        if (n.children?.length) walk(n.children);
      }
    };
    walk(foldersOnly);
    return out;
  }, [foldersOnly]);

  const currentLabel =
    selectedId && flat.find((f) => f.id === selectedId)?.name;

  const toggleExpand = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const match = (name: string) =>
    !query || name.toLowerCase().includes(query.toLowerCase());

  const Row: React.FC<{ node: FolderNode; depth: number }> = ({ node, depth }) => {
    const hasChildren = Boolean(node.children?.length);
    const isOpen = !!expanded[node.id];

    // filter logic: show node if it matches query OR any descendant matches
    const descendantMatches = React.useMemo(() => {
      const anyChildMatches = (nodes: FolderNode[] = []): boolean =>
        nodes.some((c) => match(c.name) || anyChildMatches(c.children));
      return anyChildMatches(node.children);
    }, [node, query]);

    const visible = match(node.name) || descendantMatches;

    if (!visible) return null;

    return (
      <>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer",
            "text-sm"
          )}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => {
            if (hasChildren && !match(node.name) && !isOpen) {
              // when query forces visibility through descendants, auto-expand on click
              toggleExpand(node.id);
              return;
            }
            onSelect(node.id);
            setOpen(false);
          }}
        >
          {/* disclosure */}
          {hasChildren ? (
            <button
              className="p-0.5 -ml-1 rounded hover:bg-accent/60"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <FolderIcon className="h-4 w-4 text-yellow-500" />
          <span className="truncate">{node.name}</span>

          {selectedId === node.id && <Check className="ml-auto h-4 w-4" />}
        </div>

        {hasChildren && isOpen && (
          <div>
            {node.children!.map((c) => (
              <Row key={c.id} node={c} depth={depth + 1} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[320px] justify-between">
          <span className="truncate">
            {currentLabel || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-2" side="bottom" align="start">
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск папки…"
          />

          {showRootItem && (
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm"
              )}
              onClick={() => {
                onSelect(null); // go to root
                setOpen(false);
              }}
            >
              <FolderIcon className="h-4 w-4 text-yellow-500" />
              <span>Все (корень)</span>
              {selectedId === null && <Check className="ml-auto h-4 w-4" />}
            </div>
          )}

          <div className="max-h-80 overflow-auto pr-1">
            {foldersOnly.length === 0 ? (
              <div className="text-sm text-muted-foreground px-2 py-3">
                Нет папок
              </div>
            ) : (
              foldersOnly.map((n) => <Row key={n.id} node={n} depth={0} />)
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
