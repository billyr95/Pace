import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const items = await prisma.plaidItem.findMany({
    where: { userId },
    include: { accounts: true },
  });

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

        await prisma.transaction.upsert({
          where: { plaidTransactionId: txn.transaction_id },
          create: data,
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
