import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import DashboardView from "@/components/DashboardView";
import {
  getAccountBalances,
  getCurrentNetWorth,
  getNetWorthSeries,
  getSpendingByCategory,
  getIncomeExpense,
  getBudgetProgress,
  getMerchantMemory,
} from "@/lib/analytics";
import { currentMonthKey } from "@/lib/money";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const month = currentMonthKey();

  const [
    netWorthCents,
    netWorthSeries,
    { incomeCents, expensesCents },
    spendingByCategory,
    budgetProgress,
    recentTransactions,
    accounts,
    categories,
    templates,
    merchantMemory,
  ] = await Promise.all([
    getCurrentNetWorth(userId),
    getNetWorthSeries(userId, 6),
    getIncomeExpense(userId, month),
    getSpendingByCategory(userId, month),
    getBudgetProgress(userId, month),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 8,
      include: { category: true },
    }),
    prisma.account.findMany({ where: { userId, archived: false } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.recurringTemplate.findMany({ where: { userId, active: true } }),
    getMerchantMemory(userId),
  ]);

  const savingsRatePct =
    incomeCents > 0 ? Math.round(((incomeCents - expensesCents) / incomeCents) * 100) : 0;

  const netWorthDeltaCents =
    netWorthSeries.length >= 2
      ? netWorthSeries[netWorthSeries.length - 1].netWorthCents -
        netWorthSeries[netWorthSeries.length - 2].netWorthCents
      : 0;

  return (
    <AppShell>
      <DashboardView
        netWorthCents={netWorthCents}
        netWorthDeltaCents={netWorthDeltaCents}
        netWorthSeries={netWorthSeries}
        incomeCents={incomeCents}
        expensesCents={expensesCents}
        savingsRatePct={savingsRatePct}
        spendingByCategory={spendingByCategory}
        budgetProgress={budgetProgress}
        recentTransactions={recentTransactions.map((t) => ({
          id: t.id,
          merchant: t.merchant,
          amount: t.amount,
          date: t.date.toISOString(),
          category: t.category
            ? { name: t.category.name, icon: t.category.icon, color: t.category.color }
            : null,
        }))}
        accounts={accounts}
        categories={categories}
        templates={templates}
        merchantMemory={merchantMemory}
      />
    </AppShell>
  );
}
