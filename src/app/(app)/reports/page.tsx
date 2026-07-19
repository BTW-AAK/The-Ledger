import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ReportClient from "./ReportClient";
import {
  getSpendingByCategory,
  getIncomeExpense,
  getBudgetProgress,
  getCurrentNetWorth,
  getUserCurrencyContext,
} from "@/lib/analytics";
import { currentMonthKey } from "@/lib/money";
import { convertToHomeCents } from "@/lib/currency";

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

  const [
    spendingByCategory,
    { incomeCents, expensesCents },
    budgetProgress,
    netWorthCents,
    monthTransactions,
    { homeCurrency, rates },
  ] = await Promise.all([
    getSpendingByCategory(userId, month),
    getIncomeExpense(userId, month),
    getBudgetProgress(userId, month),
    getCurrentNetWorth(userId),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { category: true, account: true },
    }),
    getUserCurrencyContext(userId),
  ]);

  // Sort by home-currency value, not raw amount - raw amounts aren't comparable across currencies.
  const topTransactions = monthTransactions
    .map((t) => ({
      id: t.id,
      merchant: t.merchant,
      amount: convertToHomeCents(t.amount, t.account.currency, homeCurrency, rates),
      date: t.date.toISOString(),
      categoryName: t.category?.name ?? "Uncategorized",
    }))
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 10);

  return (
    <ReportClient
      month={month}
      homeCurrency={homeCurrency}
      spendingByCategory={spendingByCategory}
      incomeCents={incomeCents}
      expensesCents={expensesCents}
      budgetProgress={budgetProgress}
      netWorthCents={netWorthCents}
      topTransactions={topTransactions}
    />
  );
}
