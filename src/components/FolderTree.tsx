// src/components/FolderTree.tsx
import React from 'react'
import { Folder } from 'lucide-react'

export interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file' | string   // остаётся, вдруг пригодится
  children?: TreeNode[]
}

interface FolderTreeProps {
  data: TreeNode[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  data,
  selectedId,
  onSelect
}) => (
  <ul className="pl-4 space-y-0.5">
    {/* показываем только элементы с type === 'folder' */}
    {data
      .filter(node => node.type === 'folder')
      .map(node => (
        <li key={node.id}>
          <div
            className={`flex items-center gap-2 p-1 rounded cursor-pointer
              ${selectedId === node.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            onClick={() => onSelect(node.id)}
          >
            <Folder className="w-4 h-4 text-yellow-600" />
            <span className="truncate">{node.name}</span>
          </div>

          {node.children?.length && (
            <FolderTree
              data={node.children}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </li>
      ))}
  </ul>
)
