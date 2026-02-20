import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Blog Posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),
  coverImage: text("cover_image").notNull(),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact Inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Lucide icon name
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "employee"] }).notNull().default("employee"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contacts
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["individual", "company"] }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  document: text("document"), // CPF or CNPJ
  address: text("address"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leads
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  status: text("status").notNull().default("new"), // new, qualified, proposal, negotiation, closed, lost
  source: text("source"),
  value: text("value"), // Stored as text to handle currency formatting or arbitrary values
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interactions
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // call, email, meeting, note
  description: text("description").notNull(),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // google, facebook, instagram, email
  status: text("status").notNull().default("active"), // active, paused, completed
  budget: text("budget"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Stats (Daily/Weekly snapshots)
export const marketingStats = pgTable("marketing_stats", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  spend: text("spend"),
  date: timestamp("date").defaultNow(),
});

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("Monteiro Corretora"),
  logoBase64: text("logo_base64"), // Direct image storage
  primaryColor: text("primary_color").notNull().default("#0f172a"),
  secondaryColor: text("secondary_color").notNull().default("#fbbf24"),
  fontSans: text("font_sans").notNull().default("Inter"),
  fontDisplay: text("font_display").notNull().default("Outfit"),

  // Hero Content (Fallbacks)
  heroTitle: text("hero_title").notNull().default("Protegendo seu Futuro,\nGarantindo seu Legado"),
  heroSubtitle: text("hero_subtitle").notNull().default("Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna."),

  // About Page
  aboutTitle: text("about_title").notNull().default("Sobre a Monteiro Corretora"),
  aboutContent: text("about_content").notNull().default("Fundada por Carlos Monteiro, a Monteiro Corretora começou com uma missão simples: tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.\n\nNas últimas três décadas, crescemos de um pequeno escritório familiar para uma das corretoras mais respeitadas da região. Nosso crescimento não mudou nossos valores fundamentais — ainda tratamos cada cliente como parte da família."),
  aboutImageBase64: text("about_image_base64").default("https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600"),

  // Section Titles
  servicesTitle: text("services_title").notNull().default("Soluções Completas em Seguros"),
  servicesSubtitle: text("services_subtitle").notNull().default("Planos de cobertura personalizados projetados para atender às suas necessidades específicas."),
  blogTitle: text("blog_title").notNull().default("Blog e Novidades"),
  blogSubtitle: text("blog_subtitle").notNull().default("Fique por dentro das novidades e dicas do mercado de seguros."),

  // Global Contact & Info
  contactEmail: text("contact_email").notNull().default("contato@monteiro.com"),
  contactPhone: text("contact_phone").notNull().default("+55 (11) 9999-9999"),
  address: text("address").notNull().default("Rua do Comércio, 123, São Paulo, SP"),
  footerText: text("footer_text").notNull().default("Oferecemos soluções premium em seguros personalizadas para seu estilo de vida e necessidades de negócios."),

  // Social Links
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hero Carousel Slides
export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageBase64: text("image_base64").notNull(), // Direct image storage
  buttonText: text("button_text").notNull().default("Cotação Gratuita"),
  buttonLink: text("button_link").notNull().default("/contact"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks (Daily Kanban)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, done
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Schemas
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertMarketingStatsSchema = createInsertSchema(marketingStats).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({ id: true, updatedAt: true });
export const insertHeroSlideSchema = createInsertSchema(heroSlides).omit({ id: true, createdAt: true });

// Types
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type MarketingStat = typeof marketingStats.$inferSelect;
export type InsertMarketingStat = z.infer<typeof insertMarketingStatsSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
