import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BreadcrumbItem } from '@/types/navigation';

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  onNavigate,
}) => {
  return (
    <nav className="flex flex-wrap items-center text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate({ name: 'Домой', path: '/' })}
        className="flex items-center gap-1 px-1 text-sm font-normal hover:underline"
      >
        <Home className="h-4 w-4" />
        <span>Домой</span>
      </Button>
      
      {items.length > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}

      {items.map((item, index) => (
        <React.Fragment key={item.path || item.id || index}>
          {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}
          {item.isActive ? (
            <span
              className="text-sm font-medium truncate max-w-[18rem]"
              title={item.name}
            >
              {item.name}
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(item)}
              className="px-1 text-sm font-normal hover:underline max-w-[18rem]"
            >
              <span className="truncate" title={item.name}>{item.name}</span>
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};