import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { listings, listingUpvotes } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);
  if (req.method !== "POST") return errorJson("Method not allowed", 405);

  const body = await req.json().catch(() => null);
  const listingId = Number((body as any)?.listingId);
  if (!listingId) return errorJson("listingId is required");

  const [existingVote] = await db
    .select()
    .from(listingUpvotes)
    .where(and(eq(listingUpvotes.listingId, listingId), eq(listingUpvotes.userId, session.uid)));

  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
  if (!listing) return errorJson("Listing not found", 404);

  if (existingVote) {
    await db.delete(listingUpvotes).where(eq(listingUpvotes.id, existingVote.id));
    const [updated] = await db
      .update(listings)
      .set({ upvotes: Math.max(0, listing.upvotes - 1) })
      .where(eq(listings.id, listingId))
      .returning();
    return json({ upvoted: false, upvotes: updated.upvotes });
  }

  await db.insert(listingUpvotes).values({ listingId, userId: session.uid });
  const [updated] = await db
    .update(listings)
    .set({ upvotes: listing.upvotes + 1 })
    .where(eq(listings.id, listingId))
    .returning();
  return json({ upvoted: true, upvotes: updated.upvotes });
};

export const config: Config = { path: "/api/listings/upvote" };
