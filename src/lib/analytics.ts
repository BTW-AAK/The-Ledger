import { prisma } from "@/lib/prisma";
import { convertToHomeCents } from "@/lib/currency";

/**
 * Balance convention: an account's balance is startingBalance + sum(transaction.amount),
 * always in that account's own currency. For CREDIT_CARD and LOAN accounts, enter the
 * starting balance as a NEGATIVE number representing what's currently owed - this keeps
 * every account summable into net worth (after currency conversion) without special-casing
 * liabilities.
 */

export async function getUserCurrencyContext(userId: string) {
  const [user, rateRows] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { homeCurrency: true } }),
    prisma.currencyRate.findMany({ where: { userId } }),
  ]);
  const homeCurrency = user?.homeCurrency ?? "USD";
  const rates = new Map(rateRows.map((r) => [r.currency, r.rateToHome]));
  return { homeCurrency, rates };
}

export async function getAccountBalances(userId: string) {
  const [accounts, sums, { homeCurrency, rates }] = await Promise.all([
    prisma.account.findMany({ where: { userId, archived: false } }),
    prisma.transaction.groupBy({ by: ["accountId"], where: { userId }, _sum: { amount: true } }),
    getUserCurrencyContext(userId),
  ]);
  const sumByAccount = new Map(sums.map((s) => [s.accountId, s._sum.amount ?? 0]));

  return accounts.map((a) => {
    const balanceCents = a.startingBalance + (sumByAccount.get(a.id) ?? 0);
    return {
      ...a,
      balanceCents,
      balanceHomeCents: convertToHomeCents(balanceCents, a.currency, homeCurrency, rates),
    };
  });
}

export async function getCurrentNetWorth(userId: string) {
  const balances = await getAccountBalances(userId);
  return balances.reduce((s, a) => s + a.balanceHomeCents, 0);
}

export async function getNetWorthSeries(userId: string, months = 6) {
  const [accounts, { homeCurrency, rates }] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    getUserCurrencyContext(userId),
  ]);
  const accountCurrency = new Map(accounts.map((a) => [a.id, a.currency]));
  const startingTotalHome = accounts.reduce(
    (s, a) => s + convertToHomeCents(a.startingBalance, a.currency, homeCurrency, rates),
    0
  );

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: { date: true, amount: true, accountId: true },
  });

  // Note: this uses today's exchange rates for all historical points, since we don't
  // keep a history of past rates. Close enough for a personal tracker; a true historical
  // view would need to snapshot rates over time.
  const transactionsHome = transactions.map((t) => ({
    date: t.date,
    homeCents: convertToHomeCents(t.amount, accountCurrency.get(t.accountId) ?? homeCurrency, homeCurrency, rates),
  }));

  const now = new Date();
  const points: { date: string; netWorthCents: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const effectiveDate = monthEnd > now ? now : monthEnd;
    const sumTo = transactionsHome
      .filter((t) => t.date <= effectiveDate)
      .reduce((s, t) => s + t.homeCents, 0);

    points.push({
      date: effectiveDate.toLocaleDateString("en-US", { month: "short" }),
      netWorthCents: startingTotalHome + sumTo,
    });
  }

  return points;
}

export async function getSpendingByCategory(userId: string, month: string) {
  const [year, mo] = month.split("-").map(Number);
  const start = new Date(year, mo - 1, 1);
  const end = new Date(year, mo, 0, 23, 59, 59);

  const [transactions, { homeCurrency, rates }] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lte: end }, amount: { lt: 0 } },
      include: { category: true, account: true },
    }),
    getUserCurrencyContext(userId),
  ]);

  const byCategory = new Map<string, { name: string; color: string; amountCents: number }>();
  for (const t of transactions) {
    const key = t.category?.id ?? "uncategorized";
    const name = t.category?.name ?? "Uncategorized";
    const color = t.category?.color ?? "#8FA39A";
    const homeCents = Math.abs(convertToHomeCents(t.amount, t.account.currency, homeCurrency, rates));
    const existing = byCategory.get(key);
    if (existing) {
      existing.amountCents += homeCents;
    } else {
      byCategory.set(key, { name, color, amountCents: homeCents });
    }
  }

  return Array.from(byCategory.values()).sort((a, b) => b.amountCents - a.amountCents);
}

export async function getIncomeExpense(userId: string, month: string) {
  const [year, mo] = month.split("-").map(Number);
  const start = new Date(year, mo - 1, 1);
  const end = new Date(year, mo, 0, 23, 59, 59);

  const [transactions, { homeCurrency, rates }] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { account: true },
    }),
    getUserCurrencyContext(userId),
  ]);

  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    const homeCents = convertToHomeCents(t.amount, t.account.currency, homeCurrency, rates);
    if (homeCents > 0) income += homeCents;
    else expenses += Math.abs(homeCents);
  }

  return { incomeCents: income, expensesCents: expenses };
}

export async function getBudgetProgress(userId: string, month: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId, month },
    include: { category: true },
  });

  // Budgets are always entered and stored in the home currency, and getSpendingByCategory
  // already converts everything to home currency, so no further conversion needed here.
  const spendingByCategory = await getSpendingByCategory(userId, month);
  const spentMap = new Map(spendingByCategory.map((s) => [s.name, s.amountCents]));

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
