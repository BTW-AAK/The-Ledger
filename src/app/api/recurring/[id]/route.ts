import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.recurringTemplate.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const { name, merchant, amount, categoryId, accountId, cadence, nextDueDate, active } = body;

  const updated = await prisma.recurringTemplate.update({
    where: { id: params.id },
    data: {
      ...(name ? { name } : {}),
      ...(merchant !== undefined ? { merchant } : {}),
      ...(typeof amount === "number" ? { amount: Math.round(amount) } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(accountId ? { accountId } : {}),
      ...(cadence ? { cadence } : {}),
      ...(nextDueDate ? { nextDueDate: new Date(nextDueDate) } : {}),
      ...(typeof active === "boolean" ? { active } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.recurringTemplate.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.recurringTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
