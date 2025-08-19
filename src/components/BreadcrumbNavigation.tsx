import React from 'react';
import { Link } from 'react-router-dom';
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
    <nav className="flex items-center space-x-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate({ name: 'Home', path: '/' })}
        className="flex items-center space-x-1"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Button>
      
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item)}
            className="hover:underline"
          >
            {item.name}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
};