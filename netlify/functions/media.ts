import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { errorJson } from "../lib/auth.js";

// Public media serving endpoint: /api/media/:key(url-encoded)
export default async (req: Request) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return errorJson("key is required");

  const store = getStore("rexchange-media");
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) return new Response("Not found", { status: 404 });

  const contentType = (result.metadata?.contentType as string) || "application/octet-stream";
  return new Response(result.data as ArrayBuffer, {
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
};

export const config: Config = { path: "/api/media" };
