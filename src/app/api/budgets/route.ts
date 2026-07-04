import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { currentMonthKey } from "@/lib/money";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? currentMonthKey();

  const budgets = await prisma.budget.findMany({
    where: { userId, month },
    include: { category: true },
  });

  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { categoryId, month, amount, rollover } = body;

  if (!categoryId || !month || typeof amount !== "number") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const budget = await prisma.budget.upsert({
    where: { categoryId_month: { categoryId, month } },
    update: { amount: Math.round(amount), rollover: !!rollover },
    create: {
      userId,
      categoryId,
      month,
      amount: Math.round(amount),
      rollover: !!rollover,
    },
  });

  return NextResponse.json(budget, { status: 201 });
}
