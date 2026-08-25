import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

// ---------- USERS ----------
export const users = pgTable("users", {
  id: serial().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  department: text("department").notNull().default(""),
  year: text("year").notNull().default(""),
  hostelBlock: text("hostel_block").notNull().default(""),
  photoKey: text("photo_key"), // netlify blobs key
  bio: text("bio").notNull().default(""),
  verified: boolean("verified").notNull().default(false),
  role: text("role").notNull().default("student"), // student | admin
  karma: integer("karma").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- ALLOWED EMAIL DOMAINS (admin-managed whitelist) ----------
export const allowedDomains = pgTable("allowed_domains", {
  id: serial().primaryKey(),
  domain: text("domain").notNull().unique(), // e.g. "college.edu"
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- OTP CODES ----------
export const otpCodes = pgTable("otp_codes", {
  id: serial().primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  purpose: text("purpose").notNull().default("signup"), // signup | login
  consumed: boolean("consumed").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- LISTINGS ----------
export const listings = pgTable("listings", {
  id: serial().primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(), // Textbooks | Electronics | Event Tickets | Notes & Study Material | Skills/Services | Miscellaneous
  condition: text("condition").notNull().default("Good"), // New | Like New | Good | Fair | Worn
  exchangeModes: jsonb("exchange_modes").notNull().default([]), // ["Barter","Karma Points","Free Giveaway","Paid Resale"]
  karmaValue: integer("karma_value").notNull().default(0),
  price: real("price"),
  photoKeys: jsonb("photo_keys").notNull().default([]), // array of blob keys
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("Active"), // Active | Pending Exchange | Completed | Expired
  subjectCode: text("subject_code"), // for Notes Vault tagging
  upvotes: integer("upvotes").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const listingUpvotes = pgTable("listing_upvotes", {
  id: serial().primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- EXCHANGES ----------
export const exchanges = pgTable("exchanges", {
  id: serial().primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  status: text("status").notNull().default("Requested"), // Requested | Pending | Completed | Rejected | Cancelled
  karmaAwarded: integer("karma_awarded").notNull().default(0),
  requesterRevealed: boolean("requester_revealed").notNull().default(false),
  ownerRevealed: boolean("owner_revealed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ---------- MESSAGES ----------
export const messages = pgTable("messages", {
  id: serial().primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- RATINGS ----------
export const ratings = pgTable("ratings", {
  id: serial().primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  raterId: integer("rater_id").notNull().references(() => users.id),
  rateeId: integer("ratee_id").notNull().references(() => users.id),
  stars: integer("stars").notNull(),
  review: text("review").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- REPORTS ----------
export const reports = pgTable("reports", {
  id: serial().primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(), // "listing" | "user"
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("Open"), // Open | Reviewed | Dismissed | Actioned
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- SKILL SWAP SLOTS ----------
export const skillSlots = pgTable("skill_slots", {
  id: serial().primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  hostId: integer("host_id").notNull().references(() => users.id),
  startsAt: timestamp("starts_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  bookedById: integer("booked_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
