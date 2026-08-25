import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { messages, listings, users, exchanges } from "../../db/schema.js";
import { eq, and, or, asc } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

// Polling-based chat (see README for rationale). Client polls this endpoint every few seconds.
export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);
  const url = new URL(req.url);

  if (req.method === "GET") {
    const listingId = Number(url.searchParams.get("listingId"));
    const withUserId = Number(url.searchParams.get("withUserId"));
    if (!listingId || !withUserId) return errorJson("listingId and withUserId are required");

    const rows = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.listingId, listingId),
          or(
            and(eq(messages.senderId, session.uid), eq(messages.recipientId, withUserId)),
            and(eq(messages.senderId, withUserId), eq(messages.recipientId, session.uid))
          )
        )
      )
      .orderBy(asc(messages.createdAt));

    // Contact info revealed only if an exchange between the two parties on this listing has both reveal flags set.
    const [exchange] = await db
      .select()
      .from(exchanges)
      .where(
        and(
          eq(exchanges.listingId, listingId),
          or(
            and(eq(exchanges.requesterId, session.uid), eq(exchanges.ownerId, withUserId)),
            and(eq(exchanges.requesterId, withUserId), eq(exchanges.ownerId, session.uid))
          )
        )
      );

    let contactRevealed = false;
    let contactEmail: string | null = null;
    if (exchange && exchange.requesterRevealed && exchange.ownerRevealed) {
      contactRevealed = true;
      const [otherUser] = await db.select().from(users).where(eq(users.id, withUserId));
      contactEmail = otherUser?.email || null;
    }

    return json({ messages: rows, contactRevealed, contactEmail, exchangeId: exchange?.id || null });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const { listingId, recipientId, body: text } = (body || {}) as Record<string, unknown>;
    if (!listingId || !recipientId || !text) return errorJson("listingId, recipientId, and body are required");
    const [listing] = await db.select().from(listings).where(eq(listings.id, Number(listingId)));
    if (!listing) return errorJson("Listing not found", 404);

    const [msg] = await db
      .insert(messages)
      .values({
        listingId: Number(listingId),
        senderId: session.uid,
        recipientId: Number(recipientId),
        body: String(text).slice(0, 2000),
      })
      .returning();
    return json({ message: msg }, { status: 201 });
  }

  return errorJson("Method not allowed", 405);
};

export const config: Config = { path: "/api/messages" };
