CREATE TABLE "allowed_domains" (
	"id" serial PRIMARY KEY,
	"domain" text NOT NULL UNIQUE,
	"added_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" serial PRIMARY KEY,
	"listing_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"status" text DEFAULT 'Requested' NOT NULL,
	"karma_awarded" integer DEFAULT 0 NOT NULL,
	"requester_revealed" boolean DEFAULT false NOT NULL,
	"owner_revealed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "listing_upvotes" (
	"id" serial PRIMARY KEY,
	"listing_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY,
	"owner_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"condition" text DEFAULT 'Good' NOT NULL,
	"exchange_modes" jsonb DEFAULT '[]' NOT NULL,
	"karma_value" integer DEFAULT 0 NOT NULL,
	"price" real,
	"photo_keys" jsonb DEFAULT '[]' NOT NULL,
	"expiry_date" timestamp,
	"status" text DEFAULT 'Active' NOT NULL,
	"subject_code" text,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"listing_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"purpose" text DEFAULT 'signup' NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY,
	"exchange_id" integer NOT NULL,
	"rater_id" integer NOT NULL,
	"ratee_id" integer NOT NULL,
	"stars" integer NOT NULL,
	"review" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY,
	"reporter_id" integer NOT NULL,
	"target_type" text NOT NULL,
	"target_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_slots" (
	"id" serial PRIMARY KEY,
	"listing_id" integer NOT NULL,
	"host_id" integer NOT NULL,
	"starts_at" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"booked_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"hostel_block" text DEFAULT '' NOT NULL,
	"photo_key" text,
	"bio" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"karma" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allowed_domains" ADD CONSTRAINT "allowed_domains_added_by_users_id_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id");--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_requester_id_users_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "listing_upvotes" ADD CONSTRAINT "listing_upvotes_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id");--> statement-breakpoint
ALTER TABLE "listing_upvotes" ADD CONSTRAINT "listing_upvotes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_exchange_id_exchanges_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id");--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_users_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_id_users_id_fkey" FOREIGN KEY ("ratee_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "skill_slots" ADD CONSTRAINT "skill_slots_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id");--> statement-breakpoint
ALTER TABLE "skill_slots" ADD CONSTRAINT "skill_slots_host_id_users_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "skill_slots" ADD CONSTRAINT "skill_slots_booked_by_id_users_id_fkey" FOREIGN KEY ("booked_by_id") REFERENCES "users"("id");