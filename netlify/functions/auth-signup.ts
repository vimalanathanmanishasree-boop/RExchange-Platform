import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users, allowedDomains, otpCodes } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { json, errorJson, hashPassword } from "../lib/auth.js";

function domainOf(email: string): string {
  return email.split("@")[1]?.toLowerCase() || "";
}

export default async (req: Request) => {
  if (req.method !== "POST") return errorJson("Method not allowed", 405);
  const body = await req.json().catch(() => null);
  if (!body) return errorJson("Invalid JSON body");
  const { email, password, name } = body as { email?: string; password?: string; name?: string };

  if (!email || !password || !name) return errorJson("Email, password, and name are required");
  if (password.length < 6) return errorJson("Password must be at least 6 characters");

  const domain = domainOf(email.toLowerCase());
  const whitelist = await db.select().from(allowedDomains);
  const allowed = whitelist.some((d) => d.domain.toLowerCase() === domain);
  if (!allowed) {
    return errorJson(
      `Sign-up is restricted to verified college email domains. "${domain}" is not on the whitelist.`,
      403
    );
  }

  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (existing.length > 0) return errorJson("An account with this email already exists", 409);

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), passwordHash, name, verified: false })
    .returning();

  // Generate OTP (6 digits), expires in 10 minutes.
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(otpCodes).values({ email: email.toLowerCase(), code, purpose: "signup", expiresAt });

  // NOTE (dev-mode email limitation): no email service is configured, so the OTP
  // is returned directly in the response and logged server-side. In a production
  // deployment this would be sent via an email API (e.g. SendGrid/Postmark) and
  // NOT included in the response body.
  console.log(`[RExchange OTP] ${email} -> ${code}`);

  return json({
    ok: true,
    userId: user.id,
    devOtp: code,
    message: "Account created. Verify with the OTP code (dev mode: returned in response).",
  });
};

export const config: Config = { path: "/api/auth/signup" };
