import { PrismaClient, CategoryKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES: {
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}[] = [
  { name: "Groceries", kind: "FLEXIBLE", icon: "ti-shopping-cart", color: "#C99A4E" },
  { name: "Dining", kind: "FLEXIBLE", icon: "ti-coffee", color: "#C1603F" },
  { name: "Transport", kind: "FLEXIBLE", icon: "ti-car", color: "#5B8266" },
  { name: "Shopping", kind: "FLEXIBLE", icon: "ti-shopping-bag", color: "#7C8DA6" },
  { name: "Rent", kind: "FIXED", icon: "ti-home", color: "#C99A4E" },
  { name: "Utilities", kind: "FIXED", icon: "ti-bolt", color: "#7C8DA6" },
  { name: "Subscriptions", kind: "FIXED", icon: "ti-device-tv", color: "#C1603F" },
  { name: "Insurance", kind: "FIXED", icon: "ti-shield", color: "#5B8266" },
  { name: "Health", kind: "FLEXIBLE", icon: "ti-heart", color: "#C1603F" },
  { name: "Entertainment", kind: "FLEXIBLE", icon: "ti-movie", color: "#7C8DA6" },
  { name: "Travel", kind: "FLEXIBLE", icon: "ti-plane", color: "#C99A4E" },
  { name: "Income", kind: "INCOME", icon: "ti-briefcase", color: "#5B8266" },
  { name: "Other", kind: "FLEXIBLE", icon: "ti-dots", color: "#8FA39A" },
];

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

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { ...cat, userId: user.id },
    });
  }

  console.log(`Seeded user ${email} with ${DEFAULT_CATEGORIES.length} default categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
