import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { auth } from "@/auth";
import { plaidClient } from "@/lib/plaid";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: session.user.id },
      client_name: "pace",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    return NextResponse.json({ linkToken: response.data.link_token });
  } catch {
    return NextResponse.json(
      { error: "Could not create a Plaid link token. Check your PLAID_CLIENT_ID / PLAID_SECRET." },
      { status: 500 },
    );
  }
}
