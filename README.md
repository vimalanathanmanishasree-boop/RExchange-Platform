# RExchange

RExchange is a trust-driven, gamified resource-exchange marketplace for verified college
students. Students trade textbooks, electronics, event tickets, notes, skills, and odds
and ends with each other — via barter, karma points, free giveaway, or manually-confirmed
paid resale — and build a karma score and rating history as they trade.

## Tech stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS (React Router for navigation)
- **Backend**: Netlify Functions (TypeScript, one function per route)
- **Database**: Netlify Database (managed Postgres) via Drizzle ORM — schema in `db/schema.ts`,
  migrations in `netlify/database/migrations/`
- **File storage**: Netlify Blobs for listing photos and profile photos (`rexchange-media` store)
- **Auth**: Custom email/password + OTP verification, JWT held in an HTTP-only cookie
  (no Netlify Identity — see AGENTS.md for why)
- **Charts**: Recharts, for the Impact Dashboard

## Running locally

```bash
npm install
netlify dev
```

`netlify dev` wires up Netlify Functions, Netlify Database, and Netlify Blobs locally. Running
plain `vite` will serve the frontend but API calls to `/api/*` will fail without the Netlify
dev proxy.

To (re-)seed demo data against your local/preview database branch:

```bash
npx tsx netlify/scripts/seed.ts
```

The seed script is idempotent for users (uses `onConflictDoNothing`) but will duplicate
listings/exchanges if run more than once — intended for a fresh branch.

## Demo accounts

All seeded accounts are pre-verified (no OTP needed for these). Signing up a *new* account
still goes through the OTP flow described below.

| Email | Password | Role |
|---|---|---|
| `asha.verma@greyfriars.edu` | `Campus#2026` | Student (Computer Science) |
| `noor.fatima@greyfriars.edu` | `Campus#2026` | Student (Economics, top karma) |
| `devraj.iyer@greyfriars.edu` | `Campus#2026` | Student (Mechanical Engineering) |
| `admin@greyfriars.edu` | `AdminKarma#1` | Admin |

The whitelisted signup domain for new accounts is `greyfriars.edu` (configurable by an admin
under **Admin → domains**).

## Known limitations (read before demoing)

- **OTP delivery is dev-mode only.** No email service (SendGrid/Postmark/etc.) is wired up.
  When you sign up, the 6-digit OTP is returned directly in the API response and logged to
  the function's console output — it is shown on-screen in the "verify your email" step
  instead of arriving by email. Wiring a real provider would mean adding an API key as an
  environment variable and sending from `netlify/functions/auth-signup.ts`.
- **Chat is polling-based, not WebSocket.** True WebSocket infrastructure doesn't fit
  Netlify's serverless Functions model. The listing chat polls `/api/messages` every 4
  seconds. Functional, but not instant — there can be a few seconds of lag between a message
  being sent and appearing for the other party.
- **No payment gateway.** "Paid Resale" is manual-confirmation only: buyer and seller agree on
  a price and hand off in person; RExchange never touches money and does not verify payment.
- **Karma math is intentionally simple**: the requester of a completed exchange receives the
  listing's karma value, and the owner receives a flat +5 completion bonus. There's no decay,
  no anti-gaming detection, and no weighting by rating quality yet.
- **Image uploads go through a JSON base64 endpoint** (`/api/upload`), not multipart form
  data, to keep the Netlify Function simple. This caps practical upload size well under the
  5 GB Blobs limit (rejected above ~6MB by the function itself).
- **Skill Swap slot booking** is a flat list of time slots per listing, not a calendar UI.

## Project structure

See `AGENTS.md` for architecture notes, directory layout, and the reasoning behind the
non-obvious decisions (custom auth, polling chat, karma flow, etc).
