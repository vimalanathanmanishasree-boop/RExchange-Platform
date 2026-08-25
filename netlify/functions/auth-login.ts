import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { json, errorJson, comparePassword, signSession, sessionCookie } from "../lib/auth.js";

export default async (req: Request) => {
  if (req.method !== "POST") return errorJson("Method not allowed", 405);
  const body = await req.json().catch(() => null);
  if (!body) return errorJson("Invalid JSON body");
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) return errorJson("Email and password are required");

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (!user) return errorJson("Invalid credentials", 401);

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return errorJson("Invalid credentials", 401);

  if (!user.verified) {
    return errorJson("Account not verified. Please complete OTP verification first.", 403);
  }

  const token = signSession({ uid: user.id, email: user.email, role: user.role });
  return json(
    {
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        karma: user.karma,
      },
    },
    { headers: { "Set-Cookie": sessionCookie(token) } }
  );
};

export const config: Config = { path: "/api/auth/login" };
