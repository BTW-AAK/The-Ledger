import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import BudgetsClient from "./BudgetsClient";
import { getBudgetProgress } from "@/lib/analytics";
import { currentMonthKey } from "@/lib/money";

export default async function BudgetsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const month = currentMonthKey();

  const [categories, progress] = await Promise.all([
    prisma.category.findMany({ where: { userId, kind: { not: "INCOME" } }, orderBy: { name: "asc" } }),
    getBudgetProgress(userId, month),
  ]);

  return (
    <AppShell>
      <BudgetsClient categories={categories} progress={progress} month={month} />
    </AppShell>
  );
}
