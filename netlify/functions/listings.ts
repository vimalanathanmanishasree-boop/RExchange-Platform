import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { listings, users } from "../../db/schema.js";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { json, errorJson, requireSession } from "../lib/auth.js";

const CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Event Tickets",
  "Notes & Study Material",
  "Skills/Services",
  "Miscellaneous",
];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Worn"];
const MODES = ["Barter", "Karma Points", "Free Giveaway", "Paid Resale"];

export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const idParam = url.searchParams.get("id");
    if (idParam) {
      const [listing] = await db.select().from(listings).where(eq(listings.id, Number(idParam)));
      if (!listing) return errorJson("Listing not found", 404);
      const [owner] = await db.select().from(users).where(eq(users.id, listing.ownerId));
      await db.update(listings).set({ views: listing.views + 1 }).where(eq(listings.id, listing.id));
      return json({ listing, owner: owner ? sanitizeUser(owner) : null });
    }

    const session = requireSession(req);
    const category = url.searchParams.get("category");
    const condition = url.searchParams.get("condition");
    const mode = url.searchParams.get("mode");
    const minKarma = url.searchParams.get("minKarma");
    const maxKarma = url.searchParams.get("maxKarma");
    const q = url.searchParams.get("q");
    const sort = url.searchParams.get("sort") || "newest";
    const mine = url.searchParams.get("mine");
    const subjectCode = url.searchParams.get("subjectCode");
    const status = url.searchParams.get("status");

    const conditions = [];
    if (category) conditions.push(eq(listings.category, category));
    if (condition) conditions.push(eq(listings.condition, condition));
    if (subjectCode) conditions.push(eq(listings.subjectCode, subjectCode));
    if (minKarma) conditions.push(gte(listings.karmaValue, Number(minKarma)));
    if (maxKarma) conditions.push(lte(listings.karmaValue, Number(maxKarma)));
    if (mine && session) conditions.push(eq(listings.ownerId, session.uid));
    if (status) conditions.push(eq(listings.status, status));
    if (!mine) conditions.push(eq(listings.status, status || "Active"));

    let rows = await db
      .select()
      .from(listings)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(sort === "expiring" ? asc(listings.expiryDate) : desc(listings.createdAt))
      .limit(200);

    if (mode) {
      rows = rows.filter((r) => Array.isArray(r.exchangeModes) && (r.exchangeModes as string[]).includes(mode));
    }
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(needle) || r.description.toLowerCase().includes(needle)
      );
    }

    // Simple recommendation boost: same department/year as viewer ranks higher when sort=relevant
    if (sort === "relevant" && session) {
      const [viewer] = await db.select().from(users).where(eq(users.id, session.uid));
      const owners = await db.select().from(users);
      const ownerMap = new Map(owners.map((o) => [o.id, o]));
      rows = rows
        .map((r) => {
          const owner = ownerMap.get(r.ownerId);
          let score = 0;
          if (viewer && owner) {
            if (owner.department === viewer.department && viewer.department) score += 3;
            if (owner.year === viewer.year && viewer.year) score += 2;
          }
          score += Math.min(r.upvotes, 5) * 0.5;
          return { row: r, score };
        })
        .sort((a, b) => b.score - a.score || b.row.createdAt.valueOf() - a.row.createdAt.valueOf())
        .map((x) => x.row);
    }

    return json({ listings: rows, categories: CATEGORIES, conditions: CONDITIONS, modes: MODES });
  }

  const session = requireSession(req);
  if (!session) return errorJson("Not authenticated", 401);

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body) return errorJson("Invalid JSON body");
    const {
      title,
      description,
      category,
      condition,
      exchangeModes,
      karmaValue,
      price,
      photoKeys,
      expiryDate,
      subjectCode,
    } = body as Record<string, unknown>;

    if (!title || !category) return errorJson("Title and category are required");
    if (!CATEGORIES.includes(category as string)) return errorJson("Invalid category");

    const [created] = await db
      .insert(listings)
      .values({
        ownerId: session.uid,
        title: title as string,
        description: (description as string) || "",
        category: category as string,
        condition: (condition as string) || "Good",
        exchangeModes: Array.isArray(exchangeModes) ? exchangeModes : [],
        karmaValue: Number(karmaValue) || 0,
        price: price ? Number(price) : null,
        photoKeys: Array.isArray(photoKeys) ? photoKeys : [],
        expiryDate: expiryDate ? new Date(expiryDate as string) : null,
        subjectCode: (subjectCode as string) || null,
      })
      .returning();

    return json({ listing: created }, { status: 201 });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const idParam = url.searchParams.get("id");
    if (!idParam) return errorJson("id is required");
    const [existing] = await db.select().from(listings).where(eq(listings.id, Number(idParam)));
    if (!existing) return errorJson("Listing not found", 404);
    if (existing.ownerId !== session.uid) return errorJson("Forbidden", 403);

    const body = await req.json().catch(() => null);
    if (!body) return errorJson("Invalid JSON body");
    const allowedFields = [
      "title",
      "description",
      "category",
      "condition",
      "exchangeModes",
      "karmaValue",
      "price",
      "photoKeys",
      "expiryDate",
      "status",
      "subjectCode",
    ];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const f of allowedFields) {
      if (f in (body as Record<string, unknown>)) {
        updates[f] = f === "expiryDate" && body[f] ? new Date(body[f]) : body[f];
      }
    }
    const [updated] = await db.update(listings).set(updates).where(eq(listings.id, existing.id)).returning();
    return json({ listing: updated });
  }

  if (req.method === "DELETE") {
    const idParam = url.searchParams.get("id");
    if (!idParam) return errorJson("id is required");
    const [existing] = await db.select().from(listings).where(eq(listings.id, Number(idParam)));
    if (!existing) return errorJson("Listing not found", 404);
    if (existing.ownerId !== session.uid) return errorJson("Forbidden", 403);
    await db.delete(listings).where(eq(listings.id, existing.id));
    return json({ ok: true });
  }

  return errorJson("Method not allowed", 405);
};

function sanitizeUser(u: typeof users.$inferSelect) {
  const { passwordHash, ...safe } = u;
  return safe;
}

export const config: Config = { path: "/api/listings" };
