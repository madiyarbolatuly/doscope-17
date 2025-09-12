import React from 'react';
import { SearchBar } from '@/components/SearchBar';
import { DocumentTable } from '@/components/DocumentTable';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Archive, Grid2X2, List, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/document';
import { EmptyState, usePagedMetaFetcher, useSelection } from './_docPageShared';
import { unarchiveDocument, deleteDocument } from '@/services/archiveService';

const ArchivedPage: React.FC = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');

  const pager = usePagedMetaFetcher({ is_archived: 'true' }, {
    rowFilter: (r) => (r.is_archived === true) || (r.status === 'archived')
  });

  const { selectedIds, toggle, selectAll, clear } = useSelection();

  const filtered = pager.documents; // можно ещё добавить локальную фильтрацию по названию

  const handleRestore = async (doc: Document) => {
    const token = (typeof window !== 'undefined') ? localStorage.getItem('authToken') || '' : '';
    try {
      await unarchiveDocument(doc.id, token);
      toast({ title: 'Готово', description: `«${doc.name}» восстановлен из архива` });
      pager.refresh();
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось восстановить', variant: 'destructive' });
    }
  };
  

  const handlePermanentDelete = async (doc: Document) => {
    const token = (typeof window !== 'undefined') ? localStorage.getItem('authToken') || '' : '';
    try {
      await deleteDocument(doc.id as any, token);
      toast({ title: 'Удалено', description: `«${doc.name}» перемещён в корзину` });
      pager.refresh();
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось удалить', variant: 'destructive' });
    }
  };

  return (
    <div className="container px-4 ml-0 mr-0 w-full md:px-6" style={{ maxWidth: 'none' }} onScroll={pager.onScroll}>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Документы</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Архив</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <SearchBar placeholder="Поиск по названию…" onSearch={(q) => pager.setSearch(q)} />
        <div className="ml-auto">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
            <ToggleGroupItem value="grid" aria-label="Grid"><Grid2X2 className="h-4 w-4"/></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List"><List className="h-4 w-4"/></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {filtered.length === 0 && !pager.isLoading ? (
        <EmptyState title="Архив пуст" subtitle="Здесь пока нет документов или по вашему запросу ничего не найдено." icon={<Archive className="h-8 w-8 text-muted-foreground"/>} />
      ) : (
        <DocumentTable
          documents={filtered}
          selectedDocuments={selectedIds}
          onDocumentSelect={(d) => toggle(d.id)}
          onSelectAll={() => selectAll(filtered)}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
        />
      )}
    </div>
  );
};

export default ArchivedPage;