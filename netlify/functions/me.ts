import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);
  const [user] = await db.select().from(users).where(eq(users.id, session.uid));
  if (!user) return errorJson("User not found", 404);
  const { passwordHash, ...safe } = user;
  return json({ user: safe });
};

export const config: Config = { path: "/api/me" };
