# pace — your money. your pace.

A budgeting app: Next.js (App Router, TypeScript, Tailwind v4) today as a
responsive web app, with a path to wrap it for the App Store (Capacitor) or
rebuild native once the product is proven.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind v4**
- **Prisma** + **SQLite** locally (swap to Postgres for prod — see below)
- **Auth.js (NextAuth v5)** — email/password, JWT sessions
- **Plaid** — sandbox bank linking + transaction sync
- Brand font (Satoshi) loaded from `/fonts`, color tokens in `src/app/globals.css`

## Getting started

```bash
npm install
cp .env.example .env      # already done for you; fill in Plaid keys
npx prisma migrate dev    # creates prisma/dev.db
npm run dev
```

Open http://localhost:3000, create an account, and you'll land on the
dashboard. Every new account gets 4 starter budget categories (Housing,
Food & Dining, Transport, Lifestyle) — edit their limits from the Plan tab.

### Connecting a bank (Plaid sandbox)

The "Connect a bank account" button on Home/Profile needs Plaid sandbox
credentials to work:

1. Sign up free at https://dashboard.plaid.com/signup
2. Grab your **Client ID** and **Sandbox secret** from the dashboard
3. Put them in `.env`:
   ```
   PLAID_CLIENT_ID="..."
   PLAID_SECRET="..."
   PLAID_ENV="sandbox"
   ```
4. Restart `npm run dev`, click "Connect a bank account", and use Plaid's
   sandbox test credentials (`user_good` / `pass_good`) when Link opens.

Without these set, the button stays disabled with an inline error — that's
expected, not a bug.

#### Connecting a real bank instead

Sandbox never touches real accounts. To link a real bank, request
Production access from the Plaid dashboard (Plaid's self-serve trial plan
works for this — no lengthy review needed for small-scale/personal use).
Then swap in the production secret:

```
PLAID_SECRET="your_production_secret"
PLAID_ENV="production"
```

Update this in both your local `.env` and the `pace` project's environment
variables on Vercel. No code changes needed — `PLAID_ENV` already picks the
right Plaid API host (`src/lib/plaid.ts`). Once switched, Link shows real
institutions and needs real bank login credentials — sandbox's
`user_good`/`pass_good` won't work anymore.

## What's real vs. placeholder

- **Real**: auth, budgets, Plaid Link + transaction sync, all the dashboard
  math (balances, spend-by-category, budget progress) — all computed from
  actual database rows, no fabricated numbers.
- **Placeholder**: the logo/wordmark (`src/components/logo.tsx`) is a plain
  "p" monogram — swap it for the real assets whenever they're ready.

## Database

Local dev uses SQLite (`prisma/dev.db`, gitignored) for zero-setup. Before
shipping, switch to Postgres (Supabase, Neon, RDS, etc.):

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`
2. Set `DATABASE_URL` in `.env` to your Postgres connection string
3. `npx prisma migrate dev`

## Project layout

```
src/app/(app)/        authenticated shell — bottom nav + Home/Plan/Transactions/Insights/Profile
src/app/sign-in/       sign-in & sign-up pages
src/app/api/plaid/     Plaid Link token, token exchange, transaction sync
src/app/api/register/  account creation
src/auth.ts            Auth.js config (credentials provider)
prisma/schema.prisma   User, PlaidItem, FinancialAccount, Category, Transaction
```

## Next steps toward iOS

This is a responsive web app on purpose, so you can validate the product
fast without native tooling. When you're ready for the App Store:

- **Fastest path**: wrap this with [Capacitor](https://capacitorjs.com) to
  ship it as a real iOS app while reusing this whole codebase.
- **Native rebuild**: once the product/UX is proven, a SwiftUI rebuild can
  reuse this Prisma schema and API routes as-is (they're just JSON endpoints).
