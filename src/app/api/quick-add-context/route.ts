import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getMerchantMemory } from "@/lib/analytics";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accounts, categories, templates, merchantMemory] = await Promise.all([
    prisma.account.findMany({ where: { userId, archived: false } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.recurringTemplate.findMany({ where: { userId, active: true } }),
    getMerchantMemory(userId),
  ]);

  return NextResponse.json({ accounts, categories, templates, merchantMemory });
}
