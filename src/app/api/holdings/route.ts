import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const holdings = await prisma.holding.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { account: true },
  });
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { accountId, name, ticker, quantity, costBasis, currentValue } = body;

  if (!accountId || !name || typeof quantity !== "number" || typeof currentValue !== "number") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const holding = await prisma.holding.create({
    data: {
      userId,
      accountId,
      name,
      ticker: ticker ?? null,
      quantity,
      costBasis: Math.round(costBasis ?? 0),
      currentValue: Math.round(currentValue),
    },
  });

  return NextResponse.json(holding, { status: 201 });
}
