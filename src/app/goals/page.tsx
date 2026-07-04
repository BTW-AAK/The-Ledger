import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import GoalsClient from "./GoalsClient";

export default async function GoalsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [goals, accounts] = await Promise.all([
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.account.findMany({ where: { userId, archived: false } }),
  ]);

  return (
    <AppShell>
      <GoalsClient
        goals={goals.map((g) => ({
          id: g.id,
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          targetDate: g.targetDate?.toISOString() ?? null,
        }))}
        accounts={accounts}
      />
    </AppShell>
  );
}
