import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { linkedAccount: true },
  });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, targetAmount, targetDate, currentAmount, linkedAccountId } = body;

  if (!name || typeof targetAmount !== "number") {
    return NextResponse.json({ error: "Name and target amount are required." }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      name,
      targetAmount: Math.round(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
      currentAmount: Math.round(currentAmount ?? 0),
      linkedAccountId: linkedAccountId ?? null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
