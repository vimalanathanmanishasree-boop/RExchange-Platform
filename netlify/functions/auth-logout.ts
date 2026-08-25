import type { Config } from "@netlify/functions";
import { json, clearSessionCookie } from "../lib/auth.js";

export default async () => {
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
};

export const config: Config = { path: "/api/auth/logout" };
