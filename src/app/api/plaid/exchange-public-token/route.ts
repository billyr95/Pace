import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ publicToken: z.string() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const exchange = await plaidClient.itemPublicTokenExchange({
      public_token: parsed.data.publicToken,
    });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    const [itemResponse, accountsResponse] = await Promise.all([
      plaidClient.itemGet({ access_token: accessToken }),
      plaidClient.accountsGet({ access_token: accessToken }),
    ]);

    const institutionName = itemResponse.data.item.institution_name ?? undefined;
    const institutionId = itemResponse.data.item.institution_id ?? undefined;

    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId: session.user.id,
        itemId,
        accessToken,
        institutionId,
        institutionName,
      },
    });

    await prisma.financialAccount.createMany({
      data: accountsResponse.data.accounts.map((account) => ({
        userId: session.user.id,
        plaidItemId: plaidItem.id,
        plaidAccountId: account.account_id,
        name: account.name,
        mask: account.mask ?? undefined,
        type: account.type,
        subtype: account.subtype ?? undefined,
        currentBalance: account.balances.current ?? undefined,
        availableBalance: account.balances.available ?? undefined,
        isoCurrencyCode: account.balances.iso_currency_code ?? "USD",
      })),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not link that account." }, { status: 500 });
  }
}
