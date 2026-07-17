import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.account.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const { name, type, startingBalance, archived, currency } = body;

  const updated = await prisma.account.update({
    where: { id: params.id },
    data: {
      ...(name ? { name } : {}),
      ...(type ? { type } : {}),
      ...(currency ? { currency } : {}),
      ...(typeof startingBalance === "number" ? { startingBalance: Math.round(startingBalance) } : {}),
      ...(typeof archived === "boolean" ? { archived } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.account.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Archive rather than hard-delete so transaction history stays intact.
  await prisma.account.update({ where: { id: params.id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
