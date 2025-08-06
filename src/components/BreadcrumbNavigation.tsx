import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onItemClick: (itemId: string) => void;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  onItemClick,
}) => {
  return (
    <nav className="flex items-center space-x-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onItemClick('root')}
        className="flex items-center space-x-1"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Button>
      
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onItemClick(item.id)}
            className="hover:underline"
          >
            {item.name}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
};