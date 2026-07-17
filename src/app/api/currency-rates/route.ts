import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, rates, accounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { homeCurrency: true } }),
    prisma.currencyRate.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId, archived: false }, select: { currency: true } }),
  ]);

  const currenciesInUse = Array.from(new Set(accounts.map((a) => a.currency)));

  return NextResponse.json({
    homeCurrency: user?.homeCurrency ?? "USD",
    rates,
    currenciesInUse,
  });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { currency, rateToHome } = body;

  if (!currency || typeof rateToHome !== "number" || rateToHome <= 0) {
    return NextResponse.json({ error: "A currency and a positive rate are required." }, { status: 400 });
  }

  const rate = await prisma.currencyRate.upsert({
    where: { userId_currency: { userId, currency } },
    update: { rateToHome },
    create: { userId, currency, rateToHome },
  });

  return NextResponse.json(rate);
}
