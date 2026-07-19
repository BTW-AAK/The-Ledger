import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { seedDefaultCategoriesForUser } from "@/lib/defaultCategories";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, name, inviteCode } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // If SIGNUP_CODE is set, registration is gated behind it. If it's not set, signup is open
  // to anyone with the URL - fine for truly private deployments, but worth setting for anything
  // reachable from the open internet.
  const requiredCode = process.env.SIGNUP_CODE;
  if (requiredCode && inviteCode !== requiredCode) {
    return NextResponse.json({ error: "Incorrect invite code." }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split("@")[0],
      },
    });
  } catch {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  await seedDefaultCategoriesForUser(prisma, user.id);

  return NextResponse.json({ ok: true }, { status: 201 });
}
