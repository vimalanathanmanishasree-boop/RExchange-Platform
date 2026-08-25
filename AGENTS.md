# AGENTS.md

Architecture notes for anyone (human or agent) picking this codebase back up.

## Stack shape

- Vite + React (TypeScript) frontend in `src/`
- One Netlify Function per API route in `netlify/functions/*.ts` (each exports a `default`
  handler and a `config` with an explicit `path`, so routes don't depend on filename
  guessing)
- Shared server helpers in `netlify/lib/auth.ts` (JWT signing/verification, password hashing,
  cookie helpers, small `json`/`errorJson` response wrappers)
- Drizzle ORM schema in `db/schema.ts`, client in `db/index.ts`, migrations generated into
  `netlify/database/migrations/` (never write raw SQL migrations by hand while Drizzle is in
  use — regenerate with `npx drizzle-kit generate --name ...` after editing the schema)
- `netlify/scripts/seed.ts` populates demo users, listings, a couple of completed exchanges
  with ratings, and one pending exchange, so the app has visible activity immediately after
  a fresh deploy. Run with `npx tsx netlify/scripts/seed.ts`.

## Why custom auth instead of Netlify Identity

Netlify Identity is deprecated for new projects. Auth here is hand-rolled: bcrypt-hashed
passwords in the `users` table, a signed JWT (`netlify/lib/auth.ts`) stored in an HTTP-only
`rexchange_session` cookie, and a college-email-domain whitelist enforced at signup
(`allowed_domains` table, editable by admins via `/api/admin?resource=domains`). Signup also
requires OTP verification before the account is usable for anything beyond signing up (see
`users.verified`).

OTP codes live in the `otp_codes` table with an expiry and a `consumed` flag rather than a
one-shot in-memory cache, specifically so they survive across the serverless function's cold
starts and so multiple functions/instances agree on whether a code was already used.

## Why polling chat instead of WebSockets

Netlify Functions are invoked per-request and don't hold long-lived connections, so a real
Socket.io/WebSocket server isn't a natural fit. `netlify/functions/messages.ts` is a plain
REST endpoint; the listing detail page (`src/pages/ListingDetail.tsx`) polls it every 4
seconds with `setInterval`. This is "real-time enough" for a campus marketplace chat and
avoids standing up separate infrastructure (e.g. a persistent WebSocket gateway) that Netlify
doesn't provide out of the box.

## Contact reveal mechanism

Contact info (email) is never shown in chat by default. Each `exchanges` row has
`requesterRevealed` and `ownerRevealed` booleans. Either party can flip their own flag via
`PATCH /api/exchanges?id=..&action=reveal`. `GET /api/messages` only returns the other party's
email once *both* flags are true for the matching exchange — this is enforced server-side, not
just hidden in the UI, so it can't be bypassed by inspecting API responses.

## Karma flow

On `PATCH /api/exchanges?id=..&action=complete` (owner-only): the exchange is marked
`Completed`, the *requester* receives karma equal to the listing's `karmaValue` (they are
"acquiring value"), and the *owner* receives a flat +5 completion bonus (rewarding reliable,
completed trades regardless of item value). This is intentionally simple — see README's
"Known limitations" for what's not modeled (decay, anti-gaming, rating-weighted karma).

## Recommendation logic

`GET /api/listings?sort=relevant` (used as the Feed's default sort) boosts listings whose
owner shares the viewer's department or year, plus a small boost from upvote count. It's a
deliberately simple heuristic, not a ranking model — swap the scoring block in
`netlify/functions/listings.ts` if this needs to get smarter later.

## Media storage

All uploaded images (listing photos, profile photos) go into a single Netlify Blobs store,
`rexchange-media`, keyed by `listings/<userId>-<uuid>.<ext>` or `profiles/<userId>-<uuid>.<ext>`.
Only the blob *key* is stored in Postgres (`listings.photoKeys`, `users.photoKey`); the actual
bytes live in Blobs and are served back through `GET /api/media?key=...`, which streams the
blob with its stored content-type. Uploads are accepted as base64 JSON (see `upload.ts`)
rather than multipart form data, to keep the function handler simple — this caps practical
upload size below Blobs' 5GB limit (the function itself rejects payloads over ~6MB).

## Notes Vault / Ticket SOS / Skill Swap (stretch features)

These reuse the core `listings` table rather than new tables, to avoid duplicating
CRUD/search/moderation logic:

- **Notes Vault**: listings with `category = "Notes & Study Material"` carry an optional
  `subjectCode` column and can be upvoted (`listing_upvotes` table, one vote per user per
  listing, toggled via `POST /api/listings/upvote`). The Feed's search/filter already covers
  querying by subject code.
- **Ticket SOS**: no separate boosting job — the Feed page and `ListingCard` component simply
  flag any `Event Tickets` listing whose `expiryDate` is within 48 hours as urgent
  client-side, and the Feed shows a banner when any exist.
- **Skill Swap**: a small `skill_slots` table (`hostId`, `startsAt`, `durationMinutes`,
  `bookedById`) tied to a listing, exposed via `/api/skill-slots`. Deliberately a flat slot
  list, not a calendar.

## What would need to change for a real deployment

- Wire a real email provider (SendGrid/Postmark/etc.) into `auth-signup.ts` for OTP delivery,
  and stop returning `devOtp` in the response.
- Move the JWT secret (`JWT_SECRET`) into a real secret manager / Netlify environment
  variable in production (a fallback dev secret is used if unset — fine for local dev, not for
  production).
- Consider multipart uploads directly to Blobs for larger files instead of base64 JSON.
