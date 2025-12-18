import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_ROOT } from "@/config/api";

type FolderNode = { id: string; name: string };

export interface ProjectSwitcherProps {
  className?: string;
  /** Выбранный узел (правый столбец, подпапка). */
  selectedProjectId?: string | null;
  /** Коллбек выбора подпапки: (childId, childName, parentId, parentName). */
  onProjectChange: (id: string, name: string, parentId: string, parentName: string) => void;
  /** (опц.) предварительно выбранный родитель (левый столбец). */
  initialYearId?: string | null; // сохраним пропс для обратной совместимости
}

/** Слева — корневые папки (root folders), справа — их подпапки. Без привязки к названиям типа “2025/Projects”. */
export function ProjectSwitcher({
  className,
  selectedProjectId,
  onProjectChange,
  initialYearId = null,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roots, setRoots] = useState<FolderNode[]>([]);
  const [rootsLoading, setRootsLoading] = useState(false);
  const [childrenByRoot, setChildrenByRoot] = useState<Map<string, FolderNode[]>>(new Map());
  const [loadingRootId, setLoadingRootId] = useState<string | null>(null);
  const [activeRootId, setActiveRootId] = useState<string | null>(initialYearId ?? null);
  const activeRootRef = useRef<string | null>(initialYearId ?? null);

  const token = useMemo(() => localStorage.getItem("authToken"), []);

  // Формируем заголовки без undefined
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { Accept: "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // ---- API ----
  async function fetchRoots() {
    setRootsLoading(true);
    const ctrl = new AbortController();
    try {
      const url = `${API_ROOT}/v2/metadata?only_folders=true&recursive=false&limit=500`;
      const res = await axios.get(url, { headers: authHeaders, signal: ctrl.signal as any });
      const docs = (res.data?.documents ?? []) as any[];
      const mapped: FolderNode[] = docs.map((d) => ({ id: String(d.id), name: d.name }));
      // Алфавит (естественная сортировка), без предположений про “годы”
      mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setRoots(mapped);

      // Если ничего не выбрано — можно (опционально) выбрать первый корень
      if (!activeRootRef.current && mapped.length > 0) {
        activeRootRef.current = mapped[0].id;
        setActiveRootId(mapped[0].id);
        void fetchChildren(mapped[0].id);
      }
    } catch (e) {
      console.error("fetchRoots failed:", e);
    } finally {
      setRootsLoading(false);
    }
    return () => ctrl.abort();
  }

  async function fetchChildren(parentId: string) {
    if (childrenByRoot.has(parentId)) return; // кэш
    setLoadingRootId(parentId);
    const ctrl = new AbortController();
    try {
      const url = `${API_ROOT}/v2/metadata?only_folders=true&recursive=false&limit=500&parent_id=${encodeURIComponent(
        parentId
      )}`;
      const res = await axios.get(url, { headers: authHeaders, signal: ctrl.signal as any });
      const docs = (res.data?.documents ?? []) as any[];
      const mapped: FolderNode[] = docs.map((d) => ({ id: String(d.id), name: d.name }));
      mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setChildrenByRoot((prev) => new Map(prev).set(parentId, mapped));
    } catch (e) {
      console.error("fetchChildren failed:", e);
    } finally {
      setLoadingRootId(null);
    }
    return () => ctrl.abort();
  }

  useEffect(() => {
    if (open && roots.length === 0 && !rootsLoading) void fetchRoots();
  }, [open, roots.length, rootsLoading]);

  const filteredRoots = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roots;
    return roots.filter((r) => r.name.toLowerCase().includes(q));
  }, [roots, search]);

  const activeRoot = useMemo(
    () => roots.find((r) => r.id === activeRootId) || null,
    [roots, activeRootId]
  );

  const childrenOfActiveRoot = useMemo(() => {
    const list = (activeRootId && childrenByRoot.get(activeRootId)) || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [childrenByRoot, activeRootId, search]);

  const buttonLabel = useMemo(() => {
    const parentName = activeRoot?.name ?? "Папка";
    if (!selectedProjectId) return `${parentName} / Подпапка`;
    const child =
      (activeRootId && childrenByRoot.get(activeRootId)?.find((p) => p.id === selectedProjectId)) ||
      null;
    return child ? `${parentName} / ${child.name}` : `${parentName} / Подпапка`;
  }, [activeRoot, selectedProjectId, activeRootId, childrenByRoot]);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[360px] justify-between bg-background"
          >
            <span className="truncate">{buttonLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[560px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Поиск по папкам…"
                value={search}
                onValueChange={setSearch}
                className="border-0 bg-transparent focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-0">
              {/* Левая колонка — КОРНЕВЫЕ ПАПКИ */}
              <CommandList className="max-h-72">
                {rootsLoading ? (
                  <div className="p-3 text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка папок…
                  </div>
                ) : (
                  <>
                    {filteredRoots.length === 0 && <CommandEmpty>Нет папок.</CommandEmpty>}
                    <CommandGroup heading="Корневые папки">
                      {filteredRoots.map((r) => (
                        <CommandItem
                          key={r.id}
                          value={r.name}
                          onSelect={() => {
                            setActiveRootId(r.id);
                            activeRootRef.current = r.id;
                            void fetchChildren(r.id);
                          }}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{r.name}</span>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              activeRootId === r.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>

              {/* Правая колонка — ПОДПАПКИ выбранного корня */}
              <CommandList className="max-h-72 border-l">
                {!activeRootId ? (
                  <div className="p-3 text-sm text-muted-foreground">Выберите папку слева</div>
                ) : loadingRootId === activeRootId ? (
                  <div className="p-3 text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка подпапок…
                  </div>
                ) : (
                  <>
                    {childrenOfActiveRoot.length === 0 && (
                      <CommandEmpty>Подпапок нет.</CommandEmpty>
                    )}
                    <CommandGroup heading={activeRoot?.name ?? "Подпапки"}>
                      {childrenOfActiveRoot.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            if (!activeRoot) return;
                            onProjectChange(p.id, p.name, activeRoot.id, activeRoot.name);
                            setOpen(false);
                            setSearch("");
                          }}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{p.name}</span>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              selectedProjectId === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
