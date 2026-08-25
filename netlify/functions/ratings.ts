import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { ratings, exchanges, users } from "../../db/schema.js";
import { eq, and, avg, count } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const userId = Number(url.searchParams.get("userId"));
    if (!userId) return errorJson("userId is required");
    const rows = await db.select().from(ratings).where(eq(ratings.rateeId, userId));
    const avgStars = rows.length ? rows.reduce((s, r) => s + r.stars, 0) / rows.length : null;
    return json({ ratings: rows, average: avgStars, count: rows.length });
  }

  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);
  if (req.method !== "POST") return errorJson("Method not allowed", 405);

  const body = await req.json().catch(() => null);
  const { exchangeId, stars, review } = (body || {}) as Record<string, unknown>;
  if (!exchangeId || !stars) return errorJson("exchangeId and stars are required");
  const starsNum = Number(stars);
  if (starsNum < 1 || starsNum > 5) return errorJson("stars must be between 1 and 5");

  const [exchange] = await db.select().from(exchanges).where(eq(exchanges.id, Number(exchangeId)));
  if (!exchange) return errorJson("Exchange not found", 404);
  if (exchange.status !== "Completed") return errorJson("Exchange is not completed yet");
  if (exchange.requesterId !== session.uid && exchange.ownerId !== session.uid) {
    return errorJson("Forbidden", 403);
  }
  const rateeId = exchange.requesterId === session.uid ? exchange.ownerId : exchange.requesterId;

  const [existing] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.exchangeId, exchange.id), eq(ratings.raterId, session.uid)));
  if (existing) return errorJson("You already rated this exchange", 409);

  const [created] = await db
    .insert(ratings)
    .values({ exchangeId: exchange.id, raterId: session.uid, rateeId, stars: starsNum, review: (review as string) || "" })
    .returning();

  return json({ rating: created }, { status: 201 });
};

export const config: Config = { path: "/api/ratings" };
