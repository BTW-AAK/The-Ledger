import { prisma } from "@/lib/prisma";

/**
 * Balance convention: an account's balance is startingBalance + sum(transaction.amount).
 * For CREDIT_CARD and LOAN accounts, enter the starting balance as a NEGATIVE number
 * representing what's currently owed - this keeps every account summable into net worth
 * without special-casing liabilities.
 */
export async function getAccountBalances(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId, archived: false } });
  const sums = await prisma.transaction.groupBy({
    by: ["accountId"],
    where: { userId },
    _sum: { amount: true },
  });
  const sumByAccount = new Map(sums.map((s) => [s.accountId, s._sum.amount ?? 0]));

  return accounts.map((a) => ({
    ...a,
    balanceCents: a.startingBalance + (sumByAccount.get(a.id) ?? 0),
  }));
}

export async function getCurrentNetWorth(userId: string) {
  const balances = await getAccountBalances(userId);
  const holdings = await prisma.holding.findMany({ where: { userId } });
  const accountBalanceTotal = balances.reduce((s, a) => s + a.balanceCents, 0);
  const holdingsTotal = holdings.reduce((s, h) => s + h.currentValue, 0);
  return accountBalanceTotal + holdingsTotal;
}

export async function getNetWorthSeries(userId: string, months = 6) {
  const accounts = await prisma.account.findMany({ where: { userId } });
  const startingTotal = accounts.reduce((s, a) => s + a.startingBalance, 0);

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: { date: true, amount: true },
  });

  const now = new Date();
  const points: { date: string; netWorthCents: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const effectiveDate = monthEnd > now ? now : monthEnd;
    const sumTo = transactions
      .filter((t) => t.date <= effectiveDate)
      .reduce((s, t) => s + t.amount, 0);

    points.push({
      date: effectiveDate.toLocaleDateString("en-US", { month: "short" }),
      netWorthCents: startingTotal + sumTo,
    });
  }

  return points;
}

export async function getSpendingByCategory(userId: string, month: string) {
  const [year, mo] = month.split("-").map(Number);
  const start = new Date(year, mo - 1, 1);
  const end = new Date(year, mo, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end }, amount: { lt: 0 } },
    include: { category: true },
  });

  const byCategory = new Map<string, { name: string; color: string; amountCents: number }>();
  for (const t of transactions) {
    const key = t.category?.id ?? "uncategorized";
    const name = t.category?.name ?? "Uncategorized";
    const color = t.category?.color ?? "#8FA39A";
    const existing = byCategory.get(key);
    if (existing) {
      existing.amountCents += Math.abs(t.amount);
    } else {
      byCategory.set(key, { name, color, amountCents: Math.abs(t.amount) });
    }
  }

  return Array.from(byCategory.values()).sort((a, b) => b.amountCents - a.amountCents);
}

export async function getIncomeExpense(userId: string, month: string) {
  const [year, mo] = month.split("-").map(Number);
  const start = new Date(year, mo - 1, 1);
  const end = new Date(year, mo, 0, 23, 59, 59);

  const result = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lte: end }, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  const income = result._sum.amount ?? 0;

  const expenseResult = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lte: end }, amount: { lt: 0 } },
    _sum: { amount: true },
  });
  const expenses = Math.abs(expenseResult._sum.amount ?? 0);

  return { incomeCents: income, expensesCents: expenses };
}

export async function getBudgetProgress(userId: string, month: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId, month },
    include: { category: true },
  });

  const spendingByCategory = await getSpendingByCategory(userId, month);
  const spentMap = new Map(
    spendingByCategory.map((s) => [s.name, s.amountCents])
  );

  return budgets.map((b) => ({
    id: b.id,
    name: b.category.name,
    color: b.category.color,
    budgetCents: b.amount,
    spentCents: spentMap.get(b.category.name) ?? 0,
  }));
}

/** Merchant → category memory, used to auto-suggest a category while entering a transaction. */
export async function getMerchantMemory(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, categoryId: { not: null } },
    orderBy: { date: "desc" },
    select: { merchant: true, categoryId: true },
    take: 300,
  });

  const seen = new Map<string, string>();
  for (const t of transactions) {
    if (!seen.has(t.merchant) && t.categoryId) {
      seen.set(t.merchant, t.categoryId);
    }
  }

  return Array.from(seen.entries()).map(([merchant, categoryId]) => ({ merchant, categoryId }));
}
