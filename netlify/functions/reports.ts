import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { reports, users } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);

  if (req.method === "GET") {
    const [me] = await db.select().from(users).where(eq(users.id, session.uid));
    if (!me || me.role !== "admin") return errorJson("Forbidden", 403);
    const rows = await db.select().from(reports).orderBy(desc(reports.createdAt));
    return json({ reports: rows });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const { targetType, targetId, reason } = (body || {}) as Record<string, unknown>;
    if (!targetType || !targetId || !reason) return errorJson("targetType, targetId, and reason are required");
    const [created] = await db
      .insert(reports)
      .values({
        reporterId: session.uid,
        targetType: String(targetType),
        targetId: Number(targetId),
        reason: String(reason).slice(0, 1000),
      })
      .returning();
    return json({ report: created }, { status: 201 });
  }

  if (req.method === "PATCH") {
    const [me] = await db.select().from(users).where(eq(users.id, session.uid));
    if (!me || me.role !== "admin") return errorJson("Forbidden", 403);
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) return errorJson("id is required");
    const body = await req.json().catch(() => null);
    const status = (body as any)?.status;
    if (!["Open", "Reviewed", "Dismissed", "Actioned"].includes(status)) return errorJson("Invalid status");
    const [updated] = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
    return json({ report: updated });
  }

  return errorJson("Method not allowed", 405);
};

export const config: Config = { path: "/api/reports" };
