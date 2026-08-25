import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users, otpCodes } from "../../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { json, errorJson, signSession, sessionCookie } from "../lib/auth.js";

export default async (req: Request) => {
  if (req.method !== "POST") return errorJson("Method not allowed", 405);
  const body = await req.json().catch(() => null);
  if (!body) return errorJson("Invalid JSON body");
  const { email, code } = body as { email?: string; code?: string };
  if (!email || !code) return errorJson("Email and code are required");

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email.toLowerCase()), eq(otpCodes.code, code), eq(otpCodes.consumed, false)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!otp) return errorJson("Invalid code", 400);
  if (new Date(otp.expiresAt) < new Date()) return errorJson("Code expired", 400);

  await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, otp.id));
  await db.update(users).set({ verified: true }).where(eq(users.email, email.toLowerCase()));

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (!user) return errorJson("User not found", 404);

  const token = signSession({ uid: user.id, email: user.email, role: user.role });
  return json(
    { ok: true, user: { id: user.id, name: user.name, email: user.email, verified: true, role: user.role } },
    { headers: { "Set-Cookie": sessionCookie(token) } }
  );
};

export const config: Config = { path: "/api/auth/verify-otp" };
