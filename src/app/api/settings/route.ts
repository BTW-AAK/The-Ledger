import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { homeCurrency: true, email: true, name: true, hasSeenOnboarding: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { homeCurrency, hasSeenOnboarding } = body;

  if (homeCurrency === undefined && hasSeenOnboarding === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(homeCurrency !== undefined ? { homeCurrency } : {}),
      ...(hasSeenOnboarding !== undefined ? { hasSeenOnboarding } : {}),
    },
  });

  return NextResponse.json({
    homeCurrency: user.homeCurrency,
    hasSeenOnboarding: user.hasSeenOnboarding,
  });
}
