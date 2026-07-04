import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.transaction.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const { accountId, categoryId, date, amount, merchant, notes } = body;

  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      ...(accountId ? { accountId } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(date ? { date: new Date(date) } : {}),
      ...(typeof amount === "number" ? { amount: Math.round(amount) } : {}),
      ...(merchant ? { merchant } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.transaction.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
