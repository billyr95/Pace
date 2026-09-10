# pace, finance that moves with you

A mobile-first budgeting app that connects to real bank accounts via Plaid, built as a responsive Next.js web app with a clear path to native iOS.

## Overview

Pace is architected around a single primitive: a three-level category tree. Budgets, savings goals, and transfers are all just categories with a limit or target attached, there's no separate ledger. Categorizing a transfer into a Goals category is literally how goal progress gets tracked.

On top of that sit four on-demand, user-triggered AI tools powered by Gemini: a plain-language budget check-in, a trends and cash-flow forecast, a "what if?" scenario tool, and per-goal savings chat. None of them run automatically, they only read real data and only respond when asked.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind v4**
- **Prisma** + **SQLite** locally (Postgres in production, see below)
- **Auth.js (NextAuth v5)**, email/password, JWT sessions
- **Plaid**, bank linking and transaction sync
- **Gemini**, on-demand AI tools for budgeting insights

## Getting started

\`\`\`bash
npm install
cp .env.example .env      # already done for you; fill in Plaid keys
npx prisma migrate dev    # creates prisma/dev.db
npm run dev
\`\`\`

Open http://localhost:3000, create an account, and you'll land on the dashboard. Every new account gets 4 starter budget categories (Housing, Food & Dining, Transport, Lifestyle), edit their limits from the Plan tab.

### Connecting a bank (Plaid sandbox)

The "Connect a bank account" button on Home/Profile needs Plaid sandbox credentials to work:

1. Sign up free at https://dashboard.plaid.com/signup
2. Grab your **Client ID** and **Sandbox secret** from the dashboard
3. Put them in `.env`:
   \`\`\`
   PLAID_CLIENT_ID="..."
   PLAID_SECRET="..."
   PLAID_ENV="sandbox"
   \`\`\`
4. Restart `npm run dev`, click "Connect a bank account", and use Plaid's sandbox test credentials (`user_good` / `pass_good`) when Link opens.

#### Connecting a real bank instead

Sandbox never touches real accounts. To link a real bank, request Production access from the Plaid dashboard. Then swap in the production secret:

\`\`\`
PLAID_SECRET="your_production_secret"
PLAID_ENV="production"
\`\`\`

Update this in both your local `.env` and the `pace` project's environment variables on Vercel. `PLAID_ENV` already picks the right Plaid API host (`src/lib/plaid.ts`), no code changes needed.

## Database

Local dev uses SQLite (`prisma/dev.db`, gitignored) for zero-setup. In production, this runs on Postgres:

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`
2. Set `DATABASE_URL` in `.env` to your Postgres connection string
3. `npx prisma migrate dev`

## Project layout

\`\`\`
src/app/(app)/        authenticated shell, bottom nav + Home/Plan/Transactions/Insights/Profile
src/app/sign-in/       sign-in & sign-up pages
src/app/api/plaid/     Plaid Link token, token exchange, transaction sync
src/app/api/register/  account creation
src/auth.ts            Auth.js config (credentials provider)
prisma/schema.prisma   User, PlaidItem, FinancialAccount, Category, Transaction
\`\`\`

## Next steps toward iOS

This is a responsive web app on purpose, built to validate the product fast without native tooling. Two paths forward:

- **Fastest**: wrap it with [Capacitor](https://capacitorjs.com) to ship as a real iOS app while reusing this whole codebase.
- **Native rebuild**: once the product is proven, a SwiftUI rebuild can reuse this Prisma schema and API routes as-is, they're just JSON endpoints.
