import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.goal.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const { name, targetAmount, targetDate, currentAmount, linkedAccountId } = body;

  const updated = await prisma.goal.update({
    where: { id: params.id },
    data: {
      ...(name ? { name } : {}),
      ...(typeof targetAmount === "number" ? { targetAmount: Math.round(targetAmount) } : {}),
      ...(targetDate !== undefined ? { targetDate: targetDate ? new Date(targetDate) : null } : {}),
      ...(typeof currentAmount === "number" ? { currentAmount: Math.round(currentAmount) } : {}),
      ...(linkedAccountId !== undefined ? { linkedAccountId } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.goal.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.goal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
