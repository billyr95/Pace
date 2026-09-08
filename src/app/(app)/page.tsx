import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildBalanceHistory } from "@/lib/balance-history";
import { detectRecurringBills } from "@/lib/recurring";
import { remainingGoalContributionsThisMonth, getGoalRows } from "@/lib/goals-data";
import { GOAL_ROOT_CATEGORIES } from "@/lib/default-categories";
import { NetWorthChart } from "@/components/net-worth-chart";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { GoalsSummaryCard } from "@/components/goals-summary-card";
import { LogoMark } from "@/components/logo";
import { Building2, PiggyBank, Repeat, Wallet } from "lucide-react";

function accountIcon(type: string) {
  if (type === "credit") return Wallet;
  if (type === "investment" || type === "loan") return Building2;
  return PiggyBank;
}

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [accounts, categories, yearTransactions, monthlySpend, remainingGoalPace, goalRows] = await Promise.all([
    prisma.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: oneYearAgo } },
      select: { amount: true, date: true, name: true, merchantName: true, categoryId: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, date: { gte: monthStart }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    remainingGoalContributionsThisMonth(userId, now),
    getGoalRows(userId, now),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
  const balanceHistory = buildBalanceHistory(totalBalance, yearTransactions, now, 365);
  const last30Days = balanceHistory.slice(-30);
  const firstPoint = last30Days[0]?.balance ?? totalBalance;
  const change = totalBalance - firstPoint;
  const changePct = firstPoint !== 0 ? (change / Math.abs(firstPoint)) * 100 : 0;

  const goalsRootId = categories.find((c) => GOAL_ROOT_CATEGORIES.has(c.name))?.id;
  const goalCategoryIds = new Set(categories.filter((c) => c.parentId === goalsRootId).map((c) => c.id));
  const billCandidates = yearTransactions.filter((t) => !t.categoryId || !goalCategoryIds.has(t.categoryId));
  const allRecurringBills = detectRecurringBills(billCandidates, now);
  const recurringBills = allRecurringBills.slice(0, 5);

  const spentThisMonth = monthlySpend._sum.amount ?? 0;
  const totalBudget = categories.reduce((sum, c) => sum + (c.monthlyLimit ?? 0), 0);
  const pctOfBudget = totalBudget > 0 ? Math.min(100, Math.round((spentThisMonth / totalBudget) * 100)) : 0;

  const upcomingBillsTotal = allRecurringBills.reduce((sum, b) => sum + b.averageAmount, 0);
  const safeToSpend = totalBalance - upcomingBillsTotal - remainingGoalPace;

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

      {accounts.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-brand-dark p-5 text-center text-brand-paper">
          <p
            className={`text-4xl font-black tracking-tight ${safeToSpend < 0 ? "text-red-400" : "text-brand-green"}`}
          >
            ${Math.round(safeToSpend).toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-brand-paper/70">Safe to spend this month</p>
          <p className="mt-2 text-[11px] text-brand-paper/40">
            Balance minus upcoming bills and this month&rsquo;s savings goals
          </p>
        </div>
      )}

      <GoalsSummaryCard goals={goalRows} />

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
          <NetWorthChart points={balanceHistory} />
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
        <div className="rounded-2xl border border-white/10 bg-brand-dark p-4 text-brand-paper">
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

      {recurringBills.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-secondary/70">Upcoming bills</h2>
          <ul className="space-y-2">
            {recurringBills.map((bill) => {
              const daysUntil = Math.round((bill.nextDueDate.getTime() - now.getTime()) / 86_400_000);
              const dueLabel =
                daysUntil < 0
                  ? `Was due ${bill.nextDueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                  : daysUntil === 0
                    ? "Due today"
                    : daysUntil === 1
                      ? "Due tomorrow"
                      : `Due in ${daysUntil} days`;
              return (
                <li key={bill.key} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-secondary">
                    <Repeat size={16} />
                  </span>
                  <span className="flex-1">
                    <p className="text-sm font-semibold capitalize">{bill.displayName}</p>
                    <p className="text-xs text-secondary/60">{dueLabel}</p>
                  </span>
                  <span className="font-semibold">
                    ${bill.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </li>
              );
            })}
          </ul>
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
