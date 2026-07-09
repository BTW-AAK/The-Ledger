import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import ReportClient from "./ReportClient";
import { getSpendingByCategory, getIncomeExpense, getBudgetProgress, getCurrentNetWorth } from "@/lib/analytics";
import { currentMonthKey } from "@/lib/money";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const month = searchParams.month ?? currentMonthKey();
  const [year, mo] = month.split("-").map(Number);
  const start = new Date(year, mo - 1, 1);
  const end = new Date(year, mo, 0, 23, 59, 59);

  const [spendingByCategory, { incomeCents, expensesCents }, budgetProgress, netWorthCents, topTransactions] =
    await Promise.all([
      getSpendingByCategory(userId, month),
      getIncomeExpense(userId, month),
      getBudgetProgress(userId, month),
      getCurrentNetWorth(userId),
      prisma.transaction.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { amount: "asc" },
        take: 10,
        include: { category: true },
      }),
    ]);

  return (
    <AppShell>
      <ReportClient
        month={month}
        spendingByCategory={spendingByCategory}
        incomeCents={incomeCents}
        expensesCents={expensesCents}
        budgetProgress={budgetProgress}
        netWorthCents={netWorthCents}
        topTransactions={topTransactions.map((t) => ({
          id: t.id,
          merchant: t.merchant,
          amount: t.amount,
          date: t.date.toISOString(),
          categoryName: t.category?.name ?? "Uncategorized",
        }))}
      />
    </AppShell>
  );
}
