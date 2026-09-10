import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LogoMark } from "@/components/logo";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2, ChevronRight, Repeat } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [plaidItems, ruleCount] = await Promise.all([
    prisma.plaidItem.findMany({ where: { userId } }),
    prisma.merchantRule.count({ where: { userId } }),
  ]);

  return (
    <div className="space-y-6 px-5 pt-6">
      <div className="flex items-center gap-3">
        <LogoMark size={48} />
        <div>
          <p className="font-black">{session!.user.name}</p>
          <p className="text-sm text-secondary">{session!.user.email}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-secondary">Linked institutions</h2>
        {plaidItems.length === 0 ? (
          <p className="text-sm text-secondary">No banks connected yet.</p>
        ) : (
          <ul className="space-y-2">
            {plaidItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-secondary">
                  <Building2 size={18} />
                </span>
                <span className="text-sm font-semibold">{item.institutionName ?? "Connected bank"}</span>
              </li>
            ))}
          </ul>
        )}
        <ConnectBankButton className="mt-3 w-full" />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-secondary">Auto-categorization rules</h2>
        <Link
          href="/profile/merchant-rules"
          className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-secondary">
            <Repeat size={18} />
          </span>
          <span className="flex-1">
            <p className="text-sm font-semibold">
              {ruleCount} rule{ruleCount === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-secondary">Organized by category</p>
          </span>
          <ChevronRight size={16} className="text-secondary" />
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-secondary">Appearance</h2>
        <ThemeToggle />
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/sign-in" });
        }}
      >
        <button type="submit" className="w-full rounded-full border border-divider py-2.5 font-semibold text-ink">
          Sign out
        </button>
      </form>
    </div>
  );
}
