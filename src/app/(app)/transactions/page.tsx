import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransactionList } from "@/components/transaction-list";
import { fetchCategoryTree } from "@/lib/category-node";

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const [transactions, categoryGroups] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: yearStart } },
      orderBy: { date: "desc" },
      take: 2000,
    }),
    fetchCategoryTree(userId),
  ]);

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-xl font-black">Transactions</h1>

      {transactions.length === 0 ? (
        <p className="text-sm text-secondary/60">
          No transactions yet. Connect a bank account from the Home tab to get started.
        </p>
      ) : (
        <TransactionList initialTransactions={transactions} categories={categoryGroups} />
      )}
    </div>
  );
}
