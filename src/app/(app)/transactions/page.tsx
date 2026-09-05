import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransactionList } from "@/components/transaction-list";
import type { CategoryNode } from "@/components/category-picker";

type RawNode = { id: string; name: string; icon: string; children?: RawNode[] };

function toCategoryNode(raw: RawNode): CategoryNode {
  return { id: raw.id, name: raw.name, icon: raw.icon, children: (raw.children ?? []).map(toCategoryNode) };
}

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [transactions, rawCategories] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
    prisma.category.findMany({
      where: { userId, parentId: null },
      orderBy: { name: "asc" },
      include: {
        children: {
          orderBy: { name: "asc" },
          include: { children: { orderBy: { name: "asc" } } },
        },
      },
    }),
  ]);

  const categoryGroups = rawCategories.map(toCategoryNode);

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-xl font-black">Transactions</h1>

      {transactions.length === 0 ? (
        <p className="text-sm text-brand-forest/60">
          No transactions yet. Connect a bank account from the Home tab to get started.
        </p>
      ) : (
        <TransactionList initialTransactions={transactions} categories={categoryGroups} />
      )}
    </div>
  );
}
