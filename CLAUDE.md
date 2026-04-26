# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

Dairy management app replacing a physical milk card system. A single dairy owner (User) manages Customers who buy milk bags daily. Purchases are recorded by the owner scanning a customer QR code. Monthly billing is tracked via Ledgers. Customers get a public URL with their QR code and purchase calendar — no login required.

## Build Status

| Phase | Status |
|---|---|
| Local dev setup (Next.js, Postgres via Docker, Prisma, dependencies) | Done |
| Prisma schema + migrations + seed | Done |
| NextAuth credentials auth + middleware + login page | Done |
| API routes (customers, purchases, ledgers, scan, customer-profile) | Done |
| Owner UI (dashboard, record sale, customer list, ledger view) | Done |
| Customer portal (public QR page, calendar, profile editor) | Done |
| Month rollover cron job | Next |
| Production deploy (Neon + Vercel) | Pending |

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database — creates the one owner account
```

Prisma commands:
```bash
npx prisma generate     # Generate Prisma client (auto-runs on postinstall)
npx prisma db push      # Push schema changes without migration
npx prisma migrate dev  # Create and apply migration
npx prisma studio       # Open database GUI at localhost:5555
```

## Architecture

### Auth

- NextAuth v4 with Credentials provider
- Session strategy: JWT
- Config: `src/lib/auth.ts`
- Session helpers: `src/lib/session.ts` (`getCurrentUser()`, `getSession()`)
- Route handler: `src/app/api/auth/[...nextauth]/route.ts`
- Login page: `src/app/login/page.tsx`
- Middleware: `middleware.ts` (project root) — protects all `/dashboard` routes

**Single owner design:** There is no signup page. The one owner account is created via `npm run seed`. If the owner needs their password changed, update `prisma/seed.ts` and re-seed.

**Login flow:** Owner visits `/dashboard` → middleware redirects to `/login` if no session → owner enters email + password → NextAuth verifies against `User.passwordHash` (bcrypt) → JWT session issued → redirected to `/dashboard`.

**Customer auth:** Customers have no login. Their URL (`/customer/[qrId]`) is their identity. The `qrId` UUID in the URL is unguessable — security by obscurity, same model as "anyone with the link can view" Google Docs sharing.

### Database

- Prisma 7.x with PostgreSQL via `@prisma/adapter-pg`
- Client output: `src/generated/prisma/` (import from `@/generated/prisma/client`)
- Singleton: `src/lib/prisma.ts`
- Local dev: PostgreSQL running in Docker on port 5432

### Data Model

```
User (dairy owner — single account, created by seed only)
  ├── email, passwordHash, name, dairyName, pricePerBag
  └── customers: Customer[]

Customer (created by owner, never self-registered)
  ├── id        — internal DB primary key, never in URLs
  ├── qrId      — UUID encoded in QR and customer URL, regeneratable
  ├── name, phone, address, usualBags
  ├── isActive, isSuspended
  ├── ledgers: Ledger[]
  └── purchases: Purchase[]

Ledger (one per customer per month — enforced by unique constraint)
  ├── month     — "YYYY-MM" string, always this format
  ├── totalBags, amountDue
  ├── isPaid, paidAt
  └── purchases: Purchase[]

Purchase (one per day per customer — updated if same-day duplicate)
  ├── date      — the actual purchase date (not recordedAt)
  ├── bags
  ├── customerId, ledgerId
  └── recordedAt
```

### Key Domain Concepts

- `User.dairyName` — name of the dairy business
- `User.pricePerBag` — read at purchase time, not display time, so historical ledgers keep the price they were created with
- `Customer.id` — internal DB key, never exposed in URLs or QR codes
- `Customer.qrId` — public identifier encoded in QR and URL; regenerating it invalidates the old QR without touching purchase history
- `Customer.usualBags` — soft default shown to owner, not enforced
- `Customer.isSuspended` — if true, customer URL shows suspended screen and owner scanner rejects the QR
- `Ledger.month` — always `"YYYY-MM"` (e.g. `"2026-04"`), never a Date object
- `Purchase.bags` — if a purchase already exists for today, increment it rather than inserting a second row

## Critical Conventions

### Ownership check — required on every owner API route

Never trust a `customerId` from the request body. Always verify the customer belongs to the logged-in owner:

```ts
const session = await getCurrentUser()
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

const customer = await prisma.customer.findFirst({
  where: { id: customerId, userId: session.id }
})
if (!customer) return Response.json({ error: 'Not found' }, { status: 404 })
```

### Purchase recording — always use a transaction

Creating a purchase must atomically update the parent ledger. Never do these as separate calls:

```ts
await prisma.$transaction([
  prisma.purchase.create({ data: { ... } }),
  prisma.ledger.update({
    where: { id: ledgerId },
    data: {
      totalBags: { increment: bags },
      amountDue: { increment: bags * pricePerBag }
    }
  })
])
```

### Ledger upsert — always, never assume it exists

The current month ledger may not exist yet (first purchase of the month before cron has run):

```ts
const ledger = await prisma.ledger.upsert({
  where: { customerId_month: { customerId, month: currentMonth() } },
  create: { customerId, month: currentMonth(), totalBags: 0, amountDue: 0 },
  update: {}
})
```

### Same-day duplicate prevention

Before creating a purchase, check if one already exists for today. If yes, update bags instead of inserting a new row:

```ts
const today = new Date()
today.setHours(0, 0, 0, 0)
const existing = await prisma.purchase.findFirst({
  where: { customerId, date: { gte: today } }
})
// if exists → update, else → create (inside a $transaction either way)
```

### Month format helper

Always use the helper, never construct the month string inline:

```ts
// src/lib/utils.ts
export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret for JWT signing (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — app URL (`http://localhost:3000` in dev)

Added before production deploy:
- `CRON_SECRET` — secures the month rollover cron endpoint

## API Routes

All owner routes require a valid session. All `/api/customer-profile/*` routes are intentionally public.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/customers` | Owner | List all customers with current month ledger |
| POST | `/api/customers` | Owner | Create customer, auto-generate qrId |
| PATCH | `/api/customers/[id]` | Owner | Update details or toggle suspension |
| PATCH | `/api/customers/[id]/regenerate-qr` | Owner | Issue new qrId |
| POST | `/api/purchases` | Owner | Record a purchase (transaction required) |
| GET | `/api/ledgers` | Owner | List all ledgers with filters |
| GET | `/api/ledgers/[id]` | Owner | Ledger + all purchases for that month |
| PATCH | `/api/ledgers/[id]` | Owner | Mark as paid / unpaid |
| GET | `/api/scan/[qrId]` | Owner | Look up customer by QR for scanner UI |
| GET | `/api/customer-profile/[qrId]` | Public | Customer data + current ledger |
| PATCH | `/api/customer-profile/[qrId]` | Public | Customer updates their own profile |
| PATCH | `/api/customer-profile/[qrId]/regenerate-qr` | Public | Customer regenerates their own QR |
| GET | `/api/cron/month-rollover` | Cron secret | Create new ledgers for all active customers |

## What NOT to Do

- Never expose `customer.id` in URLs — only use `customer.qrId`
- Never skip the ownership check (`userId: session.id`) in owner API routes
- Never create a `Purchase` without updating its parent `Ledger` in the same `$transaction`
- Never hardcode price per bag — always read from `user.pricePerBag`
- Never use `prisma migrate deploy` in development — use `prisma migrate dev`
- Never commit `.env` to git
- Never instantiate `new PrismaClient()` outside `src/lib/prisma.ts`
