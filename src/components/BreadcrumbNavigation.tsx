import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Home, Folder } from 'lucide-react';

interface BreadcrumbItem {
  id?: string;
  name: string;
  path: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

export function BreadcrumbNavigation({ items, onNavigate }: BreadcrumbNavigationProps) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={item.id || index}>
            <BreadcrumbItem>
              {item.isActive ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  {index === 0 ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink 
                  onClick={() => onNavigate(item)}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  {index === 0 ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  {item.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}