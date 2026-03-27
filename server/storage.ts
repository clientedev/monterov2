import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import {
  posts,
  services,
  inquiries,
  users,
  contacts,
  leads,
  interactions,
  campaigns,
  tasks,
  type Post,
  type InsertPost,
  type Service,
  type InsertService,
  type Inquiry,
  type InsertInquiry,
  type User,
  type InsertUser,
  type Contact,
  type InsertContact,
  type Lead,
  type InsertLead,
  type Interaction,
  type InsertInteraction,
  type Campaign,
  type InsertCampaign,
  type Task,
  type InsertTask,
  siteSettings,
  heroSlides,
  type SiteSettings,
  type InsertSiteSettings,
  type HeroSlide,
  type InsertHeroSlide,
  prospectingChecklists,
  type ProspectingChecklist,
  type InsertProspectingChecklist,
  comments,
  type Comment,
  type InsertComment
} from "@shared/schema";
import { sql, and, desc, eq } from "drizzle-orm";

export interface IStorage {
  // Posts
  getPosts(approvedOnly?: boolean): Promise<Post[]>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<void>;
  likePost(id: number): Promise<Post | undefined>;
  approvePost(id: number): Promise<Post | undefined>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(postId?: number, approvedOnly?: boolean): Promise<Comment[]>;
  approveComment(id: number): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<void>;

  // Services
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiriesByUserId(userId: number): Promise<Inquiry[]>;

  sessionStore: session.Store;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  deleteUser(id: number): Promise<void>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<void>;

  // Leads
  getLeads(contactId?: number): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLeadStatus(id: number, status: string): Promise<Lead | undefined>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<void>;

  // Interactions
  getInteractions(leadId?: number, contactId?: number): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  deleteCampaign(id: number): Promise<void>;

  // Tasks
  getTasks(assignedTo?: number, contactId?: number, status?: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTaskStatus(id: number, status: string): Promise<Task | undefined>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;

  // Site Settings
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;

  // Hero Slides
  getHeroSlides(): Promise<HeroSlide[]>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined>;
  deleteHeroSlide(id: number): Promise<void>;

  // Prospecting
  getProspectingChecklists(contactId?: number): Promise<ProspectingChecklist[]>;
  createProspectingChecklist(checklist: InsertProspectingChecklist): Promise<ProspectingChecklist>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  // Posts
  async getPosts(approvedOnly = true): Promise<Post[]> {
    let query = db.select().from(posts);
    if (approvedOnly) {
      query = query.where(eq(posts.isApproved, true)) as any;
    }
    return await query.orderBy(desc(posts.publishedAt));
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined> {
    const [updated] = await db.update(posts).set(post).where(eq(posts.id, id)).returning();
    return updated;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async likePost(id: number): Promise<Post | undefined> {
    const [updated] = await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, id))
      .returning();
    return updated;
  }

  async approvePost(id: number): Promise<Post | undefined> {
    const [updated] = await db
      .update(posts)
      .set({ isApproved: true })
      .where(eq(posts.id, id))
      .returning();
    return updated;
  }

  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getComments(postId?: number, approvedOnly = true): Promise<Comment[]> {
    let query = db.select().from(comments);

    const conditions = [];
    if (postId) conditions.push(eq(comments.postId, postId));
    if (approvedOnly) conditions.push(eq(comments.isApproved, true));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(comments.createdAt));
  }

  async approveComment(id: number): Promise<Comment | undefined> {
    const [updated] = await db
      .update(comments)
      .set({ isApproved: true })
      .where(eq(comments.id, id))
      .returning();
    return updated;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async getInquiriesByUserId(userId: number): Promise<Inquiry[]> {
    return await db.select().from(inquiries).where(eq(inquiries.userId, userId)).orderBy(desc(inquiries.createdAt));
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: role as "admin" | "employee" | "client" })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Leads
  async getLeads(contactId?: number): Promise<Lead[]> {
    let query = db.select().from(leads);
    if (contactId) {
      query = query.where(eq(leads.contactId, contactId)) as any;
    }
    return await query.orderBy(desc(leads.createdAt));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLeadStatus(id: number, status: string): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ status })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updated] = await db.update(leads).set(lead).where(eq(leads.id, id)).returning();
    return updated;
  }

  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Interactions
  async getInteractions(leadId?: number, contactId?: number): Promise<Interaction[]> {
    let query = db.select().from(interactions).orderBy(desc(interactions.date));

    if (leadId) {
      query = query.where(eq(interactions.leadId, leadId)) as any;
    } else if (contactId) {
      query = query.where(eq(interactions.contactId, contactId)) as any;
    }

    const results = await query;
    return results;
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const [newInteraction] = await db.insert(interactions).values(interaction).returning();
    return newInteraction;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Tasks
  async getTasks(assignedTo?: number, contactId?: number, status?: string): Promise<Task[]> {
    let query = db.select().from(tasks);

    const conditions = [];
    if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
    if (contactId) conditions.push(eq(tasks.contactId, contactId));
    if (status) conditions.push(eq(tasks.status, status as any));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTaskStatus(id: number, status: string): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ status: status as any })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSettings> {
    const [settings] = await db.select().from(siteSettings);
    if (!settings) {
      // Seed default settings if none exist
      const [newSettings] = await db.insert(siteSettings).values({
        siteName: "Monteiro Corretora",
        heroTitle: "Protegendo seu Futuro,\nGarantindo seu Legado",
        heroSubtitle: "Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.",
        aboutTitle: "Sobre a Monteiro Corretora",
        aboutContent: "Com anos de experiência no mercado, trabalhando com seguradoras e corretoras líderes no mercado mundial, Carolina Monteiro é especialista em seguros de vida e fundadora da Monteiro Corretora. Nosso objetivo é oferecer sempre o seguro mais adequado ao seu perfil – pessoal ou empresarial – e às suas expectativas, com um atendimento personalizado, humano e qualificado.\n\nNos preocupamos em oferecer aos segurados acompanhamento durante todas as etapas do processo, ou seja, durante a contratação e também no pós-venda, garantindo tranquilidade e segurança.",
        aboutImageBase64: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600",
        servicesTitle: "Soluções Completas em Seguros",
        servicesSubtitle: "Planos de cobertura personalizados projetados para atender às suas necessidades específicas.",
        blogTitle: "Blog e Novidades",
        blogSubtitle: "Fique por dentro das novidades e dicas do mercado de seguros.",
        footerText: "Oferecemos soluções premium em seguros personalizadas para seu estilo de vida e necessidades de negócios.",
      }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    const [updated] = await db
      .update(siteSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(siteSettings.id, existing.id))
      .returning();
    return updated;
  }

  // Hero Slides
  async getHeroSlides(): Promise<HeroSlide[]> {
    return await db.select().from(heroSlides).orderBy(heroSlides.order);
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const [newSlide] = await db.insert(heroSlides).values(slide).returning();
    return newSlide;
  }

  async updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined> {
    const [updated] = await db
      .update(heroSlides)
      .set(slide)
      .where(eq(heroSlides.id, id))
      .returning();
    return updated;
  }

  async deleteHeroSlide(id: number): Promise<void> {
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
  }

  // Prospecting
  async getProspectingChecklists(contactId?: number): Promise<ProspectingChecklist[]> {
    let query = db.select().from(prospectingChecklists);
    if (contactId) {
      query = query.where(eq(prospectingChecklists.contactId, contactId)) as any;
    }
    return await query.orderBy(desc(prospectingChecklists.createdAt));
  }

  async createProspectingChecklist(checklist: InsertProspectingChecklist): Promise<ProspectingChecklist> {
    const [newChecklist] = await db.insert(prospectingChecklists).values(checklist).returning();
    return newChecklist;
  }
}

export class MemStorage implements IStorage {
  private posts: Post[] = [];
  private services: Service[] = [];
  private inquiries: Inquiry[] = [];
  private users: User[] = [];
  private contacts: Contact[] = [];
  private leads: Lead[] = [];
  private interactions: Interaction[] = [];
  private campaigns: Campaign[] = [];
  private tasks: Task[] = [];
  private comments: Comment[] = [];

  sessionStore: session.Store;

  private currentId = {
    posts: 1,
    services: 1,
    inquiries: 1,
    users: 1,
    contacts: 1,
    leads: 1,
    interactions: 1,
    campaigns: 1,
    tasks: 1,
    siteSettings: 1,
    heroSlides: 1,
    prospectingChecklists: 1,
    comments: 1,
  };

  private siteSettingsData: SiteSettings | null = null;
  private heroSlidesData: HeroSlide[] = [];
  private prospectingChecklistsData: ProspectingChecklist[] = [];

  constructor() {
    this.sessionStore = new session.MemoryStore();
  }

  // Posts
  async getPosts(approvedOnly = true): Promise<Post[]> {
    const results = approvedOnly ? this.posts.filter(p => p.isApproved) : this.posts;
    return [...results].sort((a, b) => {
      const timeA = a.publishedAt?.getTime() ?? 0;
      const timeB = b.publishedAt?.getTime() ?? 0;
      return timeB - timeA;
    });
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    return this.posts.find((p) => p.slug === slug);
  }

  async createPost(post: InsertPost): Promise<Post> {
    const id = this.currentId.posts++;
    const newPost: Post = {
      ...post,
      id,
      likes: 0,
      isApproved: post.isApproved ?? false,
      publishedAt: new Date(),
      createdAt: new Date()
    };
    this.posts.push(newPost);
    return newPost;
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined> {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    this.posts[index] = { ...this.posts[index], ...post };
    return this.posts[index];
  }

  async deletePost(id: number): Promise<void> {
    this.posts = this.posts.filter((p) => p.id !== id);
  }

  async likePost(id: number): Promise<Post | undefined> {
    const post = this.posts.find(p => p.id === id);
    if (post) {
      post.likes += 1;
    }
    return post;
  }

  async approvePost(id: number): Promise<Post | undefined> {
    const post = this.posts.find(p => p.id === id);
    if (post) {
      post.isApproved = true;
    }
    return post;
  }

  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentId.comments++;
    const newComment: Comment = {
      ...comment,
      id,
      isApproved: false,
      createdAt: new Date()
    };
    this.comments.push(newComment);
    return newComment;
  }

  async getComments(postId?: number, approvedOnly = true): Promise<Comment[]> {
    let results = this.comments;
    if (postId) results = results.filter(c => c.postId === postId);
    if (approvedOnly) results = results.filter(c => c.isApproved);
    return results.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async approveComment(id: number): Promise<Comment | undefined> {
    const comment = this.comments.find(c => c.id === id);
    if (comment) {
      comment.isApproved = true;
    }
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    this.comments = this.comments.filter(c => c.id !== id);
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.services;
  }

  async createService(service: InsertService): Promise<Service> {
    const id = this.currentId.services++;
    const newService: Service = { ...service, id };
    this.services.push(newService);
    return newService;
  }

  async deleteService(id: number): Promise<void> {
    this.services = this.services.filter((s) => s.id !== id);
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.currentId.inquiries++;
    const newInquiry: Inquiry = {
      ...inquiry,
      id,
      userId: inquiry.userId ?? null,
      createdAt: new Date(),
      phone: inquiry.phone || null
    };
    this.inquiries.push(newInquiry);
    return newInquiry;
  }

  async getInquiriesByUserId(userId: number): Promise<Inquiry[]> {
    return this.inquiries
      .filter(i => i.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  // Users
  async getUsers(): Promise<User[]> {
    return [...this.users].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      role: user.role || "employee"
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.role = role as "admin" | "employee" | "client";
    }
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.password = hashedPassword;
    }
  }

  async deleteUser(id: number): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return [...this.contacts].sort((a, b) => {
      const timeA = a.createdAt?.getTime() ?? 0;
      const timeB = b.createdAt?.getTime() ?? 0;
      return timeB - timeA;
    });
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.find((c) => c.id === id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentId.contacts++;
    const newContact: Contact = {
      ...contact,
      id,
      createdAt: new Date(),
      email: contact.email || null,
      phone: contact.phone || null,
      document: contact.document || null,
      address: contact.address || null,
      assignedTo: contact.assignedTo ?? 0
    };
    this.contacts.push(newContact);
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const index = this.contacts.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    this.contacts[index] = { ...this.contacts[index], ...contact };
    return this.contacts[index];
  }

  async deleteContact(id: number): Promise<void> {
    this.contacts = this.contacts.filter((c) => c.id !== id);
  }

  // Leads
  async getLeads(contactId?: number): Promise<Lead[]> {
    let filteredLeads = [...this.leads];
    if (contactId) {
      filteredLeads = filteredLeads.filter(l => l.contactId === contactId);
    }
    return filteredLeads.sort((a, b) => {
      const timeA = a.createdAt?.getTime() ?? 0;
      const timeB = b.createdAt?.getTime() ?? 0;
      return timeB - timeA;
    });
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.find((l) => l.id === id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.currentId.leads++;
    const newLead: Lead = {
      ...lead,
      id,
      createdAt: new Date(),
      value: lead.value || null,
      source: lead.source || null,
      notes: lead.notes || null,
      status: lead.status ?? "New",
      contactId: lead.contactId ?? 0
    };
    this.leads.push(newLead);
    return newLead;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) return undefined;
    this.leads[index] = { ...this.leads[index], ...lead };
    return this.leads[index];
  }

  async deleteLead(id: number): Promise<void> {
    this.leads = this.leads.filter((l) => l.id !== id);
  }

  async updateLeadStatus(id: number, status: string): Promise<Lead | undefined> {
    const lead = this.leads.find((l) => l.id === id);
    if (lead) {
      lead.status = status;
    }
    return lead;
  }

  // Interactions
  async getInteractions(leadId?: number, contactId?: number): Promise<Interaction[]> {
    return this.interactions
      .filter(i => {
        if (leadId && i.leadId !== leadId) return false;
        if (contactId && i.contactId !== contactId) return false;
        return true;
      })
      .sort((a, b) => {
        const timeA = a.date?.getTime() ?? 0;
        const timeB = b.date?.getTime() ?? 0;
        return timeB - timeA;
      });
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const id = this.currentId.interactions++;
    const newInteraction: Interaction = {
      ...interaction,
      id,
      createdAt: new Date(),
      date: interaction.date ? new Date(interaction.date) : null,
      contactId: interaction.contactId ?? 0,
      leadId: interaction.leadId ?? 0,
      userId: interaction.userId ?? 0
    };
    this.interactions.push(newInteraction);
    return newInteraction;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return [...this.campaigns].sort((a, b) => {
      const timeA = a.createdAt?.getTime() ?? 0;
      const timeB = b.createdAt?.getTime() ?? 0;
      return timeB - timeA;
    });
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentId.campaigns++;
    const newCampaign: Campaign = {
      ...campaign,
      id,
      createdAt: new Date(),
      startDate: campaign.startDate ? new Date(campaign.startDate) : null,
      endDate: campaign.endDate ? new Date(campaign.endDate) : null,
      budget: campaign.budget || null,
      status: campaign.status || "active",
      platform: campaign.platform
    };
    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    this.campaigns = this.campaigns.filter(c => c.id !== id);
  }

  // Tasks
  async getTasks(assignedTo?: number, contactId?: number): Promise<Task[]> {
    let filteredTasks = [...this.tasks];
    if (assignedTo) {
      filteredTasks = filteredTasks.filter(t => t.assignedTo === assignedTo);
    }
    if (contactId) {
      filteredTasks = filteredTasks.filter(t => t.contactId === contactId);
    }
    return filteredTasks.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.find(t => t.id === id);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.currentId.tasks++;
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date(),
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      description: task.description || null,
      contactId: task.contactId || null,
      priority: task.priority || "medium",
      status: (task.status as any) || "pendencia",
    };
    this.tasks.push(newTask);
    return newTask;
  }

  async updateTaskStatus(id: number, status: string): Promise<Task | undefined> {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = status as any;
    }
    return task;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    // Create new object to avoid type errors with Partial<InsertTask> matching Task
    const existing = this.tasks[index];
    this.tasks[index] = { ...existing } as Task;
    
    // Apply updates manually to handle type issues
    if (task.title !== undefined) this.tasks[index].title = task.title;
    if (task.description !== undefined) this.tasks[index].description = task.description;
    if (task.status !== undefined) this.tasks[index].status = task.status as any;
    if (task.priority !== undefined) this.tasks[index].priority = task.priority;
    if (task.assignedTo !== undefined) this.tasks[index].assignedTo = task.assignedTo;
    if (task.contactId !== undefined) this.tasks[index].contactId = task.contactId;
    if (task.dueDate !== undefined) this.tasks[index].dueDate = task.dueDate ? new Date(task.dueDate) : null;
    
    return this.tasks[index];
  }

  async deleteTask(id: number): Promise<void> {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSettings> {
    if (!this.siteSettingsData) {
      this.siteSettingsData = {
        id: this.currentId.siteSettings++,
        siteName: "Monteiro Corretora",
        logoBase64: null,
        primaryColor: "#0f172a",
        secondaryColor: "#fbbf24",
        fontSans: "Inter",
        fontDisplay: "Outfit",
        heroTitle: "Protegendo seu Futuro, Garantindo seu Legado",
        heroSubtitle: "Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.",
        aboutTitle: "Sobre a Monteiro Corretora",
        aboutContent: "Fundada por Carlos Monteiro, a Monteiro Corretora começou com uma missão simples: tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.\n\nNas últimas três décadas, crescemos de um pequeno escritório familiar para uma das corretoras mais respeitadas da região. Nosso crescimento não mudou nossos valores fundamentais — ainda tratamos cada cliente como parte da família.",
        aboutImageBase64: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600",
        servicesTitle: "Soluções Completas em Seguros",
        servicesSubtitle: "Planos de cobertura personalizados projetados para atender às suas necessidades específicas.",
        blogTitle: "Blog e Novidades",
        blogSubtitle: "Fique por dentro das novidades e dicas do mercado de seguros.",
        footerText: "Oferecemos soluções premium em seguros personalizadas para seu estilo de vida e necessidades de negócios.",
        contactEmail: "contato@monteiro.com",
        contactPhone: "+55 (11) 9999-9999",
        address: "Rua do Comércio, 123, São Paulo, SP",
        facebookUrl: null,
        instagramUrl: null,
        twitterUrl: null,
        linkedinUrl: null,
        updatedAt: new Date(),
      };
    }
    return this.siteSettingsData;
  }

  async updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const current = await this.getSiteSettings();
    this.siteSettingsData = { ...current, ...settings, updatedAt: new Date() };
    return this.siteSettingsData;
  }

  // Hero Slides
  async getHeroSlides(): Promise<HeroSlide[]> {
    return [...this.heroSlidesData].sort((a, b) => a.order - b.order);
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const id = this.currentId.heroSlides++;
    const newSlide: HeroSlide = {
      ...slide,
      id,
      createdAt: new Date(),
      subtitle: slide.subtitle ?? null,
      buttonText: slide.buttonText ?? "Cotação Gratuita",
      buttonLink: slide.buttonLink ?? "/contact",
      order: slide.order ?? 0,
      isActive: slide.isActive ?? true,
    };
    this.heroSlidesData.push(newSlide);
    return newSlide;
  }

  async updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined> {
    const index = this.heroSlidesData.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.heroSlidesData[index] = { ...this.heroSlidesData[index], ...slide };
    return this.heroSlidesData[index];
  }

  async deleteHeroSlide(id: number): Promise<void> {
    this.heroSlidesData = this.heroSlidesData.filter(s => s.id !== id);
  }

  // Prospecting
  async getProspectingChecklists(contactId?: number): Promise<ProspectingChecklist[]> {
    let filtered = [...this.prospectingChecklistsData];
    if (contactId) {
      filtered = filtered.filter(p => p.contactId === contactId);
    }
    return filtered.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async createProspectingChecklist(checklist: InsertProspectingChecklist): Promise<ProspectingChecklist> {
    const id = this.currentId.prospectingChecklists++;
    const newChecklist: ProspectingChecklist = {
      ...checklist,
      id,
      createdAt: new Date(),
      notes: checklist.notes || null,
      checklistData: checklist.checklistData || null
    };
    this.prospectingChecklistsData.push(newChecklist);
    return newChecklist;
  }
}

export const storage = new DatabaseStorage();
