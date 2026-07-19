import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedDefaultCategoriesForUser } from "../src/lib/defaultCategories";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_USER_EMAIL and SEED_USER_PASSWORD in your .env file before seeding."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: email.split("@")[0],
    },
  });

  await seedDefaultCategoriesForUser(prisma, user.id);

  console.log(`Seeded user ${email} with default categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
