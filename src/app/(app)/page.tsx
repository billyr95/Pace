import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildBalanceHistory } from "@/lib/balance-history";
import { BalanceTrendChart } from "@/components/balance-trend-chart";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { LogoMark } from "@/components/logo";
import { Building2, PiggyBank, Wallet } from "lucide-react";

function accountIcon(type: string) {
  if (type === "credit") return Wallet;
  if (type === "investment" || type === "loan") return Building2;
  return PiggyBank;
}

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [accounts, categories, recentTransactions, monthlySpend] = await Promise.all([
    prisma.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      select: { amount: true, date: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, date: { gte: monthStart }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
  const balanceHistory = buildBalanceHistory(totalBalance, recentTransactions, now);
  const firstPoint = balanceHistory[0]?.balance ?? totalBalance;
  const change = totalBalance - firstPoint;
  const changePct = firstPoint !== 0 ? (change / Math.abs(firstPoint)) * 100 : 0;

  const spentThisMonth = monthlySpend._sum.amount ?? 0;
  const totalBudget = categories.reduce((sum, c) => sum + (c.monthlyLimit ?? 0), 0);
  const pctOfBudget = totalBudget > 0 ? Math.min(100, Math.round((spentThisMonth / totalBudget) * 100)) : 0;

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 px-5 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary/70">
            {greeting}, {session!.user.name?.split(" ")[0] ?? "there"}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        >
          <button type="submit" className="text-xs font-medium text-secondary/60 underline">
            Sign out
          </button>
        </form>
      </div>

      <div>
        <p className="text-sm text-secondary/70">Current balance</p>
        <p className="text-3xl font-black tracking-tight">
          ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {accounts.length > 0 && (
          <p className={`text-sm font-medium ${change >= 0 ? "text-brand-green" : "text-red-500"}`}>
            {change >= 0 ? "+" : ""}
            ${change.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({changePct.toFixed(1)}%) last 30 days
          </p>
        )}
      </div>

      {accounts.length > 0 ? (
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <BalanceTrendChart points={balanceHistory} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-divider bg-surface p-8 text-center">
          <LogoMark size={40} />
          <p className="font-semibold">Connect your first account</p>
          <p className="text-sm text-secondary/70">
            Link a bank account to see real balances, transactions, and budgets here.
          </p>
          <ConnectBankButton className="mt-2" />
        </div>
      )}

      {totalBudget > 0 && (
        <div className="rounded-2xl bg-brand-dark p-4 text-brand-paper">
          <p className="text-sm text-brand-paper/70">Pace this month</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm">
              ${spentThisMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })} of $
              {totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
            </p>
            <p className="text-sm font-semibold">{pctOfBudget}%</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-brand-green" style={{ width: `${pctOfBudget}%` }} />
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-secondary/70">Accounts</h2>
          <ul className="space-y-2">
            {accounts.map((account) => {
              const Icon = accountIcon(account.type);
              return (
                <li key={account.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">
                    <p className="text-sm font-semibold">{account.name}</p>
                    {account.mask && <p className="text-xs text-secondary/60">•••• {account.mask}</p>}
                  </span>
                  <span className="font-semibold">
                    ${(account.currentBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
