import { useState, useCallback } from 'react';
import { BreadcrumbItem } from '@/types/navigation';

export function useBreadcrumbNavigation() {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { name: 'Документы', path: '/', isActive: true }
  ]);

  const updateBreadcrumbs = useCallback((folderId?: string) => {
    if (!folderId) {
      setBreadcrumbs([{ name: 'Документы', path: '/', isActive: true }]);
    } else {
      setBreadcrumbs([
        { name: 'Документы', path: '/', isActive: false },
        { id: folderId, name: 'Текущая папка', path: `/folder/${folderId}`, isActive: true }
      ]);
    }
  }, []);

  const handleBreadcrumbNavigate = useCallback((item: BreadcrumbItem) => {
    const folderId = item.id || undefined;
    updateBreadcrumbs(folderId);
    return folderId;
  }, [updateBreadcrumbs]);

  return {
    breadcrumbs,
    updateBreadcrumbs,
    handleBreadcrumbNavigate
  };
}