import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users, allowedDomains, listings } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

async function requireAdmin(req: Request) {
  const session = requireSession(req);
  if (!session) return null;
  const [me] = await db.select().from(users).where(eq(users.id, session.uid));
  if (!me || me.role !== "admin") return null;
  return me;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") || "domains";
  const admin = await requireAdmin(req);
  if (!admin) return errorJson("Forbidden", 403);

  if (resource === "domains") {
    if (req.method === "GET") {
      const rows = await db.select().from(allowedDomains);
      return json({ domains: rows });
    }
    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      const domain = (body as any)?.domain?.toLowerCase().trim();
      if (!domain) return errorJson("domain is required");
      const [created] = await db.insert(allowedDomains).values({ domain, addedBy: admin.id }).returning();
      return json({ domain: created }, { status: 201 });
    }
    if (req.method === "DELETE") {
      const id = Number(url.searchParams.get("id"));
      if (!id) return errorJson("id is required");
      await db.delete(allowedDomains).where(eq(allowedDomains.id, id));
      return json({ ok: true });
    }
  }

  if (resource === "users") {
    if (req.method === "GET") {
      const rows = await db.select().from(users).orderBy(desc(users.createdAt));
      return json({ users: rows.map(({ passwordHash, ...u }) => u) });
    }
    if (req.method === "PATCH") {
      const id = Number(url.searchParams.get("id"));
      const body = await req.json().catch(() => null);
      const role = (body as any)?.role;
      if (!id || !["student", "admin"].includes(role)) return errorJson("Invalid request");
      const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
      const { passwordHash, ...safe } = updated;
      return json({ user: safe });
    }
  }

  if (resource === "listings") {
    if (req.method === "GET") {
      const rows = await db.select().from(listings).orderBy(desc(listings.createdAt));
      return json({ listings: rows });
    }
    if (req.method === "DELETE") {
      const id = Number(url.searchParams.get("id"));
      if (!id) return errorJson("id is required");
      await db.delete(listings).where(eq(listings.id, id));
      return json({ ok: true });
    }
  }

  return errorJson("Unsupported resource/method", 405);
};

export const config: Config = { path: "/api/admin" };
