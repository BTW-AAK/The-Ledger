import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import InvestmentsClient from "./InvestmentsClient";

export default async function InvestmentsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [holdings, accounts] = await Promise.all([
    prisma.holding.findMany({ where: { userId }, orderBy: { name: "asc" }, include: { account: true } }),
    prisma.account.findMany({ where: { userId, archived: false, type: "INVESTMENT" } }),
  ]);

  return (
    <AppShell>
      <InvestmentsClient
        holdings={holdings.map((h) => ({
          id: h.id,
          name: h.name,
          ticker: h.ticker,
          quantity: h.quantity,
          costBasis: h.costBasis,
          currentValue: h.currentValue,
          accountName: h.account.name,
          accountId: h.accountId,
        }))}
        accounts={accounts}
      />
    </AppShell>
  );
}
