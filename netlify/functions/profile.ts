import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);
  if (req.method !== "PUT" && req.method !== "PATCH") return errorJson("Method not allowed", 405);

  const body = await req.json().catch(() => null);
  if (!body) return errorJson("Invalid JSON body");
  const { name, department, year, hostelBlock, bio, photoKey } = body as Record<string, string | undefined>;

  const updates: Record<string, string> = {};
  if (name !== undefined) updates.name = name;
  if (department !== undefined) updates.department = department;
  if (year !== undefined) updates.year = year;
  if (hostelBlock !== undefined) updates.hostelBlock = hostelBlock;
  if (bio !== undefined) updates.bio = bio;
  if (photoKey !== undefined) updates.photoKey = photoKey;

  const [updated] = await db.update(users).set(updates).where(eq(users.id, session.uid)).returning();
  const { passwordHash, ...safe } = updated;
  return json({ user: safe });
};

export const config: Config = { path: "/api/profile" };
