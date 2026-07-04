# Ledger

A manually-tracked personal finance app: accounts, transactions, budgets, net worth, goals, and investments — no bank sync, everything entered by hand, built to make that entry as fast as possible.

Stack: Next.js 14 (App Router) · PostgreSQL · Prisma · NextAuth (credentials) · Tailwind · Recharts.

---

## 1. Install prerequisites (one-time)

You'll need **Node.js** installed on your computer.

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** version for your OS.
2. Run the installer, accepting the defaults.
3. Confirm it worked — open a terminal (Terminal on Mac, Command Prompt/PowerShell on Windows) and run:
   ```
   node -v
   npm -v
   ```
   Both should print a version number.

You'll also want a code editor — [VS Code](https://code.visualstudio.com) is a good free option, but any editor works since you mostly won't need to touch the code.

---

## 2. Get a database

This app needs a PostgreSQL database. The easiest free option is **Neon**:

1. Go to [neon.tech](https://neon.tech) and sign up (free tier is enough for personal use).
2. Create a new project.
3. On the project dashboard, copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Keep this handy for step 3.

(Supabase is a fine alternative if you'd rather use that — same idea, just copy its Postgres connection string instead.)

---

## 3. Run it locally

1. Unzip the project folder and open a terminal inside it.
2. Install dependencies:
   ```
   npm install
   ```
3. Create your environment file:
   ```
   cp .env.example .env
   ```
   Then open `.env` in your editor and fill in:
   - `DATABASE_URL` — the Neon connection string from step 2
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` in your terminal and paste the output (on Windows without openssl, use https://generate-secret.vercel.app/32 instead)
   - `NEXTAUTH_URL` — leave as `http://localhost:3000` for now
   - `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` — the login you'll use to sign in (pick any email-shaped string and a real password)
4. Create the database tables:
   ```
   npx prisma migrate dev --name init
   ```
5. Seed your user and default categories:
   ```
   npm run seed
   ```
6. Start the app:
   ```
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000) and sign in with the email/password from step 3.

You now have the full app running on your own machine, talking to a real hosted database.

---

## 4. Deploy it so it's reachable from anywhere

We'll use **Vercel** (made by the same team as Next.js, free tier is plenty for this).

1. Push this project to a GitHub repository:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Create a new empty repo on [github.com](https://github.com/new), then follow the "push an existing repository" instructions it shows you.
2. Go to [vercel.com](https://vercel.com), sign up with your GitHub account.
3. Click **Add New → Project**, select your repo, and click **Import**.
4. Before deploying, add environment variables (Vercel shows a form for this): copy in the same `DATABASE_URL`, `NEXTAUTH_SECRET`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` from your `.env` file. For `NEXTAUTH_URL`, use the `https://your-project-name.vercel.app` URL Vercel will assign (you can see/set it after the first deploy, then redeploy).
5. Click **Deploy**.
6. Once deployed, you need to run the same database setup against your production database (it's the same Neon database, so this is one-time):
   - Easiest path: run these from your local machine, pointed at the same `DATABASE_URL` you already used — the tables already exist from step 3, so you can skip `migrate dev` and just make sure `npm run seed` has been run once.
   - If you created a *separate* production database, run `npx prisma migrate deploy` and `npm run seed` locally with `.env` temporarily pointed at that database.
7. Visit your `https://your-project-name.vercel.app` URL and sign in.

From then on, every time you `git push`, Vercel automatically redeploys.

---

## 5. How the app is organized (if you want to look around)

```
prisma/schema.prisma     All data models (accounts, transactions, categories, budgets, goals, holdings)
prisma/seed.ts           Creates your login + default categories
src/lib/                 Database client, auth config, money formatting, analytics queries
src/components/          Shared UI: sidebar, transaction modal, charts
src/app/                 One folder per page (dashboard, transactions, budgets, accounts, goals, investments)
src/app/api/             REST endpoints each page's client components call
```

Money is stored as integer cents everywhere in the database (e.g. $12.50 is stored as `1250`) to avoid floating-point rounding bugs — `src/lib/money.ts` handles converting to/from dollars for display.

**Account balance convention:** for checking/savings/cash/investment accounts, enter the starting balance as a normal positive number. For credit cards and loans, the app stores it as a negative number internally (what you owe) so that summing every account balance gives you a correct net worth without special-casing — the Accounts page handles this conversion for you automatically.

---

## 6. What's not built yet (from the original plan)

These were marked lower-priority (P2) in the original spec and aren't in this version:
- Automatic recurring-transaction detection (you set up templates manually instead)
- Forecasting / "safe to spend"
- In-app alerts and notifications
- A second household login with shared visibility

Happy to build any of these next — just ask.
