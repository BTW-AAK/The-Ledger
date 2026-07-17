import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { fetchLiveRates } from "@/lib/currency";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, accounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { homeCurrency: true } }),
    prisma.account.findMany({ where: { userId, archived: false }, select: { currency: true } }),
  ]);
  const homeCurrency = user?.homeCurrency ?? "USD";
  const currencies = Array.from(new Set(accounts.map((a) => a.currency)));

  let rates: Map<string, number>;
  try {
    rates = await fetchLiveRates(homeCurrency, currencies);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not fetch exchange rates." },
      { status: 502 }
    );
  }

  const updated = await Promise.all(
    Array.from(rates.entries()).map(([currency, rateToHome]) =>
      prisma.currencyRate.upsert({
        where: { userId_currency: { userId, currency } },
        update: { rateToHome },
        create: { userId, currency, rateToHome },
      })
    )
  );

  return NextResponse.json({ updated: updated.length, rates: updated });
}
