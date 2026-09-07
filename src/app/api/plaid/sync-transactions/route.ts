import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncUserPlaidData } from "@/lib/plaid-sync";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUserPlaidData(session.user.id, { force: true });

  return NextResponse.json({ ok: true });
}
