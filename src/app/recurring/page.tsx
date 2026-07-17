import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import RecurringClient from "./RecurringClient";
import { getUserCurrencyContext } from "@/lib/analytics";

export default async function RecurringPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [templates, accounts, categories, { homeCurrency }] = await Promise.all([
    prisma.recurringTemplate.findMany({
      where: { userId, active: true },
      orderBy: { nextDueDate: "asc" },
      include: { category: true, account: true },
    }),
    prisma.account.findMany({ where: { userId, archived: false } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    getUserCurrencyContext(userId),
  ]);

  return (
    <AppShell>
      <RecurringClient
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          merchant: t.merchant,
          amount: t.amount,
          currency: t.account.currency,
          cadence: t.cadence,
          nextDueDate: t.nextDueDate.toISOString(),
          accountId: t.accountId,
          accountName: t.account.name,
          categoryId: t.categoryId,
          category: t.category
            ? { id: t.category.id, name: t.category.name, icon: t.category.icon, color: t.category.color }
            : null,
        }))}
        accounts={accounts}
        categories={categories}
        homeCurrency={homeCurrency}
      />
    </AppShell>
  );
}
