
import { Document } from '@/types/document';

export interface TreeNode extends Document {
  children: TreeNode[];
}

// 1. Build a lookup of nodes, each with an empty children array.
// 2. For each node, if it has a parent_id, push it into its parent's children.
// 3. Wrap everything in a "Pepsico" root folder
export function buildTree(docs: Document[]): TreeNode[] {
  const nodes: Record<string, TreeNode> = {};
  docs.forEach(d => {
    nodes[d.id] = { ...d, children: [] };
  });

  const roots: TreeNode[] = [];
  docs.forEach(d => {
    if (d.parent_id) {
      const parent = nodes[d.parent_id];
      if (parent) {
        parent.children.push(nodes[d.id]);
      } else {
        // orphan–parent not found, treat as root
        roots.push(nodes[d.id]);
      }
    } else {
      roots.push(nodes[d.id]);
    }
  });

  // Create the Pepsico root folder that wraps everything
  const pepsicoRoot: TreeNode = {
    id: 'pepsico-root',
    name: 'Pepsico',
    type: 'folder',
    modified: new Date().toISOString(),
    owner: 'System',
    children: roots
  };

  return [pepsicoRoot];
}
