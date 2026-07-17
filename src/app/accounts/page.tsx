import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import AppShell from "@/components/AppShell";
import AccountsClient from "./AccountsClient";
import { getAccountBalances, getUserCurrencyContext } from "@/lib/analytics";

export default async function AccountsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [accounts, { homeCurrency, rates }] = await Promise.all([
    getAccountBalances(userId),
    getUserCurrencyContext(userId),
  ]);

  return (
    <AppShell>
      <AccountsClient
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          currency: a.currency,
          startingBalance: a.startingBalance,
          balanceCents: a.balanceCents,
          balanceHomeCents: a.balanceHomeCents,
        }))}
        homeCurrency={homeCurrency}
        ratesKnown={Array.from(rates.keys())}
      />
    </AppShell>
  );
}
