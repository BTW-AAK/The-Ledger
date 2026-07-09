import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import TransactionsClient from "./TransactionsClient";
import { getMerchantMemory } from "@/lib/analytics";

export default async function TransactionsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [transactions, accounts, categories, templates, merchantMemory] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 200,
      include: { category: true, account: true },
    }),
    prisma.account.findMany({ where: { userId, archived: false } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.recurringTemplate.findMany({ where: { userId, active: true } }),
    getMerchantMemory(userId),
  ]);

  return (
    <AppShell>
      <TransactionsClient
        initialTransactions={transactions.map((t) => ({
          id: t.id,
          merchant: t.merchant,
          amount: t.amount,
          date: t.date.toISOString(),
          accountId: t.accountId,
          accountName: t.account.name,
          categoryId: t.categoryId,
          category: t.category
            ? { id: t.category.id, name: t.category.name, icon: t.category.icon, color: t.category.color }
            : null,
          notes: t.notes,
          tags: t.tags,
        }))}
        accounts={accounts}
        categories={categories}
        templates={templates}
        merchantMemory={merchantMemory}
      />
    </AppShell>
  );
}
