import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LogoMark } from "@/components/logo";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MerchantRuleList, type MerchantRuleData } from "@/components/merchant-rule-list";
import { fetchCategoryTree } from "@/lib/category-node";
import { Building2 } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [plaidItems, rawRules, categoryGroups] = await Promise.all([
    prisma.plaidItem.findMany({ where: { userId } }),
    prisma.merchantRule.findMany({ where: { userId }, orderBy: { matchKey: "asc" } }),
    fetchCategoryTree(userId),
  ]);

  const rules: MerchantRuleData[] = rawRules.map((r) => {
    const separatorIndex = r.matchKey.lastIndexOf("::");
    return {
      id: r.id,
      merchant: r.matchKey.slice(0, separatorIndex),
      direction: r.matchKey.slice(separatorIndex + 2) === "in" ? "in" : "out",
      categoryId: r.categoryId,
    };
  });

  return (
    <div className="space-y-6 px-5 pt-6">
      <div className="flex items-center gap-3">
        <LogoMark size={48} />
        <div>
          <p className="font-black">{session!.user.name}</p>
          <p className="text-sm text-secondary/60">{session!.user.email}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-secondary/70">Linked institutions</h2>
        {plaidItems.length === 0 ? (
          <p className="text-sm text-secondary/60">No banks connected yet.</p>
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
        <h2 className="mb-2 text-sm font-semibold text-secondary/70">Auto-categorization rules</h2>
        <MerchantRuleList rules={rules} categories={categoryGroups} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-secondary/70">Appearance</h2>
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
