import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.recurringTemplate.findMany({
    where: { userId, active: true },
    orderBy: { nextDueDate: "asc" },
    include: { category: true, account: true },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, merchant, amount, categoryId, accountId, cadence, nextDueDate } = body;

  if (!name || typeof amount !== "number" || !accountId || !cadence || !nextDueDate) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const template = await prisma.recurringTemplate.create({
    data: {
      userId,
      name,
      merchant: merchant ?? null,
      amount: Math.round(amount),
      categoryId: categoryId ?? null,
      accountId,
      cadence,
      nextDueDate: new Date(nextDueDate),
    },
  });

  return NextResponse.json(template, { status: 201 });
}
