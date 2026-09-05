export type RawCategoryNode = {
  id: string;
  name: string;
  icon: string;
  monthlyLimit: number | null;
  transactions: { amount: number }[];
  children?: RawCategoryNode[];
};

export type AggregatedNode = {
  id: string;
  name: string;
  icon: string;
  monthlyLimit: number | null;
  /** This node's own directly-assigned transactions, expense side (positive Plaid amounts = outflows). */
  spent: number;
  /** This node's own directly-assigned transactions, income side (negative Plaid amounts = inflows), as a positive number. */
  received: number;
  /** spent, rolled up through all descendants. */
  totalSpent: number;
  /** received, rolled up through all descendants. */
  totalReceived: number;
  /** monthlyLimit rolled up across leaf descendants only (budgets are only set on leaves). */
  totalBudget: number;
  children: AggregatedNode[];
};

export function aggregate(node: RawCategoryNode): AggregatedNode {
  const spent = node.transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const received = node.transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum - t.amount, 0);
  const children = (node.children ?? []).map(aggregate);
  const isLeaf = children.length === 0;

  return {
    id: node.id,
    name: node.name,
    icon: node.icon,
    monthlyLimit: node.monthlyLimit,
    spent,
    received,
    totalSpent: spent + children.reduce((sum, c) => sum + c.totalSpent, 0),
    totalReceived: received + children.reduce((sum, c) => sum + c.totalReceived, 0),
    totalBudget: (isLeaf ? (node.monthlyLimit ?? 0) : 0) + children.reduce((sum, c) => sum + c.totalBudget, 0),
    children,
  };
}

export type LeafDisplayRow = {
  id: string;
  name: string;
  monthlyLimit: number | null;
  amount: number; // spent or received, whichever this subtree tracks
  sectionPath: { name: string; icon: string }[];
  /** Same metric, but for the prior calendar month — attached by the caller, not computed here. */
  priorAmount?: number;
};

/** Flattens a group's children into leaf rows, inserting a sub-header boundary for any intermediate grouping level. */
export function flattenLeaves(node: AggregatedNode, isIncome: boolean, ancestors: { name: string; icon: string }[] = []): LeafDisplayRow[] {
  if (node.children.length === 0) {
    return [
      {
        id: node.id,
        name: node.name,
        monthlyLimit: node.monthlyLimit,
        amount: isIncome ? node.totalReceived : node.totalSpent,
        sectionPath: ancestors,
      },
    ];
  }
  return node.children.flatMap((child) => flattenLeaves(child, isIncome, [...ancestors, { name: node.name, icon: node.icon }]));
}
