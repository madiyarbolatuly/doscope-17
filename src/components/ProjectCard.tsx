
import React from 'react';
import { Card, CardContent } from './ui/card';
import { FolderOpen, Users, Calendar } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  folderCount: number;
  lastAccessed: string;
  members?: number;
}

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onClick(project.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              <span>{project.folderCount} папок</span>
            </div>
            {project.members && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{project.members}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(project.lastAccessed).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
