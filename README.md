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

---

## 7. What's new in this update

No database migration needed for this batch — the schema didn't change.

- **Command palette** — press `Cmd+K` (or `Ctrl+K` on Windows) anywhere to search and jump to any page or add a transaction.
- **Global "n" shortcut** — press `n` from anywhere (when not typing in a field) to open the add-transaction modal instantly.
- **Edit accounts** — the Accounts page now supports editing name/type/balance, not just archiving.
- **Bills page** (`/recurring`) — due-soon list, a simple month calendar with due-date markers, and a "Log now" button that creates the transaction and advances the next due date automatically.
- **Tags** — free-form tags on any transaction, with a filter dropdown on the Transactions page.
- **Reports page** (`/reports`) — a printable monthly report (income/expenses, category breakdown, budget performance, largest transactions, net worth). Click **Export PDF**, then choose "Save as PDF" in your browser's print dialog.
- **Mobile layout fixes** — the sidebar now collapses into a bottom tab bar below the `md` breakpoint instead of squeezing page content into a narrow column, which was the cause of text overflowing on phones. Grids and forms across every page now stack vertically on small screens instead of cramming side by side.

---

## 8. Multi-currency support

**This one needs a database migration** — run this before pulling the new code into production:

```
npx prisma migrate dev --name add_currency_support
```

Then push/deploy as usual. On Vercel, remember `migrate deploy` needs to run against your production database once (same as the initial setup in section 3/4) — the easiest way is running `npx prisma migrate deploy` locally with your `.env` pointed at the production `DATABASE_URL`.

**How it works:**
- Every account has its own currency, set when you create it (defaults to your home currency).
- You pick one **home currency** in `/settings` — net worth, budgets, goals, and reports are always shown in this currency, since those aggregate across accounts.
- Transactions are always entered and stored in their account's native currency — no conversion happens at entry time, so your data stays exact.
- Exchange rates convert foreign-currency accounts into your home currency for those aggregate views. Go to `/settings` and click **Refresh rates** to pull live rates from Frankfurter (a free, keyless ECB-rate API), or enter a rate manually if you'd rather control it yourself.
- If a currency you're using doesn't have a rate yet, the app treats it as 1:1 with your home currency rather than crashing — you'll see a warning on the Accounts page until you set a real rate.
- One known simplification: net worth history (the 6-month chart) uses *today's* exchange rate for all past months, since historical rates aren't tracked. For currencies that move a lot against your home currency, older points on that chart will be slightly off. Everything else (current balances, monthly reports, budgets) uses up-to-date rates.

---

## 9. Letting other people create their own account

The app now supports self-signup at `/signup` — each person gets their own completely separate set of accounts, transactions, budgets, etc. (nothing is shared between users; this isn't household sharing, it's just multiple independent users of the same deployment).

**No new migration needed** for this one, but there's one new environment variable to set:

- `SIGNUP_CODE` — set this to any phrase, then share that phrase (not the URL alone) with whoever you want to invite. They'll need to enter it on the signup page to create an account. Add it in Vercel under Settings → Environment Variables, then redeploy.
- If you leave `SIGNUP_CODE` unset, `/signup` is open to anyone who finds the URL — fine if you're confident the URL stays private, but the invite code costs nothing to set up and is the safer default now that this is reachable by more than just you.

Each new signup automatically gets the same default categories your account started with. Your own login (from the original seed script) still works exactly as before — this doesn't change or migrate your existing account.

---

## 10. First-run tutorial

**Needs a migration** (adds a `hasSeenOnboarding` flag to each user):

```
npx prisma migrate dev --name add_onboarding_flag
```

A 6-step walkthrough shows automatically the first time someone logs in (new signups and your existing account both start with it unseen, unless you've already run the migration and the column defaulted appropriately for your account — if you want to skip it for your own login, just click through it once). It's skippable at any point, and doesn't block anything else in the app.

To see it again anytime, go to **Settings → Tutorial → Replay**.
