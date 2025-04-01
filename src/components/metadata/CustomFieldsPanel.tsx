
import React from 'react';
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Document } from '@/types/document';
import { useToast } from "@/components/ui/use-toast";

// Mock data
const TEAM_MEMBERS = [
  "Алексей Петров",
  "Мария Иванова",
  "Николай Смирнов",
  "Елена Козлова",
  "Дмитрий Соколов",
];

const ASSETS = [
  "Газовая турбина #1",
  "Электрическая подстанция B5",
  "Насосная станция #3",
  "Трансформатор T-12",
  "Система охлаждения C4",
];

interface CustomFieldsPanelProps {
  document?: Document;
  onUpdate?: (field: string, value: any) => void;
}

export function CustomFieldsPanel({ document, onUpdate }: CustomFieldsPanelProps) {
  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    document?.dueDate ? new Date(document.dueDate) : undefined
  );
  const [engineer, setEngineer] = React.useState<string>(document?.engineer || "");
  const [assets, setAssets] = React.useState<string[]>(document?.linkedAssets || []);
  const [open, setOpen] = React.useState(false);
  const [openAssets, setOpenAssets] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(""); // For filtering assets
  const { toast } = useToast();

  const handleDateChange = (date: Date | undefined) => {
    setDueDate(date);
    if (onUpdate && date) {
      onUpdate("dueDate", date.toISOString());
    }
  };

  const handleEngineerChange = (value: string) => {
    setEngineer(value);
    if (onUpdate) {
      onUpdate("engineer", value);
    }
  };

  const toggleAsset = (asset: string) => {
    const newAssets = assets.includes(asset)
      ? assets.filter(a => a !== asset)
      : [...assets, asset];
      
    setAssets(newAssets);
    if (onUpdate) {
      onUpdate("linkedAssets", newAssets);
    }
  };

  const removeAsset = (asset: string) => {
    const newAssets = assets.filter(a => a !== asset);
    setAssets(newAssets);
    if (onUpdate) {
      onUpdate("linkedAssets", newAssets);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Метаданные обновлены",
      description: `Уведомления отправлены ответственному инженеру: ${engineer || "не выбрано"}`,
    });
  };

  // Filter assets based on search input
  const filteredAssets = searchValue 
    ? ASSETS.filter(asset => 
        asset.toLowerCase().includes(searchValue.toLowerCase())
      )
    : ASSETS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Расширенные метаданные</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Ответственный инженер</label>
          <Select value={engineer} onValueChange={handleEngineerChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите инженера" />
            </SelectTrigger>
            <SelectContent>
              {TEAM_MEMBERS.map(member => (
                <SelectItem key={member} value={member}>{member}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Срок выполнения</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "dd.MM.yyyy") : "Выберите дату"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={handleDateChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Связанные объекты</label>
          <Popover open={openAssets} onOpenChange={setOpenAssets}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                Выбрать объекты
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput 
                  placeholder="Поиск объектов..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandEmpty>Объекты не найдены.</CommandEmpty>
                <CommandGroup>
                  {filteredAssets.map((asset) => (
                    <CommandItem
                      key={asset}
                      value={asset}
                      onSelect={() => toggleAsset(asset)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          assets.includes(asset) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {asset}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {assets.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {assets.map(asset => (
                <Badge key={asset} variant="outline" className="bg-blue-50 text-blue-700">
                  {asset}
                  <button 
                    className="ml-1 hover:text-red-500"
                    onClick={() => removeAsset(asset)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="ml-auto">
          Подтвердить
        </Button>
      </CardFooter>
    </Card>
  );
}
