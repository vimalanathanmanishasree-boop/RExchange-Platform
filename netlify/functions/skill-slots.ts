import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { skillSlots, listings } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

export default async (req: Request) => {
  const url = new URL(req.url);
  const session = requireSession(req);

  if (req.method === "GET") {
    const listingId = Number(url.searchParams.get("listingId"));
    if (!listingId) return errorJson("listingId is required");
    const rows = await db.select().from(skillSlots).where(eq(skillSlots.listingId, listingId));
    return json({ slots: rows });
  }

  if (!session) return errorJson("Not authenticated", 401);

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const { listingId, startsAt, durationMinutes } = (body || {}) as Record<string, unknown>;
    if (!listingId || !startsAt) return errorJson("listingId and startsAt are required");
    const [listing] = await db.select().from(listings).where(eq(listings.id, Number(listingId)));
    if (!listing) return errorJson("Listing not found", 404);
    if (listing.ownerId !== session.uid) return errorJson("Only the listing owner can add slots", 403);

    const [slot] = await db
      .insert(skillSlots)
      .values({
        listingId: Number(listingId),
        hostId: session.uid,
        startsAt: new Date(startsAt as string),
        durationMinutes: Number(durationMinutes) || 30,
      })
      .returning();
    return json({ slot }, { status: 201 });
  }

  if (req.method === "PATCH") {
    const id = Number(url.searchParams.get("id"));
    if (!id) return errorJson("id is required");
    const [slot] = await db.select().from(skillSlots).where(eq(skillSlots.id, id));
    if (!slot) return errorJson("Slot not found", 404);
    if (slot.bookedById) return errorJson("Slot already booked", 409);
    const [updated] = await db.update(skillSlots).set({ bookedById: session.uid }).where(eq(skillSlots.id, id)).returning();
    return json({ slot: updated });
  }

  return errorJson("Method not allowed", 405);
};

export const config: Config = { path: "/api/skill-slots" };
