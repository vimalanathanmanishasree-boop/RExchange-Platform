import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { json, errorJson, requireSession } from "../lib/auth.js";
import { randomUUID } from "node:crypto";

// Accepts multipart-free raw upload: client sends JSON { fileBase64, contentType, kind }
// kind: "listing" | "profile"
export default async (req: Request) => {
  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);
  if (req.method !== "POST") return errorJson("Method not allowed", 405);

  const body = await req.json().catch(() => null);
  if (!body) return errorJson("Invalid JSON body");
  const { fileBase64, contentType, kind } = body as {
    fileBase64?: string;
    contentType?: string;
    kind?: string;
  };
  if (!fileBase64) return errorJson("fileBase64 is required");
  if (fileBase64.length > 8_000_000) return errorJson("File too large (max ~6MB)", 413);

  const store = getStore("rexchange-media");
  const ext = (contentType || "image/jpeg").split("/")[1] || "jpg";
  const key = `${kind === "profile" ? "profiles" : "listings"}/${session.uid}-${randomUUID()}.${ext}`;

  const nodeBuffer = Buffer.from(fileBase64, "base64");
  const buffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
  await store.set(key, buffer, { metadata: { contentType: contentType || "image/jpeg" } });

  return json({ key });
};

export const config: Config = { path: "/api/upload" };
