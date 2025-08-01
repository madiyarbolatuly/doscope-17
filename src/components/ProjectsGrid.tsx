
import React, { useState, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import { Button } from './ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description?: string;
  folderCount: number;
  lastAccessed: string;
  members?: number;
}

interface ProjectsGridProps {
  onProjectSelect: (projectId: string) => void;
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const { toast } = useToast();

  // Mock projects data - in real app this would come from API
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Autodesk Construction Cloud',
        description: 'Основной проект для управления строительными документами',
        folderCount: 15,
        lastAccessed: '2024-01-15',
        members: 8
      },
      {
        id: '2',
        name: 'Проект Строительства ЖК "Современный"',
        description: 'Жилой комплекс из 3 корпусов, документооборот и планирование',
        folderCount: 23,
        lastAccessed: '2024-01-14',
        members: 12
      },
      {
        id: '3',
        name: 'Реконструкция Офисного Центра',
        description: 'Модернизация существующего здания',
        folderCount: 8,
        lastAccessed: '2024-01-13',
        members: 5
      },
      {
        id: '4',
        name: 'Инфраструктурный Проект',
        description: 'Строительство дорожной развязки',
        folderCount: 18,
        lastAccessed: '2024-01-12',
        members: 15
      }
    ];
    setProjects(mockProjects);
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
      folderCount: 0,
      lastAccessed: new Date().toISOString().split('T')[0],
      members: 1
    };

    setProjects(prev => [newProject, ...prev]);
    setNewProjectName('');
    setNewProjectDescription('');
    setShowCreateDialog(false);
    
    toast({
      title: "Проект создан",
      description: `Проект "${newProject.name}" успешно создан`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Проекты</h1>
          <p className="text-muted-foreground">
            Выберите проект для работы с документами
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать проект
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск проектов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'Проекты не найдены' : 'Нет проектов'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={onProjectSelect}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
            <DialogDescription>
              Введите информацию о новом проекте
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="projectName">
                Название проекта *
              </Label>
              <Input
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Введите название проекта"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="projectDescription">
                Описание
              </Label>
              <Textarea
                id="projectDescription"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Краткое описание проекта (необязательно)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Создать проект
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
