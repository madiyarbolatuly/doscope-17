// utils/buildTree.ts
import { Document } from "@/types/document";

export type TreeNode = Document & { children?: TreeNode[] };

export function buildTree(docs: Document[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Initialize all nodes
  docs.forEach(doc => {
    map.set(doc.id, { ...doc, children: [] });
  });

  // Assign children to parents
  docs.forEach(doc => {
    if (doc.parent_id && map.has(doc.parent_id)) {
      map.get(doc.parent_id)!.children!.push(map.get(doc.id)!);
    } else {
      roots.push(map.get(doc.id)!); // top-level folder/file
    }
  });

  return roots;
}
