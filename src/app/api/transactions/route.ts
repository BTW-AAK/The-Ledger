import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const q = searchParams.get("q");
  const tag = searchParams.get("tag");
  const limit = Number(searchParams.get("limit") ?? 100);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(accountId ? { accountId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { merchant: { contains: q, mode: "insensitive" } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { date: "desc" },
    take: Math.min(limit, 500),
    include: { category: true, account: true },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { accountId, categoryId, date, amount, merchant, notes, tags } = body;

  if (!accountId || !date || typeof amount !== "number" || !merchant) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      accountId,
      categoryId: categoryId ?? null,
      date: new Date(date),
      amount: Math.round(amount),
      merchant,
      notes: notes ?? null,
      tags: Array.isArray(tags) ? tags : [],
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
