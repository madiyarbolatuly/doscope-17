import React, {useMemo, useCallback} from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Document } from '@/types/document'
import { FileText, File, FileSpreadsheet, FileImage, Folder, Star, Eye, MoreHorizontal, Download, Share2, Archive } from 'lucide-react'

/**
 * UX & Accessibility improvements
 * - Stronger visual hierarchy with Card + consistent paddings
 * - Larger click/hover targets; clear selected state; keyboard support (Enter/Space)
 * - Tooltips on icon-only controls
 * - Empty state and loading skeletons
 * - File-type color system + badges
 * - Optional list mode with dense rows
 * - ARIA labels + roles
 */

export interface DocumentGridProps {
  documents: Document[]
  onDocumentClick: (document: Document) => void
  onDocumentPreview: (document: Document) => Promise<void>
  viewMode: 'grid' | 'list'
  selectedDocument: Document | null
  onDocumentSelect: (document: Document) => void
  multipleSelection: boolean
  onOpen?: (item: Document) => void
  selectionActions: {
    selectedIds: string[]
    onSelectAll: () => void
    onClearSelection: () => void
    onDeleteSelected: () => Promise<void>
    onDownloadSelected: () => void
    onShareSelected: () => void
    onArchiveSelected: () => Promise<void>
  }
  toggleFavorite?: (doc: Document) => Promise<void> | void
  /** Optional visuals */
  isLoading?: boolean
  showMeta?: boolean // show size/date below title
}

const typeToIcon: Record<string, React.ReactNode> = {
  folder: <Folder className="h-5 w-5 text-blue-500" aria-hidden />,
  pdf: <FileText className="h-5 w-5 text-red-500" aria-hidden />,
  doc: <FileText className="h-5 w-5 text-blue-500" aria-hidden />,
  docx: <FileText className="h-5 w-5 text-blue-500" aria-hidden />,
  xls: <FileSpreadsheet className="h-5 w-5 text-green-500" aria-hidden />,
  xlsx: <FileSpreadsheet className="h-5 w-5 text-green-500" aria-hidden />,
  jpg: <FileImage className="h-5 w-5 text-purple-500" aria-hidden />,
  jpeg: <FileImage className="h-5 w-5 text-purple-500" aria-hidden />,
  png: <FileImage className="h-5 w-5 text-purple-500" aria-hidden />,
  gif: <FileImage className="h-5 w-5 text-purple-500" aria-hidden />,
}

function getIcon(type?: string) {
  const key = (type || '').toLowerCase()
  return typeToIcon[key] ?? <File className="h-5 w-5 text-muted-foreground" aria-hidden />
}

function formatBytes(bytes?: number | string) {
  if (bytes === undefined || bytes === null || bytes === '') return ''
  const n = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (Number.isNaN(n)) return ''
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let val = n / 1024
  let i = 0
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(val < 10 ? 1 : 0)} ${units[i]}`
}

function formatDate(d?: string | number | Date) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString() } catch { return '' }
}

const ItemSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
      <div className="h-5 w-5 rounded bg-muted animate-pulse" />
      <div className="h-5 w-5 rounded bg-muted animate-pulse" />
    </CardHeader>
    <CardContent className="p-4">
      <div className="mx-auto h-10 w-10 rounded bg-muted animate-pulse" />
      <div className="mt-3 h-4 w-3/4 mx-auto rounded bg-muted animate-pulse" />
      <div className="mt-2 h-3 w-1/2 mx-auto rounded bg-muted animate-pulse" />
    </CardContent>
  </Card>
)

const EmptyState: React.FC<{ onCreateFolder?: () => void }> = ({ onCreateFolder }) => (
  <div className="flex flex-col items-center justify-center text-center p-10 border rounded-xl bg-muted/20">
    <Folder className="h-10 w-10 mb-3" />
    <h3 className="text-base font-semibold">No documents yet</h3>
    <p className="text-sm text-muted-foreground mt-1">Upload files or create a folder to get started.</p>
    {onCreateFolder && (
      <Button className="mt-4" onClick={onCreateFolder}>New folder</Button>
    )}
  </div>
)

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onDocumentClick,
  onDocumentSelect,
  onDocumentPreview,
  viewMode,
  selectedDocument,
  multipleSelection,
  selectionActions,
  toggleFavorite,
  isLoading,
  showMeta = true,
}) => {
  const { selectedIds } = selectionActions

  const onKeyActivate = useCallback((e: React.KeyboardEvent, doc: Document) => {
    if (e.key === 'Enter') { e.preventDefault(); onDocumentClick(doc) }
    if (e.key === ' ') { e.preventDefault(); onDocumentSelect(doc) }
  }, [onDocumentClick, onDocumentSelect])

  const grid = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {isLoading ? Array.from({length: 8}).map((_, i) => <ItemSkeleton key={i} />) :
        documents.map((document) => {
          const selected = selectedIds.includes(document.id)
          const isFolder = document.type?.toLowerCase() === 'folder'
          return (
            <motion.div
              key={document.id}
              layout
              initial={{opacity: 0, y: 6}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0}}
            >
              <Card
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onKeyDown={(e) => onKeyActivate(e, document)}
                onClick={() => onDocumentClick(document)}
                className={cn(
                  'group overflow-hidden hover:shadow-sm transition-all outline-none',
                  selected && 'ring-2 ring-primary'
                )}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getIcon(document.type)}
                      <CardTitle className="text-sm font-medium truncate" title={document.name}>
                        {document.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {document.favorite && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Star className="h-4 w-4 fill-primary text-primary" aria-label="Favorite" />
                            </TooltipTrigger>
                            <TooltipContent>Favorite</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => onDocumentSelect(document)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={selected ? 'Unselect' : 'Select'}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                  <div className="flex items-center justify-center py-2">
                    {/* Placeholder thumbnail zone */}
                    <div className="h-14 w-14 rounded-lg border bg-muted/40 flex items-center justify-center">
                      {getIcon(document.type)}
                    </div>
                  </div>
                  {showMeta && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Size</div>
                      <div className="truncate text-right">{formatBytes((document as any).size)}</div>
                      <div>Modified</div>
                      <div className="truncate text-right">{formatDate((document as any).updatedAt || (document as any).modifiedAt)}</div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-4 pb-4">
                  <div className="flex items-center w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={isFolder ? 'default' : 'secondary'} className="capitalize">
                        {document.type || 'file'}
                      </Badge>
                      {document.archived && <Badge variant="outline">Archived</Badge>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   

                  
                    </div>
                  </div>
                </CardFooter>
                
              </Card>
            </motion.div>
          )
        })}
    </div>
  ), [documents, isLoading, onDocumentClick, onDocumentPreview, onDocumentSelect, selectedIds, selectionActions, toggleFavorite])

  const list = useMemo(() => (
    <div role="table" className="w-full overflow-hidden rounded-xl border">
      <div role="row" className="grid grid-cols-12 items-center px-3 py-2 text-xs font-semibold bg-muted/40">
        <div className="col-span-6 flex items-center gap-2">
          <Checkbox
            checked={selectedIds.length > 0 && selectedIds.length === documents.length}
            onCheckedChange={(v) => (v ? selectionActions.onSelectAll() : selectionActions.onClearSelection())}
            aria-label="Select all"
          />
          Name
        </div>
        <div role="columnheader" className="col-span-2">Type</div>
        <div role="columnheader" className="col-span-2 text-right">Size</div>
        <div role="columnheader" className="col-span-2 text-right">Modified</div>
      </div>
      <Separator />
      {isLoading ? (
        Array.from({length: 6}).map((_, i) => (
          <div key={i} className="grid grid-cols-12 items-center px-3 py-3">
            <div className="col-span-6 h-4 bg-muted rounded animate-pulse" />
            <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
            <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
            <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
          </div>
        ))
      ) : documents.length === 0 ? (
        <div className="p-6"><EmptyState /></div>
      ) : (
        documents.map((doc) => {
          const selected = selectedIds.includes(doc.id)
          const isFolder = doc.type?.toLowerCase() === 'folder'
          return (
            <motion.div key={doc.id} layout initial={{opacity:0}} animate={{opacity:1}}>
              <div
                role="row"
                tabIndex={0}
                onKeyDown={(e) => onKeyActivate(e, doc)}
                onClick={() => onDocumentClick(doc)}
                className={cn(
                  'grid grid-cols-12 items-center px-3 py-2 hover:bg-muted/30 cursor-pointer outline-none',
                  selected && 'bg-primary/10'
                )}
              >
                <div role="cell" className="col-span-6 flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => onDocumentSelect(doc)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={selected ? 'Unselect' : 'Select'}
                  />
                  {getIcon(doc.type)}
                  <span className="truncate" title={doc.name}>{doc.name}</span>
                </div>
                <div role="cell" className="col-span-2"><Badge variant={isFolder ? 'default' : 'secondary'} className="capitalize">{doc.type || 'file'}</Badge></div>
                <div role="cell" className="col-span-2 text-right">{formatBytes((doc as any).size)}</div>
                <div role="cell" className="col-span-2 text-right">{formatDate((doc as any).updatedAt || (doc as any).modifiedAt)}</div>
              </div>
            </motion.div>
          )
        })
      )}
    </div>
  ), [documents, isLoading, onDocumentClick, onDocumentSelect, onKeyActivate, selectedIds, selectionActions])

  if (!isLoading && documents.length === 0 && viewMode === 'grid') {
    return <EmptyState />
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {/* Selection toolbar (shows only when something is selected) */}
        {selectedIds.length > 0 && (
          <div className="sticky top-0 z-10 rounded-xl border bg-background p-2 shadow-sm flex items-center gap-2">
            <span className="text-sm">{selectedIds.length} selected</span>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button size="sm" variant="secondary" onClick={selectionActions.onDownloadSelected}><Download className="h-4 w-4 mr-1"/>Download</Button>
            <Button size="sm" variant="secondary" onClick={selectionActions.onShareSelected}><Share2 className="h-4 w-4 mr-1"/>Share</Button>
            <Button size="sm" variant="secondary" onClick={() => void selectionActions.onArchiveSelected()}><Archive className="h-4 w-4 mr-1"/>Archive</Button>
            <Button size="sm" variant="destructive" onClick={() => void selectionActions.onDeleteSelected()}>Delete</Button>
            <Button size="sm" variant="ghost" onClick={selectionActions.onClearSelection}>Clear</Button>
          </div>
        )}

        {viewMode === 'grid' ? grid : list}
      </div>
    </TooltipProvider>
  )
}

export default DocumentGrid
