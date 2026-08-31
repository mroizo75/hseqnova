export type OrgChartTreeNode = {
  id: string;
  parentId: string | null;
  title: string;
  name: string | null;
  department: string | null;
  hsDutyKey: string | null;
  hsDuty: string | null;
  sortOrder: number;
};

export type OrgChartTreeBranch = OrgChartTreeNode & {
  children: OrgChartTreeBranch[];
};

export function buildOrgChartTree(nodes: OrgChartTreeNode[]): OrgChartTreeBranch[] {
  const map = new Map<string, OrgChartTreeBranch>();
  const roots: OrgChartTreeBranch[] = [];

  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  for (const node of nodes) {
    const treeNode = map.get(node.id);
    if (!treeNode) continue;
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  const sortChildren = (items: OrgChartTreeBranch[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const item of items) sortChildren(item.children);
  };
  sortChildren(roots);
  return roots;
}
