import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { exchanges, listings, users } from "../../db/schema.js";
import { eq, or, and, desc } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);
  const url = new URL(req.url);

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(exchanges)
      .where(or(eq(exchanges.requesterId, session.uid), eq(exchanges.ownerId, session.uid)))
      .orderBy(desc(exchanges.createdAt));

    const listingIds = [...new Set(rows.map((r) => r.listingId))];
    const userIds = [...new Set(rows.flatMap((r) => [r.requesterId, r.ownerId]))];
    const allListings = listingIds.length ? await db.select().from(listings) : [];
    const allUsers = userIds.length ? await db.select().from(users) : [];
    const listingMap = new Map(allListings.map((l) => [l.id, l]));
    const userMap = new Map(allUsers.map((u) => [u.id, { id: u.id, name: u.name, karma: u.karma }]));

    return json({
      exchanges: rows.map((r) => ({
        ...r,
        listing: listingMap.get(r.listingId) || null,
        requester: userMap.get(r.requesterId) || null,
        owner: userMap.get(r.ownerId) || null,
      })),
    });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const listingId = Number((body as any)?.listingId);
    if (!listingId) return errorJson("listingId is required");
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
    if (!listing) return errorJson("Listing not found", 404);
    if (listing.ownerId === session.uid) return errorJson("You cannot request your own listing");
    if (listing.status !== "Active") return errorJson("Listing is not active");

    const [exchange] = await db
      .insert(exchanges)
      .values({ listingId, requesterId: session.uid, ownerId: listing.ownerId, status: "Requested" })
      .returning();
    await db.update(listings).set({ status: "Pending Exchange" }).where(eq(listings.id, listingId));
    return json({ exchange }, { status: 201 });
  }

  if (req.method === "PATCH") {
    const idParam = url.searchParams.get("id");
    if (!idParam) return errorJson("id is required");
    const [exchange] = await db.select().from(exchanges).where(eq(exchanges.id, Number(idParam)));
    if (!exchange) return errorJson("Exchange not found", 404);
    if (exchange.requesterId !== session.uid && exchange.ownerId !== session.uid) {
      return errorJson("Forbidden", 403);
    }

    const body = await req.json().catch(() => null);
    const action = (body as any)?.action as string;
    const [listing] = await db.select().from(listings).where(eq(listings.id, exchange.listingId));

    if (action === "accept" && exchange.ownerId === session.uid) {
      const [updated] = await db
        .update(exchanges)
        .set({ status: "Pending" })
        .where(eq(exchanges.id, exchange.id))
        .returning();
      return json({ exchange: updated });
    }

    if (action === "reject" && exchange.ownerId === session.uid) {
      const [updated] = await db
        .update(exchanges)
        .set({ status: "Rejected" })
        .where(eq(exchanges.id, exchange.id))
        .returning();
      if (listing) await db.update(listings).set({ status: "Active" }).where(eq(listings.id, listing.id));
      return json({ exchange: updated });
    }

    if (action === "cancel") {
      const [updated] = await db
        .update(exchanges)
        .set({ status: "Cancelled" })
        .where(eq(exchanges.id, exchange.id))
        .returning();
      if (listing) await db.update(listings).set({ status: "Active" }).where(eq(listings.id, listing.id));
      return json({ exchange: updated });
    }

    if (action === "complete" && exchange.ownerId === session.uid) {
      const karma = listing?.karmaValue || 0;
      const [updated] = await db
        .update(exchanges)
        .set({ status: "Completed", karmaAwarded: karma, completedAt: new Date() })
        .where(eq(exchanges.id, exchange.id))
        .returning();
      if (listing) await db.update(listings).set({ status: "Completed" }).where(eq(listings.id, listing.id));

      // Karma flows both ways: requester gains the listing's karma value (acquiring value),
      // owner gains a flat completion bonus (rewarding successful, trustworthy exchanges).
      if (karma > 0) {
        const [requesterUser] = await db.select().from(users).where(eq(users.id, exchange.requesterId));
        if (requesterUser) {
          await db
            .update(users)
            .set({ karma: requesterUser.karma + karma })
            .where(eq(users.id, exchange.requesterId));
        }
      }
      const [ownerUser] = await db.select().from(users).where(eq(users.id, exchange.ownerId));
      if (ownerUser) {
        await db.update(users).set({ karma: ownerUser.karma + 5 }).where(eq(users.id, exchange.ownerId));
      }

      return json({ exchange: updated });
    }

    if (action === "reveal") {
      const field = exchange.requesterId === session.uid ? "requesterRevealed" : "ownerRevealed";
      const [updated] = await db
        .update(exchanges)
        .set({ [field]: true } as any)
        .where(eq(exchanges.id, exchange.id))
        .returning();
      return json({ exchange: updated });
    }

    return errorJson("Unsupported action");
  }

  return errorJson("Method not allowed", 405);
};

export const config: Config = { path: "/api/exchanges" };
