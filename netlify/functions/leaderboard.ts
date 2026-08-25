import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users, exchanges } from "../../db/schema.js";
import { gte } from "drizzle-orm";
import { json } from "../lib/auth.js";

export default async (req: Request) => {
  const url = new URL(req.url);
  const groupBy = url.searchParams.get("groupBy") || "department"; // department | hostelBlock
  const windowDays = Number(url.searchParams.get("windowDays") || "30");

  const allUsers = await db.select().from(users);
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const recentExchanges = await db.select().from(exchanges).where(gte(exchanges.createdAt, since));

  const recentKarmaByUser = new Map<number, number>();
  for (const ex of recentExchanges) {
    if (ex.status === "Completed") {
      recentKarmaByUser.set(ex.requesterId, (recentKarmaByUser.get(ex.requesterId) || 0) + ex.karmaAwarded);
      recentKarmaByUser.set(ex.ownerId, (recentKarmaByUser.get(ex.ownerId) || 0) + 5);
    }
  }

  const individualLeaders = [...allUsers]
    .sort((a, b) => b.karma - a.karma)
    .slice(0, 20)
    .map((u) => ({
      id: u.id,
      name: u.name,
      department: u.department,
      hostelBlock: u.hostelBlock,
      karma: u.karma,
      recentKarma: recentKarmaByUser.get(u.id) || 0,
    }));

  const groupField = groupBy === "hostelBlock" ? "hostelBlock" : "department";
  const groupTotals = new Map<string, { total: number; count: number }>();
  for (const u of allUsers) {
    const key = (u as any)[groupField] || "Unassigned";
    const entry = groupTotals.get(key) || { total: 0, count: 0 };
    entry.total += u.karma;
    entry.count += 1;
    groupTotals.set(key, entry);
  }
  const groupLeaders = [...groupTotals.entries()]
    .map(([name, v]) => ({ name, totalKarma: v.total, members: v.count, avgKarma: Math.round(v.total / v.count) }))
    .sort((a, b) => b.totalKarma - a.totalKarma);

  return json({ individualLeaders, groupLeaders, groupBy: groupField, windowDays });
};

export const config: Config = { path: "/api/leaderboard" };
