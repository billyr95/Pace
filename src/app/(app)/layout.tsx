import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BottomNav } from "@/components/bottom-nav";
import { LogoWordmark } from "@/components/logo";
import { syncUserPlaidData } from "@/lib/plaid-sync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  // Throttled inside — only actually calls Plaid if it's been a few minutes since the last
  // sync, so opening the app keeps balances/transactions fresh without hammering the API.
  await syncUserPlaidData(session.user.id).catch(() => {});

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <header className="flex items-center justify-center border-b border-divider bg-surface px-5 py-3">
        <LogoWordmark height={20} />
      </header>
      <div className="pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
