import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users, listings, exchanges, ratings } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { json } from "../lib/auth.js";

export default async () => {
  const allUsers = await db.select().from(users);
  const allListings = await db.select().from(listings);
  const allExchanges = await db.select().from(exchanges);
  const allRatings = await db.select().from(ratings);

  const completed = allExchanges.filter((e) => e.status === "Completed");
  const byCategory = new Map<string, number>();
  for (const l of allListings) {
    byCategory.set(l.category, (byCategory.get(l.category) || 0) + 1);
  }

  const byMode = new Map<string, number>();
  for (const l of allListings) {
    for (const m of (l.exchangeModes as string[]) || []) {
      byMode.set(m, (byMode.get(m) || 0) + 1);
    }
  }

  const monthly = new Map<string, number>();
  for (const e of completed) {
    if (!e.completedAt) continue;
    const key = new Date(e.completedAt).toISOString().slice(0, 7);
    monthly.set(key, (monthly.get(key) || 0) + 1);
  }

  const totalKarmaCirculated = completed.reduce((s, e) => s + e.karmaAwarded + 5, 0);
  const avgRating = allRatings.length
    ? Math.round((allRatings.reduce((s, r) => s + r.stars, 0) / allRatings.length) * 10) / 10
    : null;

  return json({
    totals: {
      users: allUsers.length,
      verifiedUsers: allUsers.filter((u) => u.verified).length,
      listings: allListings.length,
      activeListings: allListings.filter((l) => l.status === "Active").length,
      exchangesCompleted: completed.length,
      itemsReused: completed.length,
      totalKarmaCirculated,
      avgRating,
    },
    byCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
    byMode: [...byMode.entries()].map(([mode, count]) => ({ mode, count })),
    monthlyCompletions: [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
  });
};

export const config: Config = { path: "/api/dashboard" };
