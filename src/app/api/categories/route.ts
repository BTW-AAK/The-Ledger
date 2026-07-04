import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, kind, icon, color } = body;
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const category = await prisma.category.create({
    data: {
      userId,
      name,
      kind: kind ?? "FLEXIBLE",
      icon: icon ?? "ti-tag",
      color: color ?? "#8FA39A",
    },
  });

  return NextResponse.json(category, { status: 201 });
}
