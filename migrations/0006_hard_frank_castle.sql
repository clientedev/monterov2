CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "posts" ADD COLUMN "video_url" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "posts" ADD COLUMN "youtube_url" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "avatar" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;