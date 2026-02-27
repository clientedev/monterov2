CREATE TABLE "prospecting_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"call_outcome" text NOT NULL,
	"interest_level" text NOT NULL,
	"notes" text,
	"checklist_data" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "prospecting_checklists" ADD CONSTRAINT "prospecting_checklists_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospecting_checklists" ADD CONSTRAINT "prospecting_checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;