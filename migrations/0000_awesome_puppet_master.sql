CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"budget" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"document" text,
	"address" text,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hero_slides" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_base64" text NOT NULL,
	"button_text" text DEFAULT 'Cotação Gratuita' NOT NULL,
	"button_link" text DEFAULT '/contact' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"contact_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text,
	"value" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"spend" text,
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"summary" text NOT NULL,
	"cover_image" text NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_name" text DEFAULT 'Monteiro Corretora' NOT NULL,
	"logo_base64" text,
	"primary_color" text DEFAULT '#0f172a' NOT NULL,
	"secondary_color" text DEFAULT '#fbbf24' NOT NULL,
	"font_sans" text DEFAULT 'Inter' NOT NULL,
	"font_display" text DEFAULT 'Outfit' NOT NULL,
	"hero_title" text DEFAULT 'Protegendo seu Futuro,
Garantindo seu Legado' NOT NULL,
	"hero_subtitle" text DEFAULT 'Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.' NOT NULL,
	"about_title" text DEFAULT 'Sobre a Monteiro Corretora' NOT NULL,
	"about_content" text DEFAULT 'Fundada por Carlos Monteiro, a Monteiro Corretora começou com uma missão simples: tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.

Nas últimas três décadas, crescemos de um pequeno escritório familiar para uma das corretoras mais respeitadas da região. Nosso crescimento não mudou nossos valores fundamentais — ainda tratamos cada cliente como parte da família.' NOT NULL,
	"about_image_base64" text DEFAULT 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600',
	"services_title" text DEFAULT 'Soluções Completas em Seguros' NOT NULL,
	"services_subtitle" text DEFAULT 'Planos de cobertura personalizados projetados para atender às suas necessidades específicas.' NOT NULL,
	"blog_title" text DEFAULT 'Blog e Novidades' NOT NULL,
	"blog_subtitle" text DEFAULT 'Fique por dentro das novidades e dicas do mercado de seguros.' NOT NULL,
	"contact_email" text DEFAULT 'contato@monteiro.com' NOT NULL,
	"contact_phone" text DEFAULT '+55 (11) 9999-9999' NOT NULL,
	"address" text DEFAULT 'Rua do Comércio, 123, São Paulo, SP' NOT NULL,
	"footer_text" text DEFAULT 'Oferecemos soluções premium em seguros personalizadas para seu estilo de vida e necessidades de negócios.' NOT NULL,
	"facebook_url" text,
	"instagram_url" text,
	"twitter_url" text,
	"linkedin_url" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assigned_to" integer NOT NULL,
	"contact_id" integer,
	"created_by" integer NOT NULL,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_stats" ADD CONSTRAINT "marketing_stats_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;