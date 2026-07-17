import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, startingBalance, currency } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required." }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: {
      userId,
      name,
      type,
      currency: currency ?? "USD",
      startingBalance: Math.round(startingBalance ?? 0),
    },
  });

  return NextResponse.json(account, { status: 201 });
}
