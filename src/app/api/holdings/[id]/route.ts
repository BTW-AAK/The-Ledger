import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.holding.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const { name, ticker, quantity, costBasis, currentValue } = body;

  const updated = await prisma.holding.update({
    where: { id: params.id },
    data: {
      ...(name ? { name } : {}),
      ...(ticker !== undefined ? { ticker } : {}),
      ...(typeof quantity === "number" ? { quantity } : {}),
      ...(typeof costBasis === "number" ? { costBasis: Math.round(costBasis) } : {}),
      ...(typeof currentValue === "number" ? { currentValue: Math.round(currentValue) } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.holding.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.holding.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
