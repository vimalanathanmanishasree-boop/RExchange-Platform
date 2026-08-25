import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { messages, listings, users } from "../../db/schema.js";
import { eq, or, desc } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

// Returns a summary of distinct conversation threads for the current user.
export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);

  const rows = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, session.uid), eq(messages.recipientId, session.uid)))
    .orderBy(desc(messages.createdAt));

  const seen = new Set<string>();
  const threads: { listingId: number; withUserId: number; lastMessage: string; createdAt: Date }[] = [];
  for (const m of rows) {
    const other = m.senderId === session.uid ? m.recipientId : m.senderId;
    const key = `${m.listingId}-${other}`;
    if (seen.has(key)) continue;
    seen.add(key);
    threads.push({ listingId: m.listingId, withUserId: other, lastMessage: m.body, createdAt: m.createdAt });
  }

  const listingIds = [...new Set(threads.map((t) => t.listingId))];
  const userIds = [...new Set(threads.map((t) => t.withUserId))];
  const allListings = listingIds.length ? await db.select().from(listings) : [];
  const allUsers = userIds.length ? await db.select().from(users) : [];
  const listingMap = new Map(allListings.map((l) => [l.id, l.title]));
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

  return json({
    threads: threads.map((t) => ({
      ...t,
      listingTitle: listingMap.get(t.listingId) || "Listing",
      withUserName: userMap.get(t.withUserId) || "User",
    })),
  });
};

export const config: Config = { path: "/api/messages/threads" };
