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
  clientes,
  seguradoras,
  produtosSeguro,
  apolices,
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
  type InsertComment,
  reviews,
  type Review,
  type InsertReview,
  products,
  type Product,
  type InsertProduct,
  type Cliente,
  type InsertCliente,
  type Seguradora,
  type InsertSeguradora,
  type ProdutoSeguro,
  type InsertProdutoSeguro,
  type Apolice,
  type InsertApolice,
  todoistProjects,
  todoistProjectMembers,
  todoistLabels,
  todoistTasks,
  todoistSubtasks,
  todoistTaskLabels,
  todoistComments,
  todoistActivityLogs,
  todoistAutomations,
  todoistNotifications,
  type TodoistProject,
  type InsertTodoistProject,
  type TodoistLabel,
  type InsertTodoistLabel,
  type TodoistTask,
  type InsertTodoistTask,
  type TodoistSubtask,
  type InsertTodoistSubtask,
  type TodoistComment,
  type InsertTodoistComment,
  type TodoistActivityLog,
  type TodoistAutomation,
  type InsertTodoistAutomation,
  type TodoistNotification,
} from "@shared/schema";
import { sql, and, desc, eq, asc, lte, or, isNull, inArray, gte, like } from "drizzle-orm";

export interface IStorage {
  // Posts
  getPosts(approvedOnly?: boolean): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
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
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
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
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;
  updateUserProfile(id: number, data: { name?: string; avatar?: string }): Promise<User | undefined>;
  updateUserEmail(id: number, email: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  upsertContact(contact: InsertContact): Promise<{ contact: Contact; isNew: boolean }>;
  deduplicateContacts(): Promise<{ mergedCount: number }>;
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
  createProspectingChecklist(checklist: InsertProspectingChecklist): Promise<ProspectingChecklist>;

  // Reviews
  getReviews(approvedOnly?: boolean): Promise<Review[]>;
  createReview(userId: number, review: InsertReview): Promise<Review>;
  approveReview(id: number): Promise<Review | undefined>;
  deleteReview(id: number): Promise<void>;

  // Products
  getProducts(activeOnly?: boolean): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  // Insurance Module — Clientes
  getClientes(filters?: { search?: string; seguradoraNome?: string; status?: string; tags?: string }): Promise<Cliente[]>;
  getCliente(id: number): Promise<Cliente | undefined>;
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, cliente: Partial<InsertCliente>): Promise<Cliente | undefined>;
  deleteCliente(id: number): Promise<void>;

  // Insurance Module — Seguradoras
  getSeguradoras(): Promise<Seguradora[]>;
  createSeguradora(seguradora: InsertSeguradora): Promise<Seguradora>;
  updateSeguradora(id: number, seguradora: Partial<InsertSeguradora>): Promise<Seguradora | undefined>;
  deleteSeguradora(id: number): Promise<void>;

  // Insurance Module — Produtos de Seguro
  getProdutosSeguro(): Promise<ProdutoSeguro[]>;
  createProdutoSeguro(produto: InsertProdutoSeguro): Promise<ProdutoSeguro>;
  updateProdutoSeguro(id: number, produto: Partial<InsertProdutoSeguro>): Promise<ProdutoSeguro | undefined>;
  deleteProdutoSeguro(id: number): Promise<void>;

  // Insurance Module — Apólices
  getApolices(clienteId?: number, filters?: {
    produtoId?: number;
    seguradoraId?: number;
    corretorId?: number;
    status?: string;
    vencimentoAte?: Date;
    vencimentoDe?: Date;
  }): Promise<Apolice[]>;
  getApolice(id: number): Promise<Apolice | undefined>;
  createApolice(apolice: InsertApolice): Promise<Apolice>;
  updateApolice(id: number, apolice: Partial<InsertApolice>): Promise<Apolice | undefined>;
  deleteApolice(id: number): Promise<void>;
  getDashboardSeguros(): Promise<{
    totalAtivas: number;
    totalClientes: number;
    totalVencidas: number;
    vencendo30: number;
    vencendo60: number;
    valorTotal: string;
    renovacaoMes: number;
    porSeguradora: { nome: string; total: number }[];
    porProduto: { nome: string; total: number }[];
  }>;

  // Todoist Module Methods
  getTodoistProjects(userId?: number): Promise<TodoistProject[]>;
  getTodoistProject(id: number): Promise<TodoistProject | undefined>;
  createTodoistProject(project: InsertTodoistProject): Promise<TodoistProject>;
  updateTodoistProject(id: number, project: Partial<InsertTodoistProject>): Promise<TodoistProject | undefined>;
  deleteTodoistProject(id: number): Promise<void>;

  getTodoistLabels(): Promise<TodoistLabel[]>;
  createTodoistLabel(label: InsertTodoistLabel): Promise<TodoistLabel>;
  deleteTodoistLabel(id: number): Promise<void>;

  getTodoistTasks(filters?: {
    view?: string;
    projectId?: number;
    priority?: string;
    labelId?: number;
    assignedTo?: number;
    contactId?: number;
    leadId?: number;
    clienteId?: number;
    apoliceId?: number;
    search?: string;
    status?: string;
    kanbanColumn?: string;
    isRecurring?: boolean;
  }): Promise<any[]>;
  getTodoistTask(id: number): Promise<any | undefined>;
  createTodoistTask(task: InsertTodoistTask, subtaskTitles?: string[], labelIds?: number[], createdByUserId?: number): Promise<TodoistTask>;
  updateTodoistTask(id: number, updates: Partial<InsertTodoistTask>, subtasksList?: { id?: number; title: string; completed?: boolean }[], labelIds?: number[], updatedByUserId?: number): Promise<TodoistTask | undefined>;
  completeTodoistTask(id: number, userId: number): Promise<{ task: TodoistTask; nextOccurrenceTask?: TodoistTask }>;
  deleteTodoistTask(id: number): Promise<void>;

  createTodoistSubtask(subtask: InsertTodoistSubtask): Promise<TodoistSubtask>;
  updateTodoistSubtask(id: number, completed: boolean, title?: string): Promise<TodoistSubtask | undefined>;
  deleteTodoistSubtask(id: number): Promise<void>;

  getTodoistComments(taskId: number): Promise<any[]>;
  createTodoistComment(comment: InsertTodoistComment): Promise<TodoistComment>;
  getTodoistActivityLogs(taskId: number): Promise<any[]>;

  getTodoistAutomations(): Promise<TodoistAutomation[]>;
  createTodoistAutomation(automation: InsertTodoistAutomation): Promise<TodoistAutomation>;
  updateTodoistAutomation(id: number, updates: Partial<InsertTodoistAutomation>): Promise<TodoistAutomation | undefined>;
  deleteTodoistAutomation(id: number): Promise<void>;
  triggerTodoistAutomations(eventType: string, context: { leadId?: number; contactId?: number; clienteId?: number; apoliceId?: number; assignedUserId?: number; title?: string }): Promise<number>;

  getTodoistNotifications(userId: number): Promise<TodoistNotification[]>;
  markTodoistNotificationRead(id: number): Promise<void>;

  getTodoistDashboardStats(userId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: false,
      tableName: 'session'
    });
  }
  // Posts
  async getPosts(approvedOnly = true): Promise<Post[]> {
    let query = db.select().from(posts);
    if (approvedOnly) {
      const now = new Date();
      query = query.where(
        and(
          eq(posts.isApproved, true),
          or(lte(posts.publishedAt, now), isNull(posts.publishedAt))
        )
      ) as any;
    }
    return await query.orderBy(desc(posts.publishedAt));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
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
    return await db.select().from(services).orderBy(asc(services.order));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db.update(services).set(service).where(eq(services.id, id)).returning();
    return updated;
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

  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ password: hashedPassword, mustChangePassword: false })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserProfile(id: number, data: { name?: string; avatar?: string }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserEmail(id: number, email: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ email })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(asc(contacts.name));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async upsertContact(contactInput: InsertContact): Promise<{ contact: Contact; isNew: boolean }> {
    const allContacts = await db.select().from(contacts);
    const cleanDoc = contactInput.document ? contactInput.document.replace(/\D/g, "") : "";
    const cleanEmail = contactInput.email ? contactInput.email.trim().toLowerCase() : "";
    const cleanName = contactInput.name ? contactInput.name.trim().toLowerCase() : "";
    const cleanPhone = contactInput.phone ? contactInput.phone.replace(/\D/g, "") : "";

    let existing: Contact | undefined;

    if (cleanDoc && cleanDoc.length >= 11) {
      existing = allContacts.find(c => c.document && c.document.replace(/\D/g, "") === cleanDoc);
    }

    if (!existing && cleanEmail) {
      existing = allContacts.find(c => c.email && c.email.trim().toLowerCase() === cleanEmail);
    }

    if (!existing && cleanName && cleanPhone && cleanPhone.length >= 8) {
      existing = allContacts.find(c => {
        const cName = c.name ? c.name.trim().toLowerCase() : "";
        const cPhone = c.phone ? c.phone.replace(/\D/g, "") : "";
        return cName === cleanName && cPhone === cleanPhone;
      });
    }

    if (existing) {
      const mergedProducts = (existing.productType || "")
        .split(",")
        .concat((contactInput.productType || "").split(","))
        .map((s: string) => s.trim())
        .filter(Boolean)
        .filter((item: string, idx: number, arr: string[]) => arr.findIndex((t: string) => t.toLowerCase() === item.toLowerCase()) === idx)
        .join(", ");

      const updatePayload: Partial<InsertContact> = {
        type: contactInput.type || existing.type,
        name: contactInput.name || existing.name,
        email: contactInput.email || existing.email,
        phone: contactInput.phone || existing.phone,
        document: contactInput.document || existing.document,
        address: contactInput.address || existing.address,
        responsibleName: contactInput.responsibleName || existing.responsibleName,
        responsibleId: contactInput.responsibleId || existing.responsibleId,
        anniversaryDate: contactInput.anniversaryDate || existing.anniversaryDate,
        maritalStatus: contactInput.maritalStatus || existing.maritalStatus,
        productType: mergedProducts || existing.productType,
        status: contactInput.status || existing.status,
      };

      const [updated] = await db.update(contacts).set(updatePayload).where(eq(contacts.id, existing.id)).returning();
      return { contact: updated, isNew: false };
    } else {
      const [newContact] = await db.insert(contacts).values(contactInput).returning();
      return { contact: newContact, isNew: true };
    }
  }

  async deduplicateContacts(): Promise<{ mergedCount: number }> {
    const allContacts = await db.select().from(contacts).orderBy(asc(contacts.id));
    const groups = new Map<string, Contact[]>();

    for (const c of allContacts) {
      const cleanDoc = c.document ? c.document.replace(/\D/g, "") : "";
      const cleanEmail = c.email ? c.email.trim().toLowerCase() : "";
      let key = "";
      if (cleanDoc && cleanDoc.length >= 11) {
        key = `doc:${cleanDoc}`;
      } else if (cleanEmail) {
        key = `email:${cleanEmail}`;
      } else if (c.name && c.phone) {
        const cleanName = c.name.trim().toLowerCase();
        const cleanPhone = c.phone.replace(/\D/g, "");
        if (cleanPhone.length >= 8) {
          key = `namephone:${cleanName}_${cleanPhone}`;
        }
      }

      if (key) {
        const existingList = groups.get(key) || [];
        existingList.push(c);
        groups.set(key, existingList);
      }
    }

    let mergedCount = 0;

    for (const contactList of Array.from(groups.values())) {
      if (contactList.length <= 1) continue;

      const primary = contactList[0];
      const secondaries = contactList.slice(1);

      let mergedProductsList = (primary.productType || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      let updatedFields: Partial<InsertContact> = {};

      for (const sec of secondaries) {
        const secProds = (sec.productType || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        for (const p of secProds) {
          if (!mergedProductsList.some((item: string) => item.toLowerCase() === p.toLowerCase())) {
            mergedProductsList.push(p);
          }
        }

        if (!primary.email && sec.email) updatedFields.email = sec.email;
        if (!primary.phone && sec.phone) updatedFields.phone = sec.phone;
        if (!primary.document && sec.document) updatedFields.document = sec.document;
        if (!primary.address && sec.address) updatedFields.address = sec.address;
        if (!primary.responsibleName && sec.responsibleName) updatedFields.responsibleName = sec.responsibleName;
        if (!primary.responsibleId && sec.responsibleId) updatedFields.responsibleId = sec.responsibleId;
        if (!primary.anniversaryDate && sec.anniversaryDate) updatedFields.anniversaryDate = sec.anniversaryDate;
        if (!primary.maritalStatus && sec.maritalStatus) updatedFields.maritalStatus = sec.maritalStatus;

        const secId = sec.id;
        await db.update(leads).set({ contactId: primary.id }).where(eq(leads.contactId, secId));
        await db.update(interactions).set({ contactId: primary.id }).where(eq(interactions.contactId, secId));
        await db.update(tasks).set({ contactId: primary.id }).where(eq(tasks.contactId, secId));
        await db.update(prospectingChecklists).set({ contactId: primary.id }).where(eq(prospectingChecklists.contactId, secId));
        await db.update(todoistTasks).set({ contactId: primary.id }).where(eq(todoistTasks.contactId, secId));
        await db.update(contacts).set({ responsibleId: primary.id }).where(eq(contacts.responsibleId, secId));

        await db.delete(contacts).where(eq(contacts.id, secId));
        mergedCount++;
      }

      const mergedProducts = mergedProductsList.join(", ");
      if (mergedProducts !== (primary.productType || "") || Object.keys(updatedFields).length > 0) {
        updatedFields.productType = mergedProducts;
        await db.update(contacts).set(updatedFields).where(eq(contacts.id, primary.id));
      }
    }

    return { mergedCount };
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    const contactLeads = await db.select({ id: leads.id }).from(leads).where(eq(leads.contactId, id));
    const leadIds = contactLeads.map(l => l.id);

    if (leadIds.length > 0) {
      await db.delete(interactions).where(or(eq(interactions.contactId, id), inArray(interactions.leadId, leadIds)));
      await db.delete(todoistTasks).where(or(eq(todoistTasks.contactId, id), inArray(todoistTasks.leadId, leadIds)));
    } else {
      await db.delete(interactions).where(eq(interactions.contactId, id));
      await db.delete(todoistTasks).where(eq(todoistTasks.contactId, id));
    }

    await db.delete(tasks).where(eq(tasks.contactId, id));
    await db.delete(prospectingChecklists).where(eq(prospectingChecklists.contactId, id));
    await db.update(contacts).set({ responsibleId: null, responsibleName: null }).where(eq(contacts.responsibleId, id));
    await db.delete(leads).where(eq(leads.contactId, id));
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
        primaryColor: "#08454c",
        secondaryColor: "#c65f54",
        heroTitle: "Protegendo seu Futuro,\nGarantindo seu Legado",
        heroSubtitle: "Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.",
        aboutTitle: "Sobre a Monteiro Corretora",
        aboutContent: "Com anos de experiência no mercado, trabalhando com seguradoras e corretoras líderes no mercado mundial, a Monteiro Corretora oferece sempre o seguro mais adequado ao seu perfil – pessoal ou empresarial – e às suas expectativas, com um atendimento personalizado, humano e qualificado.\n\nNos preocupamos em oferecer aos segurados acompanhamento durante todas as etapas do processo, ou seja, durante a contratação e também no pós-venda, garantindo tranquilidade e segurança.",
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
    const existing = await db.select().from(heroSlides).orderBy(heroSlides.order);
    if (existing.length === 0) {
      const defaultSlides = [
        {
          title: "Planos de Saúde Individuais & Familiares",
          subtitle: "A proteção mais completa para quem você ama. Acesso aos melhores hospitais do país com condições diferenciadas e atendimento personalizado.",
          imageBase64: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000",
          buttonText: "Cotação Individual",
          buttonLink: "/contact",
          order: 0,
          isActive: true,
        },
        {
          title: "Benefícios Corporativos Sob Medida",
          subtitle: "Reduza a sinistralidade e valorize sua equipe. Planos de saúde empresariais customizados para pequenas, médias e grandes empresas.",
          imageBase64: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000",
          buttonText: "Cotação Corporativa",
          buttonLink: "/contact",
          order: 1,
          isActive: true,
        },
        {
          title: "Planos de Saúde Premium & Reembolso",
          subtitle: "Reembolsos diferenciados, telemedicina de ponta e assistência nacional e internacional. O padrão de saúde que sua família e executivos merecem.",
          imageBase64: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=2000",
          buttonText: "Planos Premium",
          buttonLink: "/contact",
          order: 2,
          isActive: true,
        }
      ];
      
      const seeded: HeroSlide[] = [];
      for (const item of defaultSlides) {
        const [newSlide] = await db.insert(heroSlides).values(item).returning();
        seeded.push(newSlide);
      }
      return seeded;
    }
    return existing;
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

  // Reviews
  async getReviews(approvedOnly = true): Promise<Review[]> {
    let query = db.select().from(reviews);
    if (approvedOnly) {
      query = query.where(eq(reviews.isApproved, true)) as any;
    }
    return await query.orderBy(desc(reviews.createdAt));
  }

  async createReview(userId: number, review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values({ ...review, userId }).returning();
    return newReview;
  }

  async approveReview(id: number): Promise<Review | undefined> {
    const [updated] = await db
      .update(reviews)
      .set({ isApproved: true })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // Products
  async getProducts(activeOnly = false): Promise<Product[]> {
    let query = db.select().from(products);
    if (activeOnly) {
      query = query.where(eq(products.isActive, true)) as any;
    }
    return await query.orderBy(asc(products.name));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // ============================================================
  // INSURANCE MODULE — CLIENTES
  // ============================================================

  async getClientes(filters?: { search?: string; seguradoraNome?: string; status?: string; tags?: string }): Promise<Cliente[]> {
    return await db.select().from(clientes).orderBy(asc(clientes.nome));
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
    return cliente;
  }

  async createCliente(cliente: InsertCliente): Promise<Cliente> {
    const [newCliente] = await db.insert(clientes).values(cliente).returning();
    return newCliente;
  }

  async updateCliente(id: number, cliente: Partial<InsertCliente>): Promise<Cliente | undefined> {
    const [updated] = await db.update(clientes).set(cliente).where(eq(clientes.id, id)).returning();
    return updated;
  }

  async deleteCliente(id: number): Promise<void> {
    await db.delete(clientes).where(eq(clientes.id, id));
  }

  // ============================================================
  // INSURANCE MODULE — SEGURADORAS
  // ============================================================

  async getSeguradoras(): Promise<Seguradora[]> {
    return await db.select().from(seguradoras).orderBy(asc(seguradoras.nome));
  }

  async createSeguradora(seguradora: InsertSeguradora): Promise<Seguradora> {
    const [newSeg] = await db.insert(seguradoras).values(seguradora).returning();
    return newSeg;
  }

  async updateSeguradora(id: number, seguradora: Partial<InsertSeguradora>): Promise<Seguradora | undefined> {
    const [updated] = await db.update(seguradoras).set(seguradora).where(eq(seguradoras.id, id)).returning();
    return updated;
  }

  async deleteSeguradora(id: number): Promise<void> {
    await db.delete(seguradoras).where(eq(seguradoras.id, id));
  }

  // ============================================================
  // INSURANCE MODULE — PRODUTOS DE SEGURO
  // ============================================================

  async getProdutosSeguro(): Promise<ProdutoSeguro[]> {
    return await db.select().from(produtosSeguro).orderBy(asc(produtosSeguro.nome));
  }

  async createProdutoSeguro(produto: InsertProdutoSeguro): Promise<ProdutoSeguro> {
    const [newProduto] = await db.insert(produtosSeguro).values(produto).returning();
    return newProduto;
  }

  async updateProdutoSeguro(id: number, produto: Partial<InsertProdutoSeguro>): Promise<ProdutoSeguro | undefined> {
    const [updated] = await db.update(produtosSeguro).set(produto).where(eq(produtosSeguro.id, id)).returning();
    return updated;
  }

  async deleteProdutoSeguro(id: number): Promise<void> {
    await db.delete(produtosSeguro).where(eq(produtosSeguro.id, id));
  }

  // ============================================================
  // INSURANCE MODULE — APÓLICES
  // ============================================================

  async getApolices(clienteId?: number, filters?: {
    produtoId?: number;
    seguradoraId?: number;
    corretorId?: number;
    status?: string;
    vencimentoAte?: Date;
    vencimentoDe?: Date;
  }): Promise<Apolice[]> {
    const conditions: any[] = [];
    if (clienteId) conditions.push(eq(apolices.clienteId, clienteId));
    if (filters?.produtoId) conditions.push(eq(apolices.produtoId, filters.produtoId));
    if (filters?.seguradoraId) conditions.push(eq(apolices.seguradoraId, filters.seguradoraId));
    if (filters?.corretorId) conditions.push(eq(apolices.corretorId, filters.corretorId));
    if (filters?.status) conditions.push(eq(apolices.status, filters.status as any));

    let query = db.select().from(apolices);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(apolices.createdAt));
  }

  async getApolice(id: number): Promise<Apolice | undefined> {
    const [apolice] = await db.select().from(apolices).where(eq(apolices.id, id));
    return apolice;
  }

  async createApolice(apolice: InsertApolice): Promise<Apolice> {
    const [newApolice] = await db.insert(apolices).values(apolice).returning();
    return newApolice;
  }

  async updateApolice(id: number, apolice: Partial<InsertApolice>): Promise<Apolice | undefined> {
    const [updated] = await db.update(apolices).set(apolice).where(eq(apolices.id, id)).returning();
    return updated;
  }

  async deleteApolice(id: number): Promise<void> {
    await db.delete(apolices).where(eq(apolices.id, id));
  }

  async getDashboardSeguros(): Promise<{
    totalAtivas: number;
    totalClientes: number;
    totalVencidas: number;
    vencendo30: number;
    vencendo60: number;
    valorTotal: string;
    renovacaoMes: number;
    porSeguradora: { nome: string; total: number }[];
    porProduto: { nome: string; total: number }[];
  }> {
    const now = new Date();
    const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
    const in60 = new Date(now); in60.setDate(in60.getDate() + 60);
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesFim = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const allApolices = await db.select().from(apolices);
    const allClientes = await db.select().from(clientes);
    const allSeguradoras = await db.select().from(seguradoras);
    const allProdutos = await db.select().from(produtosSeguro);

    const ativas = allApolices.filter(a => a.status === "ativa");
    const vencidas = allApolices.filter(a => a.status === "vencida");

    const vencendo30 = ativas.filter(a => {
      if (!a.fimVigencia) return false;
      const fim = new Date(a.fimVigencia);
      return fim >= now && fim <= in30;
    });

    const vencendo60 = ativas.filter(a => {
      if (!a.fimVigencia) return false;
      const fim = new Date(a.fimVigencia);
      return fim >= now && fim <= in60;
    });

    const renovacaoMes = allApolices.filter(a => {
      if (!a.fimVigencia) return false;
      const fim = new Date(a.fimVigencia);
      return fim >= mesInicio && fim <= mesFim;
    });

    const valorTotal = ativas.reduce((acc, a) => {
      let valStr = (a.premio || "").replace(/[^\d.,]/g, "").trim();
      if (valStr.includes(",") && valStr.includes(".")) {
        valStr = valStr.replace(/\./g, "").replace(",", ".");
      } else if (valStr.includes(",")) {
        valStr = valStr.replace(",", ".");
      }
      const val = parseFloat(valStr) || 0;
      return acc + val;
    }, 0).toFixed(2);

    // By seguradora
    const porSeguradora = allSeguradoras.map(s => ({
      nome: s.nome,
      total: allApolices.filter(a => a.seguradoraId === s.id).length,
    })).filter(s => s.total > 0);

    // By produto
    const porProduto = allProdutos.map(p => ({
      nome: p.nome,
      total: allApolices.filter(a => a.produtoId === p.id).length,
    })).filter(p => p.total > 0);

    return {
      totalAtivas: ativas.length,
      totalClientes: allClientes.length,
      totalVencidas: vencidas.length,
      vencendo30: vencendo30.length,
      vencendo60: vencendo60.length,
      valorTotal,
      renovacaoMes: renovacaoMes.length,
      porSeguradora,
      porProduto,
    };
  }

  // ============================================================
  // TODOIST MODULE METHODS
  // ============================================================

  async getTodoistProjects(userId?: number): Promise<TodoistProject[]> {
    return await db.select().from(todoistProjects).orderBy(desc(todoistProjects.createdAt));
  }

  async getTodoistProject(id: number): Promise<TodoistProject | undefined> {
    const [project] = await db.select().from(todoistProjects).where(eq(todoistProjects.id, id));
    return project;
  }

  async createTodoistProject(project: InsertTodoistProject): Promise<TodoistProject> {
    const [newProj] = await db.insert(todoistProjects).values(project).returning();
    return newProj;
  }

  async updateTodoistProject(id: number, project: Partial<InsertTodoistProject>): Promise<TodoistProject | undefined> {
    const [updated] = await db.update(todoistProjects).set(project).where(eq(todoistProjects.id, id)).returning();
    return updated;
  }

  async deleteTodoistProject(id: number): Promise<void> {
    await db.delete(todoistProjects).where(eq(todoistProjects.id, id));
  }

  async getTodoistLabels(): Promise<TodoistLabel[]> {
    return await db.select().from(todoistLabels).orderBy(asc(todoistLabels.name));
  }

  async createTodoistLabel(label: InsertTodoistLabel): Promise<TodoistLabel> {
    const [newLabel] = await db.insert(todoistLabels).values(label).returning();
    return newLabel;
  }

  async deleteTodoistLabel(id: number): Promise<void> {
    await db.delete(todoistLabels).where(eq(todoistLabels.id, id));
  }

  async getTodoistTasks(filters?: {
    view?: string;
    projectId?: number;
    priority?: string;
    labelId?: number;
    assignedTo?: number;
    contactId?: number;
    leadId?: number;
    clienteId?: number;
    apoliceId?: number;
    search?: string;
    status?: string;
    kanbanColumn?: string;
    isRecurring?: boolean;
  }): Promise<any[]> {
    let query = db.select().from(todoistTasks);
    const conditions: any[] = [];

    if (filters?.projectId !== undefined) {
      if (filters.projectId === 0) {
        conditions.push(isNull(todoistTasks.projectId));
      } else {
        conditions.push(eq(todoistTasks.projectId, filters.projectId));
      }
    }

    if (filters?.priority) {
      conditions.push(eq(todoistTasks.priority, filters.priority as any));
    }

    if (filters?.assignedTo) {
      conditions.push(eq(todoistTasks.assignedTo, filters.assignedTo));
    }

    if (filters?.contactId) {
      conditions.push(eq(todoistTasks.contactId, filters.contactId));
    }

    if (filters?.leadId) {
      conditions.push(eq(todoistTasks.leadId, filters.leadId));
    }

    if (filters?.clienteId) {
      conditions.push(eq(todoistTasks.clienteId, filters.clienteId));
    }

    if (filters?.apoliceId) {
      conditions.push(eq(todoistTasks.apoliceId, filters.apoliceId));
    }

    if (filters?.status) {
      conditions.push(eq(todoistTasks.status, filters.status as any));
    }

    if (filters?.kanbanColumn) {
      conditions.push(eq(todoistTasks.kanbanColumn, filters.kanbanColumn as any));
    }

    if (filters?.isRecurring !== undefined) {
      conditions.push(eq(todoistTasks.isRecurring, filters.isRecurring));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(todoistTasks.title, searchTerm),
          like(todoistTasks.description, searchTerm)
        )
      );
    }

    if (filters?.view === 'today') {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(
        and(
          lte(todoistTasks.dueDate, endOfDay),
          or(eq(todoistTasks.status, 'todo'), eq(todoistTasks.status, 'in_progress'))
        )
      );
    } else if (filters?.view === 'overdue') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      conditions.push(
        and(
          lte(todoistTasks.dueDate, startOfDay),
          or(eq(todoistTasks.status, 'todo'), eq(todoistTasks.status, 'in_progress'))
        )
      );
    } else if (filters?.view === 'upcoming') {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(
        and(
          gte(todoistTasks.dueDate, endOfDay),
          or(eq(todoistTasks.status, 'todo'), eq(todoistTasks.status, 'in_progress'))
        )
      );
    } else if (filters?.view === 'completed') {
      conditions.push(eq(todoistTasks.status, 'done'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const rawTasks = await query.orderBy(asc(todoistTasks.dueDate), desc(todoistTasks.priority));

    const hydratedTasks = await Promise.all(rawTasks.map(async (t) => {
      let project = undefined;
      if (t.projectId) {
        [project] = await db.select().from(todoistProjects).where(eq(todoistProjects.id, t.projectId));
      }

      let assignee = undefined;
      if (t.assignedTo) {
        [assignee] = await db.select().from(users).where(eq(users.id, t.assignedTo));
      }

      let contact = undefined;
      if (t.contactId) {
        [contact] = await db.select().from(contacts).where(eq(contacts.id, t.contactId));
      }

      let lead = undefined;
      if (t.leadId) {
        [lead] = await db.select().from(leads).where(eq(leads.id, t.leadId));
      }

      let cliente = undefined;
      if (t.clienteId) {
        [cliente] = await db.select().from(clientes).where(eq(clientes.id, t.clienteId));
      }

      let apolice = undefined;
      if (t.apoliceId) {
        [apolice] = await db.select().from(apolices).where(eq(apolices.id, t.apoliceId));
      }

      const subtasks = await db.select().from(todoistSubtasks).where(eq(todoistSubtasks.taskId, t.id)).orderBy(asc(todoistSubtasks.order));

      const labelLinks = await db.select().from(todoistTaskLabels).where(eq(todoistTaskLabels.taskId, t.id));
      let taskLabels: TodoistLabel[] = [];
      if (labelLinks.length > 0) {
        const labelIds = labelLinks.map(l => l.labelId);
        taskLabels = await db.select().from(todoistLabels).where(inArray(todoistLabels.id, labelIds));
      }

      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(todoistComments).where(eq(todoistComments.taskId, t.id));

      return {
        ...t,
        project,
        assignee,
        contact,
        lead,
        cliente,
        apolice,
        subtasks,
        labels: taskLabels,
        commentsCount: Number(count || 0),
      };
    }));

    if (filters?.labelId) {
      return hydratedTasks.filter(t => t.labels.some((l: any) => l.id === filters.labelId));
    }

    return hydratedTasks;
  }

  async getTodoistTask(id: number): Promise<any> {
    const [t] = await db.select().from(todoistTasks).where(eq(todoistTasks.id, id));
    if (!t) return undefined;

    let project = undefined;
    if (t.projectId) {
      [project] = await db.select().from(todoistProjects).where(eq(todoistProjects.id, t.projectId));
    }

    let assignee = undefined;
    if (t.assignedTo) {
      [assignee] = await db.select().from(users).where(eq(users.id, t.assignedTo));
    }

    let contact = undefined;
    if (t.contactId) {
      [contact] = await db.select().from(contacts).where(eq(contacts.id, t.contactId));
    }

    let lead = undefined;
    if (t.leadId) {
      [lead] = await db.select().from(leads).where(eq(leads.id, t.leadId));
    }

    let cliente = undefined;
    if (t.clienteId) {
      [cliente] = await db.select().from(clientes).where(eq(clientes.id, t.clienteId));
    }

    let apolice = undefined;
    if (t.apoliceId) {
      [apolice] = await db.select().from(apolices).where(eq(apolices.id, t.apoliceId));
    }

    const subtasks = await db.select().from(todoistSubtasks).where(eq(todoistSubtasks.taskId, t.id)).orderBy(asc(todoistSubtasks.order));

    const labelLinks = await db.select().from(todoistTaskLabels).where(eq(todoistTaskLabels.taskId, t.id));
    let taskLabels: TodoistLabel[] = [];
    if (labelLinks.length > 0) {
      const labelIds = labelLinks.map(l => l.labelId);
      taskLabels = await db.select().from(todoistLabels).where(inArray(todoistLabels.id, labelIds));
    }

    const commentsList = await db.select().from(todoistComments).where(eq(todoistComments.taskId, t.id)).orderBy(asc(todoistComments.createdAt));
    const commentsWithUser = await Promise.all(commentsList.map(async (c) => {
      const [u] = await db.select().from(users).where(eq(users.id, c.userId));
      return { ...c, user: u };
    }));

    const activityLogsList = await db.select().from(todoistActivityLogs).where(eq(todoistActivityLogs.taskId, t.id)).orderBy(desc(todoistActivityLogs.createdAt));
    const activityLogsWithUser = await Promise.all(activityLogsList.map(async (a) => {
      const [u] = await db.select().from(users).where(eq(users.id, a.userId));
      return { ...a, user: u };
    }));

    return {
      ...t,
      project,
      assignee,
      contact,
      lead,
      cliente,
      apolice,
      subtasks,
      labels: taskLabels,
      comments: commentsWithUser,
      activityLogs: activityLogsWithUser,
    };
  }

  async createTodoistTask(task: InsertTodoistTask, subtaskTitles?: string[], labelIds?: number[], createdByUserId?: number): Promise<TodoistTask> {
    const [newTask] = await db.insert(todoistTasks).values(task).returning();

    if (subtaskTitles && subtaskTitles.length > 0) {
      for (let i = 0; i < subtaskTitles.length; i++) {
        if (subtaskTitles[i].trim()) {
          await db.insert(todoistSubtasks).values({
            taskId: newTask.id,
            title: subtaskTitles[i].trim(),
            completed: false,
            order: i,
          });
        }
      }
    }

    if (labelIds && labelIds.length > 0) {
      for (const lId of labelIds) {
        await db.insert(todoistTaskLabels).values({
          taskId: newTask.id,
          labelId: lId,
        });
      }
    }

    const userId = createdByUserId || newTask.createdBy;
    await db.insert(todoistActivityLogs).values({
      taskId: newTask.id,
      userId,
      action: "criou a tarefa",
      details: `Tarefa "${newTask.title}" criada.`,
    });

    if (newTask.assignedTo && newTask.assignedTo !== userId) {
      await db.insert(todoistNotifications).values({
        userId: newTask.assignedTo,
        taskId: newTask.id,
        title: "Nova Tarefa Atribuída",
        message: `Você foi atribuído à tarefa "${newTask.title}".`,
        type: "assigned",
      });
    }

    return newTask;
  }

  async updateTodoistTask(
    id: number,
    updates: Partial<InsertTodoistTask>,
    subtasksList?: { id?: number; title: string; completed?: boolean }[],
    labelIds?: number[],
    updatedByUserId?: number
  ): Promise<TodoistTask | undefined> {
    const [existing] = await db.select().from(todoistTasks).where(eq(todoistTasks.id, id));
    if (!existing) return undefined;

    const [updated] = await db.update(todoistTasks).set({ ...updates, updatedAt: new Date() }).where(eq(todoistTasks.id, id)).returning();

    const userId = updatedByUserId || updated.createdBy;

    if (updates.status && updates.status !== existing.status) {
      await db.insert(todoistActivityLogs).values({
        taskId: id,
        userId,
        action: "alterou o status",
        details: `Status alterado de ${existing.status} para ${updates.status}.`,
      });
    }

    if (updates.dueDate && new Date(updates.dueDate).getTime() !== existing.dueDate?.getTime()) {
      await db.insert(todoistActivityLogs).values({
        taskId: id,
        userId,
        action: "alterou a data de vencimento",
        details: `Vencimento definido para ${new Date(updates.dueDate).toLocaleDateString('pt-BR')}.`,
      });
    }

    if (updates.assignedTo && updates.assignedTo !== existing.assignedTo) {
      const [newAssignee] = await db.select().from(users).where(eq(users.id, updates.assignedTo));
      await db.insert(todoistActivityLogs).values({
        taskId: id,
        userId,
        action: "atribuiu a tarefa",
        details: `Tarefa atribuída a ${newAssignee?.name || newAssignee?.username || 'usuário'}.`,
      });

      if (updates.assignedTo !== userId) {
        await db.insert(todoistNotifications).values({
          userId: updates.assignedTo,
          taskId: id,
          title: "Tarefa Atribuída",
          message: `A tarefa "${updated.title}" foi atribuída a você.`,
          type: "assigned",
        });
      }
    }

    if (subtasksList) {
      await db.delete(todoistSubtasks).where(eq(todoistSubtasks.taskId, id));
      for (let i = 0; i < subtasksList.length; i++) {
        if (subtasksList[i].title.trim()) {
          await db.insert(todoistSubtasks).values({
            taskId: id,
            title: subtasksList[i].title.trim(),
            completed: subtasksList[i].completed || false,
            order: i,
          });
        }
      }
    }

    if (labelIds) {
      await db.delete(todoistTaskLabels).where(eq(todoistTaskLabels.taskId, id));
      for (const lId of labelIds) {
        await db.insert(todoistTaskLabels).values({
          taskId: id,
          labelId: lId,
        });
      }
    }

    return updated;
  }

  async completeTodoistTask(id: number, userId: number): Promise<{ task: TodoistTask; nextOccurrenceTask?: TodoistTask }> {
    const [existing] = await db.select().from(todoistTasks).where(eq(todoistTasks.id, id));
    if (!existing) throw new Error("Task not found");

    const newStatus = existing.status === 'done' ? 'todo' : 'done';
    const newKanban = newStatus === 'done' ? 'concluido' : 'a_fazer';
    const completedAt = newStatus === 'done' ? new Date() : null;

    const [task] = await db.update(todoistTasks).set({
      status: newStatus,
      kanbanColumn: newKanban,
      completedAt,
      completedBy: newStatus === 'done' ? userId : null,
      updatedAt: new Date(),
    }).where(eq(todoistTasks.id, id)).returning();

    await db.insert(todoistActivityLogs).values({
      taskId: id,
      userId,
      action: newStatus === 'done' ? "concluiu a tarefa" : "reabriu a tarefa",
      details: newStatus === 'done' ? "Tarefa marcada como concluída." : "Tarefa reaberta.",
    });

    let nextOccurrenceTask: TodoistTask | undefined = undefined;

    if (newStatus === 'done' && existing.isRecurring && existing.recurrenceRule && existing.dueDate) {
      const nextDate = new Date(existing.dueDate);
      const rule = existing.recurrenceRule.toLowerCase();

      if (rule === 'daily') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (rule === 'weekdays') {
        nextDate.setDate(nextDate.getDate() + 1);
        if (nextDate.getDay() === 6) nextDate.setDate(nextDate.getDate() + 2);
        if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1);
      } else if (rule === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (rule === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (rule === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else if (rule.startsWith('every_x_days:')) {
        const days = parseInt(rule.split(':')[1]) || 1;
        nextDate.setDate(nextDate.getDate() + days);
      } else {
        nextDate.setDate(nextDate.getDate() + 7);
      }

      [nextOccurrenceTask] = await db.insert(todoistTasks).values({
        title: existing.title,
        description: existing.description,
        projectId: existing.projectId,
        assignedTo: existing.assignedTo,
        createdBy: userId,
        priority: existing.priority,
        status: 'todo',
        kanbanColumn: 'a_fazer',
        dueDate: nextDate,
        dueTime: existing.dueTime,
        isRecurring: true,
        recurrenceRule: existing.recurrenceRule,
        contactId: existing.contactId,
        leadId: existing.leadId,
        clienteId: existing.clienteId,
        apoliceId: existing.apoliceId,
      }).returning();

      const existingSubtasks = await db.select().from(todoistSubtasks).where(eq(todoistSubtasks.taskId, id));
      for (const st of existingSubtasks) {
        await db.insert(todoistSubtasks).values({
          taskId: nextOccurrenceTask.id,
          title: st.title,
          completed: false,
          order: st.order,
        });
      }

      const existingLabels = await db.select().from(todoistTaskLabels).where(eq(todoistTaskLabels.taskId, id));
      for (const l of existingLabels) {
        await db.insert(todoistTaskLabels).values({
          taskId: nextOccurrenceTask.id,
          labelId: l.labelId,
        });
      }

      await db.insert(todoistActivityLogs).values({
        taskId: nextOccurrenceTask.id,
        userId,
        action: "criada por recorrência",
        details: `Próxima ocorrência gerada para ${nextDate.toLocaleDateString('pt-BR')}.`,
      });
    }

    return { task, nextOccurrenceTask };
  }

  async deleteTodoistTask(id: number): Promise<void> {
    await db.delete(todoistTasks).where(eq(todoistTasks.id, id));
  }

  async createTodoistSubtask(subtask: InsertTodoistSubtask): Promise<TodoistSubtask> {
    const [st] = await db.insert(todoistSubtasks).values(subtask).returning();
    return st;
  }

  async updateTodoistSubtask(id: number, completed: boolean, title?: string): Promise<TodoistSubtask | undefined> {
    const updates: any = { completed };
    if (title !== undefined) updates.title = title;

    const [updated] = await db.update(todoistSubtasks).set(updates).where(eq(todoistSubtasks.id, id)).returning();
    return updated;
  }

  async deleteTodoistSubtask(id: number): Promise<void> {
    await db.delete(todoistSubtasks).where(eq(todoistSubtasks.id, id));
  }

  async getTodoistComments(taskId: number): Promise<any[]> {
    const list = await db.select().from(todoistComments).where(eq(todoistComments.taskId, taskId)).orderBy(asc(todoistComments.createdAt));
    return await Promise.all(list.map(async (c) => {
      const [u] = await db.select().from(users).where(eq(users.id, c.userId));
      return { ...c, user: u };
    }));
  }

  async createTodoistComment(comment: InsertTodoistComment): Promise<TodoistComment> {
    const [newComment] = await db.insert(todoistComments).values(comment).returning();
    await db.insert(todoistActivityLogs).values({
      taskId: comment.taskId,
      userId: comment.userId,
      action: "adicionou comentário",
      details: comment.content.substring(0, 50),
    });
    return newComment;
  }

  async getTodoistActivityLogs(taskId: number): Promise<any[]> {
    const list = await db.select().from(todoistActivityLogs).where(eq(todoistActivityLogs.taskId, taskId)).orderBy(desc(todoistActivityLogs.createdAt));
    return await Promise.all(list.map(async (a) => {
      const [u] = await db.select().from(users).where(eq(users.id, a.userId));
      return { ...a, user: u };
    }));
  }

  async getTodoistAutomations(): Promise<TodoistAutomation[]> {
    return await db.select().from(todoistAutomations).orderBy(desc(todoistAutomations.createdAt));
  }

  async createTodoistAutomation(automation: InsertTodoistAutomation): Promise<TodoistAutomation> {
    const [auto] = await db.insert(todoistAutomations).values(automation).returning();
    return auto;
  }

  async updateTodoistAutomation(id: number, updates: Partial<InsertTodoistAutomation>): Promise<TodoistAutomation | undefined> {
    const [updated] = await db.update(todoistAutomations).set(updates).where(eq(todoistAutomations.id, id)).returning();
    return updated;
  }

  async deleteTodoistAutomation(id: number): Promise<void> {
    await db.delete(todoistAutomations).where(eq(todoistAutomations.id, id));
  }

  async triggerTodoistAutomations(eventType: string, context: { leadId?: number; contactId?: number; clienteId?: number; apoliceId?: number; assignedUserId?: number; title?: string }): Promise<number> {
    const activeRules = await db.select().from(todoistAutomations).where(
      and(
        eq(todoistAutomations.eventType, eventType as any),
        eq(todoistAutomations.isActive, true)
      )
    );

    let triggeredCount = 0;
    for (const rule of activeRules) {
      const dueDate = new Date();
      if (rule.daysOffset) {
        dueDate.setDate(dueDate.getDate() + rule.daysOffset);
      }

      const assignedTo = rule.assigneeOption === 'specific_user' && rule.specificAssigneeId
        ? rule.specificAssigneeId
        : context.assignedUserId || 1;

      const title = context.title ? `${rule.actionTaskTitle}: ${context.title}` : rule.actionTaskTitle;

      await db.insert(todoistTasks).values({
        title,
        description: `Gerado automaticamente via regra de automação CRM "${rule.name}".`,
        priority: rule.actionPriority,
        assignedTo,
        createdBy: 1,
        status: 'todo',
        kanbanColumn: 'a_fazer',
        dueDate,
        contactId: context.contactId,
        leadId: context.leadId,
        clienteId: context.clienteId,
        apoliceId: context.apoliceId,
        autoGeneratedBy: rule.name,
      });

      triggeredCount++;
    }

    return triggeredCount;
  }

  async getTodoistNotifications(userId: number): Promise<TodoistNotification[]> {
    return await db.select().from(todoistNotifications).where(eq(todoistNotifications.userId, userId)).orderBy(desc(todoistNotifications.createdAt));
  }

  async markTodoistNotificationRead(id: number): Promise<void> {
    await db.update(todoistNotifications).set({ isRead: true }).where(eq(todoistNotifications.id, id));
  }

  async getTodoistDashboardStats(userId: number): Promise<any> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const allUserTasks = await db.select().from(todoistTasks).where(eq(todoistTasks.assignedTo, userId));
    const todayTasks = allUserTasks.filter(t => t.dueDate && t.dueDate <= endOfDay && t.status !== 'done');
    const overdueTasks = allUserTasks.filter(t => t.dueDate && t.dueDate < startOfDay && t.status !== 'done');
    const upcomingTasks = allUserTasks.filter(t => t.dueDate && t.dueDate > endOfDay && t.status !== 'done');
    const completedTodayTasks = allUserTasks.filter(t => t.completedAt && t.completedAt >= startOfDay);

    const allLeads = await db.select().from(leads);
    const leadsWithInteractions = await db.select({ leadId: interactions.leadId }).from(interactions);
    const leadIdsWithInteraction = new Set(leadsWithInteractions.map(i => i.leadId).filter(Boolean));
    const leadsWithoutContact = allLeads.filter(l => !leadIdsWithInteraction.has(l.id) && l.status !== 'cancelled' && l.status !== 'implemented');
    const staleLeads = allLeads.filter(l => l.createdAt && new Date(l.createdAt) < sevenDaysAgo && l.status !== 'cancelled' && l.status !== 'implemented');

    const priorityCounts = {
      P1: allUserTasks.filter(t => t.priority === 'P1' && t.status !== 'done').length,
      P2: allUserTasks.filter(t => t.priority === 'P2' && t.status !== 'done').length,
      P3: allUserTasks.filter(t => t.priority === 'P3' && t.status !== 'done').length,
      P4: allUserTasks.filter(t => t.priority === 'P4' && t.status !== 'done').length,
    };

    return {
      myTasks: {
        todayCount: todayTasks.length,
        overdueCount: overdueTasks.length,
        upcomingCount: upcomingTasks.length,
        completedTodayCount: completedTodayTasks.length,
        totalPending: allUserTasks.filter(t => t.status !== 'done').length,
      },
      priorityCounts,
      crmIntelligence: {
        leadsWithoutContactCount: leadsWithoutContact.length,
        leadsWithoutContact: leadsWithoutContact.slice(0, 5),
        staleLeadsCount: staleLeads.length,
        staleLeads: staleLeads.slice(0, 5),
      },
    };
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
  private productsData: Product[] = [];

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
    reviews: 1,
    products: 1,
  };

  private siteSettingsData: SiteSettings | null = null;
  private heroSlidesData: HeroSlide[] = [];
  private prospectingChecklistsData: ProspectingChecklist[] = [];
  private reviewsData: Review[] = [];


  constructor() {
    this.sessionStore = new session.MemoryStore();
  }

  // Posts
  async getPosts(approvedOnly = true): Promise<Post[]> {
    const now = new Date();
    const results = approvedOnly 
      ? this.posts.filter(p => p.isApproved && (!p.publishedAt || p.publishedAt <= now)) 
      : this.posts;
    return [...results].sort((a, b) => {
      const timeA = a.publishedAt?.getTime() ?? 0;
      const timeB = b.publishedAt?.getTime() ?? 0;
      return timeB - timeA;
    });
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.find((p) => p.id === id);
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
      videoUrl: post.videoUrl || null,
      youtubeUrl: post.youtubeUrl || null,
      isApproved: (post as any).isApproved ?? true,
      isFeatured: post.isFeatured ?? false,
      publishedAt: post.publishedAt || new Date(),
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

  // Products
  async getProducts(activeOnly = false): Promise<Product[]> {
    let results = activeOnly ? this.productsData.filter(p => p.isActive) : this.productsData;
    return [...results].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.productsData.find(p => p.id === id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentId.products++;
    const newProduct: Product = {
      ...product,
      id,
      description: product.description || null,
      isActive: product.isActive ?? true,
      createdAt: new Date(),
    };
    this.productsData.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const index = this.productsData.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.productsData[index] = { ...this.productsData[index], ...product };
    return this.productsData[index];
  }

  async deleteProduct(id: number): Promise<void> {
    this.productsData = this.productsData.filter(p => p.id !== id);
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
    return [...this.services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async createService(service: InsertService): Promise<Service> {
    const id = this.currentId.services++;
    const newService: Service = { ...service, id, order: service.order ?? 0 };
    this.services.push(newService);
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const index = this.services.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.services[index] = { ...this.services[index], ...service };
    return this.services[index];
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
      id,
      username: user.username,
      password: user.password,
      name: user.name,
      email: user.email || null,
      role: user.role || "client",
      avatar: user.avatar || null,
      mustChangePassword: user.mustChangePassword ?? false,
      createdAt: new Date(),
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

  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.password = hashedPassword;
    }
    return user;
  }

  async updateUserProfile(id: number, data: { name?: string; avatar?: string }): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      if (data.name) user.name = data.name;
      if (data.avatar) user.avatar = data.avatar;
    }
    return user;
  }

  async updateUserEmail(id: number, email: string): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.email = email;
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return [...this.contacts].sort((a, b) => a.name.localeCompare(b.name));
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
      responsibleName: contact.responsibleName || null,
      maritalStatus: contact.maritalStatus || null,
      anniversaryDate: contact.anniversaryDate || null,
      responsibleId: contact.responsibleId || null,
      assignedTo: contact.assignedTo ?? 0,
      productType: contact.productType || null,
      status: contact.status || "Ativo",
    };
    this.contacts.push(newContact);
    return newContact;
  }

  async upsertContact(contactInput: InsertContact): Promise<{ contact: Contact; isNew: boolean }> {
    const cleanDoc = contactInput.document ? contactInput.document.replace(/\D/g, "") : "";
    const cleanEmail = contactInput.email ? contactInput.email.trim().toLowerCase() : "";
    let existing = cleanDoc && cleanDoc.length >= 11 ? this.contacts.find(c => c.document && c.document.replace(/\D/g, "") === cleanDoc) : undefined;
    if (!existing && cleanEmail) existing = this.contacts.find(c => c.email && c.email.trim().toLowerCase() === cleanEmail);

    if (existing) {
      const mergedProducts = (existing.productType || "")
        .split(",")
        .concat((contactInput.productType || "").split(","))
        .map(s => s.trim())
        .filter(Boolean)
        .filter((item, idx, arr) => arr.findIndex(t => t.toLowerCase() === item.toLowerCase()) === idx)
        .join(", ");
      const updated = await this.updateContact(existing.id, { ...contactInput, productType: mergedProducts || existing.productType });
      return { contact: updated!, isNew: false };
    } else {
      const created = await this.createContact(contactInput);
      return { contact: created, isNew: true };
    }
  }

  async deduplicateContacts(): Promise<{ mergedCount: number }> {
    return { mergedCount: 0 };
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
      product: lead.product || null,
      status: lead.status ?? "New",
      contactId: lead.contactId ?? 0,
      assignedTo: lead.assignedTo || null
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
      color: task.color || "#0F6570",
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
        logoScale: 100,
        logoScaleMobile: 100,
        taskColumns: null,
        leadColumns: null,
        primaryColor: "#08454c",
        secondaryColor: "#c65f54",
        fontSans: "Inter",
        fontDisplay: "Outfit",
        heroTitle: "Protegendo seu Futuro, Garantindo seu Legado",
        heroSubtitle: "Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.",
        aboutTitle: "Sobre a Monteiro Corretora",
        aboutContent: "Fundada por Carlos Monteiro...",
        aboutImageBase64: "/equipe.jpg",
        servicesTitle: "Soluções Completas em Seguros",
        servicesSubtitle: "Planos de cobertura personalizados...",
        blogTitle: "Blog e Novidades",
        blogSubtitle: "Fique por dentro...",
        footerText: "Oferecemos soluções...",
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
    if (this.heroSlidesData.length === 0) {
      const defaultSlides = [
        {
          id: this.currentId.heroSlides++,
          title: "Planos de Saúde Individuais & Familiares",
          subtitle: "A proteção mais completa para quem você ama. Acesso aos melhores hospitais do país com condições diferenciadas e atendimento personalizado.",
          imageBase64: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000",
          buttonText: "Cotação Individual",
          buttonLink: "/contact",
          order: 0,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: this.currentId.heroSlides++,
          title: "Benefícios Corporativos Sob Medida",
          subtitle: "Reduza a sinistralidade e valorize sua equipe. Planos de saúde empresariais customizados para pequenas, médias e grandes empresas.",
          imageBase64: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000",
          buttonText: "Cotação Corporativa",
          buttonLink: "/contact",
          order: 1,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: this.currentId.heroSlides++,
          title: "Planos de Saúde Premium & Reembolso",
          subtitle: "Reembolsos diferenciados, telemedicina de ponta e assistência nacional e internacional. O padrão de saúde que sua família e executivos merecem.",
          imageBase64: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=2000",
          buttonText: "Planos Premium",
          buttonLink: "/contact",
          order: 2,
          isActive: true,
          createdAt: new Date(),
        }
      ];
      this.heroSlidesData = defaultSlides;
    }
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
      notes: checklist.notes ?? null,
      checklistData: checklist.checklistData ?? null
    };
    this.prospectingChecklistsData.push(newChecklist);
    return newChecklist;
  }

  // Reviews
  async getReviews(approvedOnly = true): Promise<Review[]> {
    const results = approvedOnly ? this.reviewsData.filter(r => r.isApproved) : this.reviewsData;
    return [...results].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async createReview(userId: number, review: InsertReview): Promise<Review> {
    const id = this.currentId.reviews++;
    const newReview: Review = { ...review, id, userId, isApproved: false, createdAt: new Date() };
    this.reviewsData.push(newReview);
    return newReview;
  }

  async approveReview(id: number): Promise<Review | undefined> {
    const review = this.reviewsData.find(r => r.id === id);
    if (review) {
      review.isApproved = true;
    }
    return review;
  }

  async deleteReview(id: number): Promise<void> {
    this.reviewsData = this.reviewsData.filter(r => r.id !== id);
  }

  // Insurance stubs (MemStorage not used in production)
  async getClientes(filters?: any): Promise<Cliente[]> { return []; }
  async getCliente(id: number): Promise<Cliente | undefined> { return undefined; }
  async createCliente(c: InsertCliente): Promise<Cliente> { throw new Error("Not implemented"); }
  async updateCliente(id: number, c: Partial<InsertCliente>): Promise<Cliente | undefined> { return undefined; }
  async deleteCliente(id: number): Promise<void> {}
  async getSeguradoras(): Promise<Seguradora[]> { return []; }
  async createSeguradora(s: InsertSeguradora): Promise<Seguradora> { throw new Error("Not implemented"); }
  async updateSeguradora(id: number, s: Partial<InsertSeguradora>): Promise<Seguradora | undefined> { return undefined; }
  async deleteSeguradora(id: number): Promise<void> {}
  async getProdutosSeguro(): Promise<ProdutoSeguro[]> { return []; }
  async createProdutoSeguro(p: InsertProdutoSeguro): Promise<ProdutoSeguro> { throw new Error("Not implemented"); }
  async updateProdutoSeguro(id: number, p: Partial<InsertProdutoSeguro>): Promise<ProdutoSeguro | undefined> { return undefined; }
  async deleteProdutoSeguro(id: number): Promise<void> {}
  async getApolices(): Promise<Apolice[]> { return []; }
  async getApolice(id: number): Promise<Apolice | undefined> { return undefined; }
  async createApolice(a: InsertApolice): Promise<Apolice> { throw new Error("Not implemented"); }
  async updateApolice(id: number, a: Partial<InsertApolice>): Promise<Apolice | undefined> { return undefined; }
  async deleteApolice(id: number): Promise<void> {}
  async getDashboardSeguros() {
    return { totalAtivas: 0, totalClientes: 0, totalVencidas: 0, vencendo30: 0, vencendo60: 0, valorTotal: "0.00", renovacaoMes: 0, porSeguradora: [], porProduto: [] };
  }

  // Todoist Stubs for MemStorage
  async getTodoistProjects(userId?: number): Promise<TodoistProject[]> { return []; }
  async getTodoistProject(id: number): Promise<TodoistProject | undefined> { return undefined; }
  async createTodoistProject(project: InsertTodoistProject): Promise<TodoistProject> { throw new Error("Not implemented"); }
  async updateTodoistProject(id: number, project: Partial<InsertTodoistProject>): Promise<TodoistProject | undefined> { return undefined; }
  async deleteTodoistProject(id: number): Promise<void> {}
  async getTodoistLabels(): Promise<TodoistLabel[]> { return []; }
  async createTodoistLabel(label: InsertTodoistLabel): Promise<TodoistLabel> { throw new Error("Not implemented"); }
  async deleteTodoistLabel(id: number): Promise<void> {}
  async getTodoistTasks(filters?: any): Promise<any[]> { return []; }
  async getTodoistTask(id: number): Promise<any | undefined> { return undefined; }
  async createTodoistTask(task: InsertTodoistTask, subtaskTitles?: string[], labelIds?: number[], createdByUserId?: number): Promise<TodoistTask> { throw new Error("Not implemented"); }
  async updateTodoistTask(id: number, updates: Partial<InsertTodoistTask>, subtasksList?: any[], labelIds?: number[], updatedByUserId?: number): Promise<TodoistTask | undefined> { return undefined; }
  async completeTodoistTask(id: number, userId: number): Promise<{ task: TodoistTask; nextOccurrenceTask?: TodoistTask }> { throw new Error("Not implemented"); }
  async deleteTodoistTask(id: number): Promise<void> {}
  async createTodoistSubtask(subtask: InsertTodoistSubtask): Promise<TodoistSubtask> { throw new Error("Not implemented"); }
  async updateTodoistSubtask(id: number, completed: boolean, title?: string): Promise<TodoistSubtask | undefined> { return undefined; }
  async deleteTodoistSubtask(id: number): Promise<void> {}
  async getTodoistComments(taskId: number): Promise<any[]> { return []; }
  async createTodoistComment(comment: InsertTodoistComment): Promise<TodoistComment> { throw new Error("Not implemented"); }
  async getTodoistActivityLogs(taskId: number): Promise<any[]> { return []; }
  async getTodoistAutomations(): Promise<TodoistAutomation[]> { return []; }
  async createTodoistAutomation(automation: InsertTodoistAutomation): Promise<TodoistAutomation> { throw new Error("Not implemented"); }
  async updateTodoistAutomation(id: number, updates: Partial<InsertTodoistAutomation>): Promise<TodoistAutomation | undefined> { return undefined; }
  async deleteTodoistAutomation(id: number): Promise<void> {}
  async triggerTodoistAutomations(eventType: string, context: any): Promise<number> { return 0; }
  async getTodoistNotifications(userId: number): Promise<TodoistNotification[]> { return []; }
  async markTodoistNotificationRead(id: number): Promise<void> {}
  async getTodoistDashboardStats(userId: number): Promise<any> { return { myTasks: { todayCount: 0, overdueCount: 0, upcomingCount: 0, completedTodayCount: 0, totalPending: 0 }, priorityCounts: { P1: 0, P2: 0, P3: 0, P4: 0 }, crmIntelligence: { leadsWithoutContactCount: 0, leadsWithoutContact: [], staleLeadsCount: 0, staleLeads: [] } }; }
}

export const storage = new DatabaseStorage();
