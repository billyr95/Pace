import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { merchantKey } from "@/lib/merchant-key";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [items, rules] = await Promise.all([
    prisma.plaidItem.findMany({ where: { userId }, include: { accounts: true } }),
    prisma.merchantRule.findMany({ where: { userId } }),
  ]);
  const categoryByMatchKey = new Map(rules.map((r) => [r.matchKey, r.categoryId]));

  let added = 0;

  for (const item of items) {
    const accountIdByPlaidId = new Map(item.accounts.map((a) => [a.plaidAccountId, a.id]));

    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: item.accessToken,
        cursor,
      });

      for (const txn of response.data.added) {
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
        const matchedCategoryId = categoryByMatchKey.get(merchantKey(data));

        await prisma.transaction.upsert({
          where: { plaidTransactionId: txn.transaction_id },
          // Only auto-categorize on first insert — a re-sync (e.g. pending -> posted) must
          // never clobber a category the user already picked by hand.
          create: matchedCategoryId ? { ...data, categoryId: matchedCategoryId } : data,
          update: data,
        });
        added += 1;
      }

      cursor = response.data.next_cursor;
      hasMore = response.data.has_more;
    }
  }

  return NextResponse.json({ added });
}
