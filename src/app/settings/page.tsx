import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [user, rates, accounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { homeCurrency: true, email: true } }),
    prisma.currencyRate.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId, archived: false }, select: { currency: true } }),
  ]);

  const currenciesInUse = Array.from(new Set(accounts.map((a) => a.currency)));

  return (
    <AppShell>
      <SettingsClient
        homeCurrency={user?.homeCurrency ?? "USD"}
        email={user?.email ?? ""}
        rates={rates.map((r) => ({ currency: r.currency, rateToHome: r.rateToHome, updatedAt: r.updatedAt.toISOString() }))}
        currenciesInUse={currenciesInUse}
      />
    </AppShell>
  );
}
