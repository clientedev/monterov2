import { pgTable, text, serial, timestamp, boolean, integer, json, numeric } from "drizzle-orm/pg-core";
// Build trigger: 2026-04-27 16:51
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
  likes: integer("likes").default(0).notNull(),
  videoUrl: text("video_url"),
  youtubeUrl: text("youtube_url"),
  isApproved: boolean("is_approved").default(false).notNull(),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact Inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
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
  icon: text("icon").notNull(),
  order: integer("order").notNull().default(0),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "employee", "client"] }).notNull().default("client"),
  name: text("name").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contacts — PF and PJ
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["individual", "company"] }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  document: text("document"), // CPF or CNPJ
  address: text("address"),
  // NEW: PJ-specific fields
  responsibleName: text("responsible_name"), // Required for PJ — enforced via Zod superRefine
  responsibleId: integer("responsible_id"),
  anniversaryDate: text("anniversary_date"),  // "DD/MM/AAAA" format
  maritalStatus: text("marital_status"),      // solteiro, casado, divorciado, viuvo
  productType: text("product_type"),          // e.g. "Auto, Saúde"
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leads (Opportunities in the pipeline)
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  status: text("status").notNull().default("new"), // new, qualified, proposal, cancelled, implemented
  source: text("source"),
  product: text("product"), // NEW: selected product name
  value: text("value"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products (for lead dropdown)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interactions
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("active"),
  budget: text("budget"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Stats
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
  siteName: text("site_name").notNull().default("Monteiro Seguros e Benefícios"),
  logoBase64: text("logo_base64"),
  primaryColor: text("primary_color").notNull().default("#08454c"),
  secondaryColor: text("secondary_color").notNull().default("#c65f54"),
  fontSans: text("font_sans").notNull().default("Inter"),
  fontDisplay: text("font_display").notNull().default("Outfit"),
  logoScale: integer("logo_scale").notNull().default(150),
  logoScaleMobile: integer("logo_scale_mobile").notNull().default(130),

  heroTitle: text("hero_title").notNull().default("Proteção que Transforma,\nBenefícios que Cuidam"),
  heroSubtitle: text("hero_subtitle").notNull().default("A Monteiro Seguros e Benefícios é especializada em consultoria estratégica em proteção e benefícios para empresas e famílias."),

  aboutTitle: text("about_title").notNull().default("Sobre a Monteiro Seguros e Benefícios"),
  aboutContent: text("about_content").notNull().default("A Monteiro Seguros e Benefícios é especializada em oferecer consultoria estratégica em proteção e benefícios para empresas e famílias.\n\nMais do que comercializar seguros, atuamos como parceiros na construção de soluções que equilibram cuidado com pessoas, controle de custos e segurança financeira, tanto no ambiente corporativo quanto na vida pessoal.\n\nPara empresas, desenvolvemos estratégias que fortalecem a retenção de talentos e organizam os benefícios de forma inteligente.\n\nPara pessoas e famílias, criamos proteções personalizadas que garantem tranquilidade em todas as fases da vida.\n\nNosso trabalho começa antes da contratação e continua no dia a dia, garantindo que cada decisão esteja sempre alinhada ao momento e às necessidades de quem atendemos."),
  aboutImageBase64: text("about_image_base64").default("https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600"),

  servicesTitle: text("services_title").notNull().default("Soluções Completas em Proteção e Benefícios"),
  servicesSubtitle: text("services_subtitle").notNull().default("Planos personalizados para cada momento da sua vida e do seu negócio."),
  blogTitle: text("blog_title").notNull().default("Blog e Novidades"),
  blogSubtitle: text("blog_subtitle").notNull().default("Fique por dentro das novidades e dicas do mercado de seguros e benefícios."),

  contactEmail: text("contact_email").notNull().default("contato@monteiroseguros.com.br"),
  contactPhone: text("contact_phone").notNull().default("+55 (11) 9999-9999"),
  address: text("address").notNull().default("São Paulo, SP"),
  footerText: text("footer_text").notNull().default("Cuidar de pessoas é uma decisão estratégica. Benefícios não são custo. São estratégia."),

  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  taskColumns: text("task_columns"),
  leadColumns: text("lead_columns"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hero Carousel Slides
export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageBase64: text("image_base64").notNull(),
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
  status: text("status").notNull().default("pendencia"),
  priority: text("priority").notNull().default("medium"),
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  dueDate: timestamp("due_date"),
  color: text("color").notNull().default("default"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prospecting Checklists
export const prospectingChecklists = pgTable("prospecting_checklists", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  callOutcome: text("call_outcome").notNull(),
  interestLevel: text("interest_level").notNull(),
  notes: text("notes"),
  checklistData: text("checklist_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sessions
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// ============================================================
// INSURANCE MODULE
// ============================================================

// Clientes de Seguro (separado do CRM de contatos/leads)
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpfCnpj: text("cpf_cnpj"),
  dataNascimento: text("data_nascimento"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  observacoes: text("observacoes"),
  tags: text("tags"),
  responsavelComercialId: integer("responsavel_comercial_id").references(() => users.id),
  nomeRepresentante: text("nome_representante"),
  telefoneRepresentante: text("telefone_representante"),
  emailRepresentante: text("email_representante"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Seguradoras
export const seguradoras = pgTable("seguradoras", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Produtos de Seguro (Auto, Vida, Saúde, Residencial, etc.)
export const produtosSeguro = pgTable("produtos_seguro", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Apólices
export const apolices = pgTable("apolices", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id, { onDelete: "cascade" }).notNull(),
  produtoId: integer("produto_id").references(() => produtosSeguro.id),
  seguradoraId: integer("seguradora_id").references(() => seguradoras.id),
  numeroApolice: text("numero_apolice"),
  status: text("status", { enum: ["ativa", "vencida", "cancelada", "pendente"] }).notNull().default("ativa"),
  inicioVigencia: timestamp("inicio_vigencia"),
  fimVigencia: timestamp("fim_vigencia"),
  premio: text("premio"),
  valorSegurado: text("valor_segurado"),
  comissao: text("comissao"),
  corretorId: integer("corretor_id").references(() => users.id),
  observacoes: text("observacoes"),
  idProposta: text("id_proposta"),
  idApolice: text("id_apolice"),
  pdfApolice: text("pdf_apolice"),
  cobertura: text("cobertura"),
  dataEmissao: timestamp("data_emissao"),
  numeroProposta: text("numero_proposta"),
  linkFatura: text("link_fatura"),
  formaPagamento: text("forma_pagamento"),
  mesAtraso: text("mes_atraso"),
  faturasAberto: text("faturas_aberto"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// INSERT SCHEMAS (Zod validation)
// ============================================================

export const insertPostSchema = createInsertSchema(posts, {
  publishedAt: z.coerce.date().optional(),
}).omit({ id: true, createdAt: true });
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Contact schema with conditional validation: responsibleName required for PJ
export const insertContactSchema = createInsertSchema(contacts)
  .omit({ id: true, createdAt: true })
  .superRefine((data, ctx) => {
    if (data.type === "company" && (!data.responsibleName || data.responsibleName.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome do responsável é obrigatório para Pessoa Jurídica",
        path: ["responsibleName"],
      });
    }
  });

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertMarketingStatsSchema = createInsertSchema(marketingStats).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertSiteSettingsSchema = createInsertSchema(siteSettings, {
  logoScale: z.coerce.number(),
  logoScaleMobile: z.coerce.number(),
}).omit({ id: true, updatedAt: true });
export const insertHeroSlideSchema = createInsertSchema(heroSlides).omit({ id: true, createdAt: true });
export const insertProspectingChecklistSchema = createInsertSchema(prospectingChecklists).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, isApproved: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, isApproved: true, userId: true });

// Insurance Module Schemas
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true, createdAt: true });
export const insertSeguradoraSchema = createInsertSchema(seguradoras).omit({ id: true, createdAt: true });
export const insertProdutoSeguroSchema = createInsertSchema(produtosSeguro).omit({ id: true, createdAt: true });
export const insertApoliceSchema = createInsertSchema(apolices, {
  inicioVigencia: z.coerce.date().optional(),
  fimVigencia: z.coerce.date().optional(),
  dataEmissao: z.coerce.date().optional(),
}).omit({ id: true, createdAt: true });

// ============================================================
// TYPES
// ============================================================

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
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
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
export type ProspectingChecklist = typeof prospectingChecklists.$inferSelect;
export type InsertProspectingChecklist = z.infer<typeof insertProspectingChecklistSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Insurance Module Types
export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Seguradora = typeof seguradoras.$inferSelect;
export type InsertSeguradora = z.infer<typeof insertSeguradoraSchema>;
export type ProdutoSeguro = typeof produtosSeguro.$inferSelect;
export type InsertProdutoSeguro = z.infer<typeof insertProdutoSeguroSchema>;
export type Apolice = typeof apolices.$inferSelect;
export type InsertApolice = z.infer<typeof insertApoliceSchema>;
