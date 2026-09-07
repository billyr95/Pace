import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { merchantKey } from "@/lib/merchant-key";

const SYNC_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Pulls fresh transactions and account balances from Plaid. Called on every authenticated
 * page load (throttled) so spending shows up without the user having to do anything, and
 * with force:true right after linking a new account (and by the manual sync route).
 */
export async function syncUserPlaidData(userId: string, { force = false }: { force?: boolean } = {}) {
  const items = await prisma.plaidItem.findMany({ where: { userId }, include: { accounts: true } });
  if (items.length === 0) return;

  const rules = await prisma.merchantRule.findMany({ where: { userId } });
  const categoryByMatchKey = new Map(rules.map((r) => [r.matchKey, r.categoryId]));
  const now = new Date();

  for (const item of items) {
    if (!force && item.lastSyncedAt && now.getTime() - item.lastSyncedAt.getTime() < SYNC_THROTTLE_MS) {
      continue;
    }

    const accountIdByPlaidId = new Map(item.accounts.map((a) => [a.plaidAccountId, a.id]));

    let cursor = item.syncCursor ?? undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({ access_token: item.accessToken, cursor });

      for (const txn of [...response.data.added, ...response.data.modified]) {
        const financialAccountId = accountIdByPlaidId.get(txn.account_id);
        if (!financialAccountId) continue;

        const data = {
          userId,
          financialAccountId,
          plaidTransactionId: txn.transaction_id,
          amount: txn.amount,
          isoCurrencyCode: txn.iso_currency_code ?? "USD",
          date: new Date(txn.date),
          name: txn.name,
          merchantName: txn.merchant_name ?? undefined,
          pending: txn.pending,
        };
        // Only auto-categorize on first insert — a re-sync (e.g. pending -> posted) must
        // never clobber a category the user already picked by hand.
        const matchedCategoryId = categoryByMatchKey.get(merchantKey(data));

        await prisma.transaction.upsert({
          where: { plaidTransactionId: txn.transaction_id },
          create: matchedCategoryId ? { ...data, categoryId: matchedCategoryId } : data,
          update: data,
        });
      }

      const removedIds = response.data.removed.map((r) => r.transaction_id).filter((id): id is string => !!id);
      if (removedIds.length > 0) {
        await prisma.transaction.deleteMany({ where: { plaidTransactionId: { in: removedIds } } });
      }

      cursor = response.data.next_cursor;
      hasMore = response.data.has_more;
    }

    const accountsResponse = await plaidClient.accountsGet({ access_token: item.accessToken });
    for (const account of accountsResponse.data.accounts) {
      await prisma.financialAccount.updateMany({
        where: { plaidAccountId: account.account_id },
        data: {
          currentBalance: account.balances.current ?? undefined,
          availableBalance: account.balances.available ?? undefined,
        },
      });
    }

    await prisma.plaidItem.update({ where: { id: item.id }, data: { lastSyncedAt: now, syncCursor: cursor } });
  }
}
