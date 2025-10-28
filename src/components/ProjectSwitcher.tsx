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
  /** Выбранный проект (второй уровень). */
  selectedProjectId?: string | null;
  /** Коллбек выбора проекта. */
  onProjectChange: (id: string, name: string, yearId: string, yearName: string) => void;
  /** Опционально стартовый выбранный год. */
  initialYearId?: string | null;
}

/** Показывает 2 узла: слева — ГОДЫ (root folders), справа — ПРОЕКТЫ (дети выбранного года). */
export function ProjectSwitcher({
  className,
  selectedProjectId,
  onProjectChange,
  initialYearId = null,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [years, setYears] = useState<FolderNode[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [projectsByYear, setProjectsByYear] = useState<Map<string, FolderNode[]>>(new Map());
  const [loadingYearId, setLoadingYearId] = useState<string | null>(null);
  const [activeYearId, setActiveYearId] = useState<string | null>(initialYearId);
  const activeYearRef = useRef<string | null>(initialYearId);

  const token = useMemo(() => localStorage.getItem("authToken"), []);

  // ——— Helpers ———
  const authHeaders = useMemo(
    () => ({
      Authorization: token ? `Bearer ${token}` : undefined,
      Accept: "application/json",
    }),
    [token]
  );

  async function fetchYears() {
    setYearsLoading(true);
    try {
      const url = `${API_ROOT}/v2/metadata?only_folders=true&recursive=false&limit=500`;
      const res = await axios.get(url, { headers: authHeaders });
      const docs = (res.data?.documents ?? []) as any[];
      const mapped: FolderNode[] = docs.map((d) => ({ id: String(d.id), name: d.name }));
      // Можно сортировать по убыванию имени, если это годы: 2025, 2024...
      mapped.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
      setYears(mapped);
      if (!activeYearRef.current && mapped.length > 0) {
        activeYearRef.current = mapped[0].id;
        setActiveYearId(mapped[0].id);
        // сразу подгрузим проекты первого года для быстрой первой отрисовки
        void fetchProjects(mapped[0].id);
      }
    } catch (e) {
      console.error("fetchYears failed:", e);
    } finally {
      setYearsLoading(false);
    }
  }

  async function fetchProjects(yearId: string) {
    if (projectsByYear.has(yearId)) return; // уже кэшировано
    setLoadingYearId(yearId);
    try {
      const url = `${API_ROOT}/v2/metadata?only_folders=true&recursive=false&limit=500&parent_id=${encodeURIComponent(
        yearId
      )}`;
      const res = await axios.get(url, { headers: authHeaders });
      const docs = (res.data?.documents ?? []) as any[];
      const mapped: FolderNode[] = docs.map((d) => ({ id: String(d.id), name: d.name }));
      mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setProjectsByYear((prev) => new Map(prev).set(yearId, mapped));
    } catch (e) {
      console.error("fetchProjects failed:", e);
    } finally {
      setLoadingYearId(null);
    }
  }

  // Подгрузить годы только при первом открытии
  useEffect(() => {
    if (open && years.length === 0 && !yearsLoading) void fetchYears();
  }, [open, years.length, yearsLoading]);

  // Фильтрация
  const filteredYears = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return years;
    return years.filter((y) => y.name.toLowerCase().includes(q));
  }, [years, search]);

  const activeYear = useMemo(
    () => years.find((y) => y.id === activeYearId) || null,
    [years, activeYearId]
  );

  const projectsOfActiveYear = useMemo(() => {
    const list = (activeYearId && projectsByYear.get(activeYearId)) || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [projectsByYear, activeYearId, search]);

  // Текст на кнопке (хлебные крошки)
  const buttonLabel = useMemo(() => {
    const yearName = activeYear?.name ?? "Год";
    if (!selectedProjectId) return `${yearName} / Проект`;
    const prj =
      (activeYearId && projectsByYear.get(activeYearId)?.find((p) => p.id === selectedProjectId)) ||
      null;
    return prj ? `${yearName} / ${prj.name}` : `${yearName} / Проект`;
  }, [activeYear, selectedProjectId, activeYearId, projectsByYear]);

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
                placeholder="Поиск по годам и проектам…"
                value={search}
                onValueChange={setSearch}
                className="border-0 bg-transparent focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-0">
              {/* Левая колонка — ГОДЫ */}
              <CommandList className="max-h-72">
                {yearsLoading ? (
                  <div className="p-3 text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка лет…
                  </div>
                ) : (
                  <>
                    {filteredYears.length === 0 && <CommandEmpty>Нет папок-лет.</CommandEmpty>}
                    <CommandGroup heading="Годы">
                      {filteredYears.map((y) => (
                        <CommandItem
                          key={y.id}
                          value={y.name}
                          onSelect={async () => {
                            setActiveYearId(y.id);
                            activeYearRef.current = y.id;
                            // лениво подгружаем проекты выбранного года
                            void fetchProjects(y.id);
                          }}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{y.name}</span>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              activeYearId === y.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>

              {/* Правая колонка — ПРОЕКТЫ выбранного года */}
              <CommandList className="max-h-72 border-l">
                {!activeYearId ? (
                  <div className="p-3 text-sm text-muted-foreground">Выберите год слева</div>
                ) : loadingYearId === activeYearId ? (
                  <div className="p-3 text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка проектов…
                  </div>
                ) : (
                  <>
                    {projectsOfActiveYear.length === 0 && (
                      <CommandEmpty>Проектов нет.</CommandEmpty>
                    )}
                    <CommandGroup heading={activeYear?.name ?? "Проекты"}>
                      {projectsOfActiveYear.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            if (!activeYear) return;
                            onProjectChange(p.id, p.name, activeYear.id, activeYear.name);
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
