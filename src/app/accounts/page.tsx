import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import AppShell from "@/components/AppShell";
import AccountsClient from "./AccountsClient";
import { getAccountBalances } from "@/lib/analytics";

export default async function AccountsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const accounts = await getAccountBalances(userId);

  return (
    <AppShell>
      <AccountsClient
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          startingBalance: a.startingBalance,
          balanceCents: a.balanceCents,
        }))}
      />
    </AppShell>
  );
}
