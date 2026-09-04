import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { api } from "@shared/routes";
import { processAiChat, parseTaskWithGemini } from "./ai-service";
import Groq from "groq-sdk";
import { z } from "zod";
import { setupAuth, hashPassword, comparePasswords, isAuthenticated } from "./auth";
import { db } from "./db";
import { sql, eq, or, and, desc, asc } from "drizzle-orm";
import { sendCrmNotification, buildLeadAssignedEmail, buildLeadStatusChangedEmail, buildTaskAssignedEmail, sendBirthdayEmailToContact, sendClientWelcomeEmail } from "./email";
import {
  insertInquirySchema,
  insertContactSchema,
  insertReviewSchema,
  insertProductSchema,
  insertCommentSchema,
  insertLeadSchema,
  insertInteractionSchema,
  insertCampaignSchema,
  insertTaskSchema,
  insertSiteSettingsSchema,
  insertHeroSlideSchema,
  insertPostSchema,
  insertClienteSchema,
  insertSeguradoraSchema,
  insertProdutoSeguroSchema,
  insertApoliceSchema,
  insertTodoistProjectSchema,
  insertTodoistLabelSchema,
  insertTodoistTaskSchema,
  insertTodoistSubtaskSchema,
  insertTodoistCommentSchema,
  insertTodoistAutomationSchema,
  clientes,
  apolices,
  seguradoras,
  contacts,
  contactFiles,
  users,
  type InsertContact,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // AI Chat Route (Groq Cloud + Ollama Local + Intelligent DB Fallback)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid messages format" });
      }

      await processAiChat(messages, res);
    } catch (error: any) {
      console.error("AI Engine Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || "Internal server error connecting to AI" });
      }
    }
  });

  // Middleware to check authentication
  // (using imported isAuthenticated)

  const isTeam = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && (req.user.role === "admin" || req.user.role === "employee")) {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Team access required" });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  // Dynamic Image Server for OG Tags
  app.get("/api/posts/:id/image", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).send("Invalid ID");
      
      const post = await storage.getPost(id);
      if (!post || !post.coverImage) {
        return res.redirect("/favicon.png");
      }

      if (post.coverImage.startsWith("data:")) {
        const matches = post.coverImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.redirect("/favicon.png");
        }
        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', type);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
      
      res.redirect(post.coverImage);
    } catch (error) {
      res.redirect("/favicon.png");
    }
  });

  // SEO / Blog Social Previews - ONLY match blog posts with slugs, NOT the blog list
  app.get("/blog/:slug", async (req, res, next) => {
    // Skip if it's the blog list itself or a static asset
    if (!req.params.slug || req.params.slug === "index.html") {
      return next();
    }

    try {
      const slug = req.params.slug;
      const post = await storage.getPostBySlug(slug);

      if (!post) {
        return next();
      }

      // Strict path resolution for production vs development
      let finalPath = "";
      if (process.env.NODE_ENV === "production") {
        // Try multiple common production paths
        const paths = [
          path.resolve(process.cwd(), "dist", "public", "index.html"),
          path.resolve(process.cwd(), "public", "index.html"),
          path.resolve(__dirname, "..", "dist", "public", "index.html"),
          path.resolve(__dirname, "..", "public", "index.html"),
        ];
        
        for (const p of paths) {
          if (fs.existsSync(p)) {
            finalPath = p;
            break;
          }
        }
      } else {
        finalPath = path.resolve(process.cwd(), "client", "index.html");
      }

      if (!finalPath || !fs.existsSync(finalPath)) {
        console.error(`[SEO] Critical Error: index.html not found. Checked multiple paths.`);
        return next();
      }

      let html = fs.readFileSync(finalPath, "utf8");
      
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host');
      const imageUrl = `${protocol}://${host}/api/posts/${post.id}/image`;
      const siteUrl = `${protocol}://${host}${req.originalUrl}`;

      // Strip existing static title and meta tags to avoid duplication and conflicts in scrapers
      html = html.replace(/<title>.*?<\/title>/gi, "");
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, "");
      html = html.replace(/<meta\s+property="og:[^"]+"\s+content=".*?"\s*\/?>/gi, "");
      html = html.replace(/<meta\s+property="twitter:[^"]+"\s+content=".*?"\s*\/?>/gi, "");
      html = html.replace(/<meta\s+name="twitter:[^"]+"\s+content=".*?"\s*\/?>/gi, "");

      const ogTags = `
    <!-- Dynamic OG Tags -->
    <title>${post.title} | Monteiro Corretora</title>
    <meta name="description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${post.title}" />
    <meta property="og:description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${siteUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Monteiro Seguros e Benefícios" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${post.title}" />
    <meta name="twitter:description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
      `.trim();

      html = html.replace("</head>", `${ogTags}\n</head>`);
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    } catch (error) {
      console.error("SEO Middleware Error:", error);
      next();
    }
  });

  // Diagnostic endpoint — shows actual columns of posts table in live DB
  app.get("/api/debug/posts-columns", async (req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'posts'
            ORDER BY ordinal_position`
      );
      res.json({ columns: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Posts
  app.get(api.posts.list.path, async (req, res) => {
    const isAdminUser = req.isAuthenticated() && (req.user as any).role === "admin";
    const requestAll = req.query.all === "true" || req.query.admin === "true";
    const approvedOnly = !(isAdminUser && requestAll);
    const posts = await storage.getPosts(approvedOnly);
    res.json(posts);
  });

  app.get(api.posts.get.path, async (req, res) => {
    const post = await storage.getPostBySlug(req.params.slug as string);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const isAdminUser = req.isAuthenticated() && (req.user as any).role === "admin";
    if (!isAdminUser) {
      const now = new Date();
      if (!post.isApproved || (post.publishedAt && new Date(post.publishedAt) > now)) {
        return res.status(404).json({ message: 'Post not found' });
      }
    }
    res.json(post);
  });

  app.delete("/api/posts/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deletePost(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.patch("/api/posts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log(`[POSTS] Updating post ${req.params.id}... Payload size: ${JSON.stringify(req.body).length} bytes`);
      const input = insertPostSchema.partial().parse(req.body);
      const post = await storage.updatePost(parseInt(req.params.id), input);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error: any) {
      console.error(`[POSTS] Update failed for post ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  app.patch("/api/admin/posts/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    const post = await storage.approvePost(parseInt(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const input = insertPostSchema.parse(req.body);
      console.log(`[POSTS] Creating new post... Payload size: ${JSON.stringify(input).length} bytes`);
      console.log(`[POSTS] Input keys: ${Object.keys(input).join(', ')}`);
      const post = await storage.createPost(input);
      res.status(201).json(post);
    } catch (error: any) {
      console.error("[POSTS] Creation failed:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      // Include the underlying DB cause in the response for easier debugging
      const cause = error?.cause?.message || error?.cause?.detail || "";
      const fullMessage = cause ? `${error.message} | Causa: ${cause}` : (error.message || "Internal server error");
      res.status(500).json({ message: fullMessage });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    const post = await storage.likePost(parseInt(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  // Comments (Public)
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const input = insertCommentSchema.parse({
        ...req.body,
        postId: parseInt(req.params.postId)
      });
      const comment = await storage.createComment(input);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    const comments = await storage.getComments(parseInt(req.params.postId), true);
    res.json(comments);
  });

  // Comments (Admin Moderation)
  app.get("/api/admin/comments", isAuthenticated, isAdmin, async (req, res) => {
    const comments = await storage.getComments(undefined, false);
    res.json(comments);
  });

  app.patch("/api/admin/comments/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    const comment = await storage.approveComment(parseInt(req.params.id));
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  });

  app.delete("/api/admin/comments/:id", isAdmin, async (req, res) => {
    await storage.deleteComment(Number(req.params.id));
    res.sendStatus(204);
  });

  // Reviews
  app.get("/api/reviews", async (req, res) => {
    const reviews = await storage.getReviews(true);
    res.json(reviews);
  });

  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const input = insertReviewSchema.parse(req.body);
      const review = await storage.createReview((req.user as any).id, input);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  // Admin Reviews
  app.get("/api/admin/reviews", isAdmin, async (req, res) => {
    const reviews = await storage.getReviews(false);
    res.json(reviews);
  });

  app.patch("/api/admin/reviews/:id", isAdmin, async (req, res) => {
    const updated = await storage.approveReview(Number(req.params.id));
    if (!updated) return res.status(404).json({ message: "Review not found" });
    res.json(updated);
  });

  app.delete("/api/admin/reviews/:id", isAdmin, async (req, res) => {
    await storage.deleteReview(Number(req.params.id));
    res.sendStatus(204);
  });


  // Services
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.delete("/api/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteService(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.post("/api/services", isAuthenticated, isAdmin, async (req, res) => {
    const input = req.body;
    const service = await storage.createService(input);
    res.status(201).json(service);
  });

  app.patch("/api/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.updateService(id, req.body);
      if (!service) return res.status(404).json({ message: "Service not found" });
      res.json(service);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error updating service" });
    }
  });

  // Inquiries
  app.post(api.inquiries.create.path, async (req, res) => {
    try {
      const input = api.inquiries.create.input.parse(req.body);
      const userId = req.isAuthenticated() ? (req.user as any).id : null;
      
      // Find a fallback admin/employee if no logged-in user
      let attributionId = userId;
      if (!attributionId) {
        const teamMembers = await storage.getUsers();
        const defaultAdmin = teamMembers.find(u => u.role === "admin" || u.role === "employee");
        attributionId = defaultAdmin ? defaultAdmin.id : 1; // Fallback to 1 if no admin found yet
      }

      // Save the inquiry for the user's history
      const inquiry = await storage.createInquiry({ ...input, userId });

      // Integration with CRM: Check for contact and create Lead
      const contacts = await storage.getContacts();
      let contact = contacts.find(c => c.email === input.email);
      
      if (!contact) {
        contact = await storage.createContact({
          type: "individual",
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          document: null,
          address: null,
          status: "Ativo",
          assignedTo: attributionId
        });
      } else if (input.phone && !contact.phone) {
        await storage.updateContact(contact.id, { phone: input.phone });
      }

      const lead = await storage.createLead({
        contactId: contact.id,
        status: "new",
        value: null,
        source: "Website Inquérito",
        notes: `Mensagem: ${input.message}`,
      });

      await storage.createInteraction({
        contactId: contact.id,
        leadId: lead.id,
        userId: attributionId,
        type: "Web Inquiry",
        description: `Cliente solicitou cotação pelo site: ${input.message}`,
        date: new Date()
      });

      res.status(201).json(inquiry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Inquiry error:", err);
      res.status(400).json({ message: "Invalid inquiry data" });
    }
  });

  app.get("/api/my-inquiries", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const inquiries = await storage.getInquiriesByUserId(userId);
    res.json(inquiries);
  });


  // CRM Routes

  // Contacts
  app.get("/api/contacts", isTeam, async (req, res) => {
    const contacts = await storage.getContacts();
    res.json(contacts);
  });

  app.patch("/api/contacts/:id", isTeam, async (req, res) => {
    const contact = await storage.updateContact(parseInt(req.params.id), req.body);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  });

  app.delete("/api/contacts/:id", isTeam, async (req, res) => {
    await storage.deleteContact(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.get("/api/contacts/:id", isTeam, async (req, res) => {
    const contact = await storage.getContact(parseInt(req.params.id));
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  });

  app.post("/api/contacts/:id/send-birthday-email", isTeam, async (req, res) => {
    try {
      const contact = await storage.getContact(parseInt(req.params.id));
      if (!contact) return res.status(404).json({ message: "Contato não encontrado" });
      if (!contact.email) return res.status(400).json({ message: "Contato não possui e-mail cadastrado" });

      let age: number | null = null;
      if (contact.anniversaryDate) {
        const parts = contact.anniversaryDate.split("/");
        if (parts.length === 3) {
          const year = parseInt(parts[2]);
          if (year) age = new Date().getFullYear() - year;
        }
      }

      const result = await sendBirthdayEmailToContact(contact.email, contact.name, age);
      if (!result.success) {
        return res.status(500).json({ message: result.error || "Falha ao enviar e-mail comemorativo" });
      }

      // Record an interaction
      const userId = req.isAuthenticated() ? (req.user as any).id : 1;
      await storage.createInteraction({
        contactId: contact.id,
        userId,
        type: "E-mail Aniversário",
        description: `E-mail comemorativo de aniversário enviado com sucesso para ${contact.email}.`,
        date: new Date(),
      }).catch(() => {});

      res.json({ success: true, message: `E-mail comemorativo enviado com sucesso para ${contact.name}!` });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erro interno ao disparar e-mail" });
    }
  });

  app.post("/api/contacts", isTeam, async (req, res) => {
    try {
      const input = insertContactSchema.parse(req.body);
      const result = await storage.upsertContact(input);
      res.status(result.isNew ? 201 : 200).json(result.contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.post("/api/contacts/import", isTeam, async (req, res) => {
    try {
      const items = Array.isArray(req.body) ? req.body : [req.body];
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const raw of items) {
        try {
          const payload: InsertContact = {
            type: raw.tipo === "company" ? "company" : "individual",
            name: raw.nome || raw.name || "Novo Contato",
            email: raw.email || null,
            phone: raw.telefone || raw.phone || null,
            document: raw.documento || raw.document || null,
            address: raw.endereco || raw.address || null,
            productType: raw.productType || raw.tipoProduto || raw.produtos || null,
            status: raw.status || "Ativo",
            responsibleName: raw.responsibleName || raw.responsavel || null,
          };
          const input = insertContactSchema.parse(payload);
          const result = await storage.upsertContact(input);
          if (result.isNew) created++;
          else updated++;
        } catch (e) {
          errors++;
        }
      }

      res.json({ success: true, created, updated, errors });
    } catch (err) {
      res.status(500).json({ message: "Erro ao processar importação" });
    }
  });

  app.post("/api/contacts/deduplicate", isTeam, async (req, res) => {
    try {
      const result = await storage.deduplicateContacts();
      res.json({ success: true, mergedCount: result.mergedCount });
    } catch (err) {
      res.status(500).json({ message: "Erro ao higienizar duplicatas" });
    }
  });

  // Leads
  app.get("/api/leads", isTeam, async (req, res) => {
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const leads = await storage.getLeads(contactId);
    res.json(leads);
  });

  app.post("/api/leads", isTeam, async (req, res) => {
    try {
      const input = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(input);

      // Trigger Todoist automations
      await storage.triggerTodoistAutomations('new_lead', {
        leadId: lead.id,
        contactId: lead.contactId,
        assignedUserId: (req.user as any)?.id,
      });

      // Notify assigned user if different from creator
      if (lead.assignedTo && lead.assignedTo !== (req.user as any)?.id) {
        const contact = await storage.getContact(lead.contactId);
        const actor = await storage.getUser((req.user as any)?.id);
        const { subject, html } = buildLeadAssignedEmail({
          recipientName: "",
          assignerName: actor?.name || "Sistema",
          clientName: contact?.name || `Contato #${lead.contactId}`,
          leadId: lead.id,
          product: lead.product || undefined,
          value: lead.value || undefined,
          status: lead.status,
        });
        sendCrmNotification({ userId: lead.assignedTo, eventType: "lead_assigned", recordType: "lead", recordId: lead.id, subject, htmlBody: html }).catch(() => {});
      }

      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/leads/:id/status", isTeam, async (req, res) => {
    const leadBefore = await storage.getLead(parseInt(req.params.id));
    const lead = await storage.updateLeadStatus(parseInt(req.params.id), req.body.status);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Trigger Todoist automations
    await storage.triggerTodoistAutomations('lead_status_changed', {
      leadId: lead.id,
      contactId: lead.contactId,
      assignedUserId: (req.user as any)?.id,
      title: `Status: ${req.body.status}`,
    });

    if (req.body.status === 'implemented' || req.body.status === 'closed') {
      await storage.triggerTodoistAutomations('deal_closed', {
        leadId: lead.id,
        contactId: lead.contactId,
        assignedUserId: (req.user as any)?.id,
      });
    }

    // Notify responsible user of status change
    if (lead.assignedTo && lead.assignedTo !== (req.user as any)?.id) {
      const contact = await storage.getContact(lead.contactId);
      const actor = await storage.getUser((req.user as any)?.id);
      const { subject, html } = buildLeadStatusChangedEmail({
        recipientName: "",
        changerName: actor?.name || "Sistema",
        clientName: contact?.name || `Contato #${lead.contactId}`,
        leadId: lead.id,
        oldStatus: leadBefore?.status || "?",
        newStatus: req.body.status,
        product: lead.product || undefined,
      });
      sendCrmNotification({ userId: lead.assignedTo, eventType: "lead_status_changed", recordType: "lead", recordId: lead.id, subject, htmlBody: html }).catch(() => {});
    }

    res.json(lead);
  });

  app.patch("/api/leads/:id", isTeam, async (req, res) => {
    const leadBefore = await storage.getLead(parseInt(req.params.id));
    const lead = await storage.updateLead(parseInt(req.params.id), req.body);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Notify newly assigned user
    if (
      lead.assignedTo &&
      lead.assignedTo !== (req.user as any)?.id &&
      lead.assignedTo !== leadBefore?.assignedTo
    ) {
      const contact = await storage.getContact(lead.contactId);
      const actor = await storage.getUser((req.user as any)?.id);
      const { subject, html } = buildLeadAssignedEmail({
        recipientName: "",
        assignerName: actor?.name || "Sistema",
        clientName: contact?.name || `Contato #${lead.contactId}`,
        leadId: lead.id,
        product: lead.product || undefined,
        value: lead.value || undefined,
        status: lead.status,
      });
      sendCrmNotification({ userId: lead.assignedTo, eventType: "lead_assigned", recordType: "lead", recordId: lead.id, subject, htmlBody: html }).catch(() => {});
    }

    res.json(lead);
  });

  app.delete("/api/leads/:id", isTeam, async (req, res) => {
    await storage.deleteLead(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Interactions
  app.get("/api/interactions", isTeam, async (req, res) => {
    const leadId = req.query.leadId ? parseInt(req.query.leadId as string) : undefined;
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const interactions = await storage.getInteractions(leadId, contactId);
    res.json(interactions);
  });

  app.post("/api/interactions", isTeam, async (req, res) => {
    try {
      const input = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction({
        ...input,
        userId: (req.user as any).id,
      });
      res.status(201).json(interaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  // Products
  app.get("/api/products", isTeam, async (req, res) => {
    const activeOnly = req.query.activeOnly === "true";
    const products = await storage.getProducts(activeOnly);
    res.json(products);
  });

  app.post("/api/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(parseInt(req.params.id), req.body);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteProduct(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Campaigns
  app.get("/api/campaigns", isTeam, async (req, res) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });

  app.post("/api/campaigns", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(input);
      res.status(201).json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteCampaign(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Users Management
  app.get("/api/users", isAdmin, async (req, res) => {
    const result = await storage.getUsers();
    // Don't leak passwords
    res.json(result.map(({ password, ...user }) => user));
  });

  app.patch("/api/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    const user = await storage.updateUserRole(parseInt(req.params.id), req.body.role);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // Admin: Create user
  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, password, name, role, email } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ message: "username, password e name são obrigatórios" });
      }
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Formato de e-mail inválido" });
        }
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        role: role || "employee",
        email: email || null,
        mustChangePassword: true, // Force password change on first login
      });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Admin: Update user email
  app.patch("/api/admin/users/:id/email", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "E-mail é obrigatório" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Formato de e-mail inválido" });
      }
      const updatedUser = await storage.updateUserEmail(parseInt(req.params.id), email);
      if (!updatedUser) return res.status(404).json({ message: "Usuário não encontrado" });
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar e-mail" });
    }
  });

  app.patch("/api/admin/users/:id/password", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 6 caracteres" });
      }
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(parseInt(req.params.id), hashedPassword);
      if (!updatedUser) return res.status(404).json({ message: "Usuário não encontrado" });
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ message: "Erro ao alterar senha do usuário" });
    }
  });

  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;

      const isValid = await comparePasswords(currentPassword, user.password);

      if (!isValid) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // Admin: Delete user
  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const currentUser = req.user as any;
    if (currentUser.id === id) {
      return res.status(400).json({ message: "Você não pode deletar sua própria conta" });
    }
    await storage.deleteUser(id);
    res.sendStatus(204);
  });

  // Admin: Update user anniversary date
  app.patch("/api/admin/users/:id/anniversary", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { anniversaryDate } = req.body;
      const id = parseInt(req.params.id);
      const [updated] = await db
        .update(users)
        .set({ anniversaryDate })
        .where(eq(users.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar aniversário do usuário" });
    }
  });

  // ============================================================
  // CONTACT FILES (ANEXOS / ARQUIVOS DO CONTATO)
  // ============================================================
  app.get("/api/contacts/:id/files", isAuthenticated, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const files = await db
        .select()
        .from(contactFiles)
        .where(eq(contactFiles.contactId, contactId))
        .orderBy(desc(contactFiles.createdAt));
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/contacts/:id/files", isAuthenticated, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const { fileName, fileUrl, fileType, fileSize } = req.body;
      if (!fileName || !fileUrl) {
        return res.status(400).json({ message: "Nome e arquivo são obrigatórios" });
      }
      const currentUser = req.user as any;
      const [newFile] = await db
        .insert(contactFiles)
        .values({
          contactId,
          fileName,
          fileUrl,
          fileType: fileType || null,
          fileSize: fileSize || null,
          uploadedBy: currentUser?.id || null,
        })
        .returning();
      res.status(201).json(newFile);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/contact-files/:id", isAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      await db.delete(contactFiles).where(eq(contactFiles.id, fileId));
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ============================================================
  // GERAR CONTA DO CLIENTE & PRIMEIRO ACESSO
  // ============================================================
  app.post("/api/contacts/:id/generate-account", isAuthenticated, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId));
      if (!contact) {
        return res.status(404).json({ message: "Contato não encontrado" });
      }
      if (!contact.email || !contact.email.includes("@")) {
        return res.status(400).json({ message: "O contato precisa ter um e-mail válido cadastrado para gerar conta." });
      }

      const existingUsers = await db.select().from(users).where(eq(users.email, contact.email));
      let clientUser = existingUsers[0];

      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      if (!clientUser) {
        const dummyPassword = await hashPassword(Math.random().toString(36));
        let username = contact.email.toLowerCase().trim();
        const checkUsername = await db.select().from(users).where(eq(users.username, username));
        if (checkUsername.length > 0) {
          username = `${username}_${Math.floor(Math.random() * 1000)}`;
        }

        const [newUser] = await db
          .insert(users)
          .values({
            username,
            name: contact.name,
            email: contact.email,
            password: dummyPassword,
            role: "client",
            contactId: contact.id,
            isFirstLogin: true,
            firstLoginToken: token,
            firstLoginTokenExpires: tokenExpires,
          })
          .returning();
        clientUser = newUser;
      } else {
        const [updatedUser] = await db
          .update(users)
          .set({
            role: "client",
            contactId: contact.id,
            isFirstLogin: true,
            firstLoginToken: token,
            firstLoginTokenExpires: tokenExpires,
          })
          .where(eq(users.id, clientUser.id))
          .returning();
        clientUser = updatedUser;
      }

      const protocol = req.protocol || "http";
      const host = req.get("host") || "localhost:5000";
      const setupUrl = `${protocol}://${host}/criar-senha?token=${token}`;

      const emailRes = await sendClientWelcomeEmail({
        clientName: contact.name,
        email: contact.email,
        setupUrl,
      });

      if (emailRes.success) {
        res.json({
          message: `Conta gerada com sucesso! E-mail de boas-vindas enviado para ${contact.email}.`,
          user: clientUser,
          setupUrl,
          emailSent: true,
        });
      } else {
        console.warn(`[generate-account] E-mail não pôde ser enviado para ${contact.email}: ${emailRes.error}`);
        res.json({
          message: `Conta gerada com sucesso! (${emailRes.error || "Credenciais de e-mail não configuradas"}). Link de primeiro acesso para o cliente: ${setupUrl}`,
          user: clientUser,
          setupUrl,
          emailSent: false,
          emailError: emailRes.error,
        });
      }
    } catch (err: any) {
      console.error("Erro ao gerar conta do cliente:", err);
      res.status(500).json({ message: err.message || "Erro ao gerar conta do cliente" });
    }
  });

  app.get("/api/verify-first-login-token", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ valid: false, message: "Token não fornecido" });
      }
      const matched = await db.select().from(users).where(eq(users.firstLoginToken, token));
      const user = matched[0];
      if (!user) {
        return res.status(404).json({ valid: false, message: "Link expirado ou inválido" });
      }
      if (user.firstLoginTokenExpires && new Date(user.firstLoginTokenExpires) < new Date()) {
        return res.status(400).json({ valid: false, message: "Este link de primeiro acesso expirou. Solicite um novo à Monteiro Corretora." });
      }
      res.json({ valid: true, name: user.name, email: user.email });
    } catch (err: any) {
      res.status(500).json({ valid: false, message: err.message });
    }
  });

  app.post("/api/set-first-login-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password || password.length < 6) {
        return res.status(400).json({ message: "A senha deve conter no mínimo 6 caracteres" });
      }
      const matched = await db.select().from(users).where(eq(users.firstLoginToken, token));
      const user = matched[0];
      if (!user) {
        return res.status(404).json({ message: "Token de primeiro acesso inválido" });
      }
      const hashedPassword = await hashPassword(password);
      const [updatedUser] = await db
        .update(users)
        .set({
          password: hashedPassword,
          isFirstLogin: false,
          firstLoginToken: null,
          firstLoginTokenExpires: null,
          mustChangePassword: false,
        })
        .where(eq(users.id, user.id))
        .returning();

      req.login(updatedUser, (err) => {
        if (err) return res.status(200).json({ message: "Senha cadastrada com sucesso! Faça login para prosseguir.", user: updatedUser });
        res.json({ message: "Senha cadastrada com sucesso!", user: updatedUser });
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ============================================================
  // INSURANCE MODULE ROUTES
  // ============================================================

  // Dashboard de Seguros
  app.get("/api/seguros/dashboard", isTeam, async (req, res) => {
    try {
      const stats = await storage.getDashboardSeguros();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Clientes de Seguro
  app.get("/api/clientes", isTeam, async (req, res) => {
    const filters = {
      search: req.query.search as string | undefined,
      seguradoraNome: req.query.seguradora as string | undefined,
      status: req.query.status as string | undefined,
      tags: req.query.tags as string | undefined,
    };
    const result = await storage.getClientes(filters);
    res.json(result);
  });

  app.get("/api/clientes/:id", isTeam, async (req, res) => {
    const cliente = await storage.getCliente(parseInt(req.params.id));
    if (!cliente) return res.status(404).json({ message: "Cliente não encontrado" });
    res.json(cliente);
  });

  app.post("/api/clientes", isTeam, async (req, res) => {
    try {
      const {
        idProposta,
        idApolice,
        numeroApolice,
        pdfApolice,
        cobertura,
        premio,
        dataEmissao,
        inicioVigencia,
        statusApolice,
        numeroProposta,
        seguradora,
        fimVigencia,
        linkFatura,
        formaPagamento,
        mesAtraso,
        faturasAberto,
        ...clientData
      } = req.body;

      const parsedClientData = insertClienteSchema.parse(clientData);

      const cleanName = (parsedClientData.nome || "").trim().toLowerCase();
      const cleanDoc = (parsedClientData.cpfCnpj || "").trim();

      let existingCliente: any = null;
      if (cleanDoc) {
        [existingCliente] = await db
          .select()
          .from(clientes)
          .where(
            or(
              eq(sql`lower(nome)`, cleanName),
              eq(clientes.cpfCnpj, cleanDoc)
            )
          );
      } else if (cleanName) {
        [existingCliente] = await db
          .select()
          .from(clientes)
          .where(eq(sql`lower(nome)`, cleanName));
      }

      let cliente: any = null;

      if (existingCliente) {
        const updateData: any = {};
        for (const key of Object.keys(parsedClientData)) {
          const existingVal = (existingCliente as any)[key];
          const newVal = (parsedClientData as any)[key];
          if (
            (existingVal === null || existingVal === "" || existingVal === undefined) &&
            newVal !== undefined && newVal !== null && newVal !== ""
          ) {
            updateData[key] = newVal;
          }
        }
        if (Object.keys(updateData).length > 0) {
          cliente = await storage.updateCliente(existingCliente.id, updateData);
        } else {
          cliente = existingCliente;
        }
      } else {
        cliente = await storage.createCliente(parsedClientData);
      }

      const cleanContactName = (cliente.nome || "").trim().toLowerCase();
      const cleanContactDoc = (cliente.cpfCnpj || "").trim();

      let existingContact: any = null;
      if (cleanContactDoc) {
        [existingContact] = await db
          .select()
          .from(contacts)
          .where(
            or(
              eq(sql`lower(name)`, cleanContactName),
              eq(contacts.document, cleanContactDoc)
            )
          );
      } else if (cleanContactName) {
        [existingContact] = await db
          .select()
          .from(contacts)
          .where(eq(sql`lower(name)`, cleanContactName));
      }

      if (!existingContact) {
        const numericDoc = (cliente.cpfCnpj || "").replace(/\D/g, "");
        const type = numericDoc.length > 11 ? "company" : "individual";
        
        await storage.createContact({
          type,
          name: cliente.nome,
          email: cliente.email || null,
          phone: cliente.telefone || null,
          document: cliente.cpfCnpj || null,
          address: cliente.endereco || null,
          status: "Ativo",
          responsibleName: type === "company" ? (cliente.nomeRepresentante || cliente.nome) : null,
          responsibleId: null,
          anniversaryDate: null,
          maritalStatus: null,
          assignedTo: cliente.responsavelComercialId || null,
        });
      }

      let seguradoraId: number | null = null;
      if (seguradora && String(seguradora).trim() !== "") {
        const cleanSegName = String(seguradora).trim().toLowerCase();
        const [existingSeg] = await db
          .select()
          .from(seguradoras)
          .where(eq(sql`lower(nome)`, cleanSegName));
        
        if (existingSeg) {
          seguradoraId = existingSeg.id;
        } else {
          const newSeg = await storage.createSeguradora({ nome: String(seguradora).trim() });
          seguradoraId = newSeg.id;
        }
      }

      const hasPolicyFields = 
        numeroApolice || idProposta || idApolice || seguradoraId || premio || 
        inicioVigencia || fimVigencia || pdfApolice || cobertura || dataEmissao || 
        numeroProposta || linkFatura || formaPagamento || mesAtraso || faturasAberto;

      if (hasPolicyFields) {
        const parseExcelDate = (val: any): Date | null => {
          if (!val) return null;
          if (val instanceof Date) return val;
          if (typeof val === "number" || !isNaN(Number(val))) {
            const num = Number(val);
            return new Date((num - 25569) * 86400 * 1000);
          }
          const str = String(val).trim();
          if (!str) return null;
          const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (dmy) {
            return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
          }
          const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
          if (ymd) {
            return new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
          }
          const parsed = new Date(str);
          return isNaN(parsed.getTime()) ? null : parsed;
        };

        let statusMap = "ativa";
        const rawStatus = (statusApolice || "").toLowerCase().trim();
        if (rawStatus.includes("venc") || rawStatus.includes("exp")) {
          statusMap = "vencida";
        } else if (rawStatus.includes("canc")) {
          statusMap = "cancelada";
        } else if (rawStatus.includes("pend")) {
          statusMap = "pendente";
        } else if (rawStatus.includes("atraso") || rawStatus.includes("aberto") || rawStatus.includes("inadimpl")) {
          statusMap = "em_atraso";
        }

        const apolQuery: any[] = [];
        if (numeroApolice && String(numeroApolice).trim() !== "") {
          apolQuery.push(eq(apolices.numeroApolice, String(numeroApolice).trim()));
        }
        if (idProposta && String(idProposta).trim() !== "") {
          apolQuery.push(eq(apolices.idProposta, String(idProposta).trim()));
        }
        if (idApolice && String(idApolice).trim() !== "") {
          apolQuery.push(eq(apolices.idApolice, String(idApolice).trim()));
        }

        let existingApolice: any = null;
        if (apolQuery.length > 0) {
          [existingApolice] = await db
            .select()
            .from(apolices)
            .where(or(...apolQuery));
        }

        const apolData = {
          clienteId: cliente.id,
          seguradoraId,
          numeroApolice: numeroApolice ? String(numeroApolice).trim() : null,
          status: statusMap,
          inicioVigencia: parseExcelDate(inicioVigencia),
          fimVigencia: parseExcelDate(fimVigencia),
          premio: premio ? (() => {
            const raw = String(premio).trim().replace(/^R\$\s*/i, "").trim();
            // Brazilian: 1.234,56 → remove dot thousands sep, comma→dot
            if (raw.includes(",") && raw.includes(".")) return raw.replace(/\./g, "").replace(",", ".");
            // Brazilian: 1234,56 → comma as decimal
            if (raw.includes(",")) return raw.replace(",", ".");
            // ISO/US: 356.16 already valid
            return raw;
          })() : null,
          idProposta: idProposta ? String(idProposta).trim() : null,
          idApolice: idApolice ? String(idApolice).trim() : null,
          pdfApolice: pdfApolice ? String(pdfApolice).trim() : null,
          cobertura: cobertura ? String(cobertura).trim() : null,
          dataEmissao: parseExcelDate(dataEmissao),
          numeroProposta: numeroProposta ? String(numeroProposta).trim() : null,
          linkFatura: linkFatura ? String(linkFatura).trim() : null,
          formaPagamento: formaPagamento ? String(formaPagamento).trim() : null,
          mesAtraso: mesAtraso ? String(mesAtraso).trim() : null,
          faturasAberto: faturasAberto ? String(faturasAberto).trim() : null,
        };

        if (existingApolice) {
          const apolUpdate: any = {};
          for (const key of Object.keys(apolData)) {
            const existingVal = (existingApolice as any)[key];
            const newVal = (apolData as any)[key];
            if (
              (existingVal === null || existingVal === "" || existingVal === undefined) &&
              newVal !== undefined && newVal !== null && newVal !== ""
            ) {
              apolUpdate[key] = newVal;
            }
          }
          if (Object.keys(apolUpdate).length > 0) {
            await storage.updateApolice(existingApolice.id, apolUpdate);
          }
        } else {
          await storage.createApolice(apolData as any);
        }
      }

      res.status(201).json(cliente);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/clientes/:id", isTeam, async (req, res) => {
    try {
      const input = insertClienteSchema.partial().parse(req.body);
      const cliente = await storage.updateCliente(parseInt(req.params.id), input);
      if (!cliente) return res.status(404).json({ message: "Cliente não encontrado" });
      res.json(cliente);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/clientes/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteCliente(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Apólices
  app.get("/api/apolices", isTeam, async (req, res) => {
    const clienteId = req.query.clienteId ? parseInt(req.query.clienteId as string) : undefined;
    const filters = {
      produtoId: req.query.produtoId ? parseInt(req.query.produtoId as string) : undefined,
      seguradoraId: req.query.seguradoraId ? parseInt(req.query.seguradoraId as string) : undefined,
      corretorId: req.query.corretorId ? parseInt(req.query.corretorId as string) : undefined,
      status: req.query.status as string | undefined,
    };
    const result = await storage.getApolices(clienteId, filters);
    res.json(result);
  });

  app.get("/api/clientes/:id/apolices", isTeam, async (req, res) => {
    const result = await storage.getApolices(parseInt(req.params.id));
    res.json(result);
  });

  app.get("/api/apolices/:id", isTeam, async (req, res) => {
    const apolice = await storage.getApolice(parseInt(req.params.id));
    if (!apolice) return res.status(404).json({ message: "Apólice não encontrada" });
    res.json(apolice);
  });

  app.post("/api/apolices", isTeam, async (req, res) => {
    try {
      const input = insertApoliceSchema.parse(req.body);
      const apolice = await storage.createApolice(input);
      res.status(201).json(apolice);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/apolices/:id", isTeam, async (req, res) => {
    try {
      const input = insertApoliceSchema.partial().parse(req.body);
      const apolice = await storage.updateApolice(parseInt(req.params.id), input);
      if (!apolice) return res.status(404).json({ message: "Apólice não encontrada" });
      res.json(apolice);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/apolices/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteApolice(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Seguradoras
  app.get("/api/seguradoras", isTeam, async (req, res) => {
    const result = await storage.getSeguradoras();
    res.json(result);
  });

  app.post("/api/seguradoras", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertSeguradoraSchema.parse(req.body);
      const seg = await storage.createSeguradora(input);
      res.status(201).json(seg);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/seguradoras/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertSeguradoraSchema.partial().parse(req.body);
      const seg = await storage.updateSeguradora(parseInt(req.params.id), input);
      if (!seg) return res.status(404).json({ message: "Seguradora não encontrada" });
      res.json(seg);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/seguradoras/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteSeguradora(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Produtos de Seguro
  app.get("/api/produtos-seguro", isTeam, async (req, res) => {
    const result = await storage.getProdutosSeguro();
    res.json(result);
  });

  app.post("/api/produtos-seguro", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertProdutoSeguroSchema.parse(req.body);
      const produto = await storage.createProdutoSeguro(input);
      res.status(201).json(produto);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/produtos-seguro/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertProdutoSeguroSchema.partial().parse(req.body);
      const produto = await storage.updateProdutoSeguro(parseInt(req.params.id), input);
      if (!produto) return res.status(404).json({ message: "Produto não encontrado" });
      res.json(produto);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/produtos-seguro/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteProdutoSeguro(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Tasks

  app.get("/api/tasks", isTeam, async (req, res) => {
    const user = req.user as any;
    let assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const status = req.query.status as string | undefined;

    // RBAC: Employees can ONLY see their own tasks
    if (user.role === "employee") {
      assignedTo = user.id;
    }

    const tasks = await storage.getTasks(assignedTo, contactId, status);
    res.json(tasks);
  });

  app.post("/api/tasks", isTeam, async (req, res) => {
    try {
      const input = insertTaskSchema.parse({
        ...req.body,
        createdBy: (req.user as any).id,
      });
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/tasks/:id/status", isAuthenticated, async (req, res) => {
    const task = await storage.updateTaskStatus(parseInt(req.params.id), req.body.status);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.patch("/api/tasks/:id", isTeam, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { id: _, createdAt: __, createdBy: ___, ...updateData } = req.body;
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      const task = await storage.updateTask(id, updateData);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao atualizar tarefa" });
    }
  });

  app.delete("/api/tasks/:id", isTeam, async (req, res) => {
    await storage.deleteTask(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // ============================================================
  // TODOIST API ENDPOINTS
  // ============================================================

  // Projects
  app.get("/api/todoist/projects", isTeam, async (req, res) => {
    const projects = await storage.getTodoistProjects((req.user as any)?.id);
    res.json(projects);
  });

  app.post("/api/todoist/projects", isTeam, async (req, res) => {
    try {
      const input = insertTodoistProjectSchema.parse({ ...req.body, createdBy: (req.user as any)?.id });
      const project = await storage.createTodoistProject(input);
      res.status(201).json(project);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  });

  app.patch("/api/todoist/projects/:id", isTeam, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateTodoistProject(id, req.body);
    if (!updated) return res.status(404).json({ message: "Projeto não encontrado" });
    res.json(updated);
  });

  app.delete("/api/todoist/projects/:id", isTeam, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTodoistProject(id);
    res.sendStatus(204);
  });

  // Labels
  app.get("/api/todoist/labels", isTeam, async (req, res) => {
    const labels = await storage.getTodoistLabels();
    res.json(labels);
  });

  app.post("/api/todoist/labels", isTeam, async (req, res) => {
    try {
      const input = insertTodoistLabelSchema.parse({ ...req.body, createdBy: (req.user as any)?.id });
      const label = await storage.createTodoistLabel(input);
      res.status(201).json(label);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  });

  app.delete("/api/todoist/labels/:id", isTeam, async (req, res) => {
    await storage.deleteTodoistLabel(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Tasks
  app.get("/api/todoist/tasks", isTeam, async (req, res) => {
    let assignedToFilter: number | undefined = undefined;
    const userRole = (req.user as any)?.role;
    const currentUserId = (req.user as any)?.id;

    if (req.query.assignedTo) {
      if (req.query.assignedTo === "all") {
        assignedToFilter = undefined;
      } else if (req.query.assignedTo === "me") {
        assignedToFilter = currentUserId;
      } else {
        assignedToFilter = parseInt(req.query.assignedTo as string);
      }
    } else if (userRole !== "admin") {
      // Non-admin users view their own tasks by default
      assignedToFilter = currentUserId;
    }

    const filters = {
      view: req.query.view as string,
      projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
      priority: req.query.priority as string,
      labelId: req.query.labelId ? parseInt(req.query.labelId as string) : undefined,
      assignedTo: assignedToFilter,
      contactId: req.query.contactId ? parseInt(req.query.contactId as string) : undefined,
      leadId: req.query.leadId ? parseInt(req.query.leadId as string) : undefined,
      clienteId: req.query.clienteId ? parseInt(req.query.clienteId as string) : undefined,
      apoliceId: req.query.apoliceId ? parseInt(req.query.apoliceId as string) : undefined,
      search: req.query.search as string,
      status: req.query.status as string,
      kanbanColumn: req.query.kanbanColumn as string,
    };
    const tasksList = await storage.getTodoistTasks(filters);
    res.json(tasksList);
  });

  app.get("/api/todoist/tasks/:id", isTeam, async (req, res) => {
    const task = await storage.getTodoistTask(parseInt(req.params.id));
    if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });
    res.json(task);
  });

  app.post("/api/todoist/tasks", isTeam, async (req, res) => {
    try {
      const { subtaskTitles, labelIds, ...taskData } = req.body;
      const parsed = insertTodoistTaskSchema.parse({
        ...taskData,
        createdBy: (req.user as any)?.id,
        assignedTo: taskData.assignedTo || (req.user as any)?.id,
      });

      const task = await storage.createTodoistTask(parsed, subtaskTitles, labelIds, (req.user as any)?.id);
      res.status(201).json(task);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  });

  app.patch("/api/todoist/tasks/:id", isTeam, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { subtasksList, labelIds, ...updates } = req.body;
      const updated = await storage.updateTodoistTask(id, updates, subtasksList, labelIds, (req.user as any)?.id);
      if (!updated) return res.status(404).json({ message: "Tarefa não encontrada" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/todoist/tasks/:id/complete", isTeam, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any)?.id || 1;
      const result = await storage.completeTodoistTask(id, userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/todoist/tasks/:id", isTeam, async (req, res) => {
    await storage.deleteTodoistTask(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Subtasks
  app.post("/api/todoist/subtasks", isTeam, async (req, res) => {
    try {
      const input = insertTodoistSubtaskSchema.parse(req.body);
      const subtask = await storage.createTodoistSubtask(input);
      res.status(201).json(subtask);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/todoist/subtasks/:id", isTeam, async (req, res) => {
    const id = parseInt(req.params.id);
    const subtask = await storage.updateTodoistSubtask(id, req.body.completed, req.body.title);
    if (!subtask) return res.status(404).json({ message: "Subtarefa não encontrada" });
    res.json(subtask);
  });

  app.delete("/api/todoist/subtasks/:id", isTeam, async (req, res) => {
    await storage.deleteTodoistSubtask(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Comments
  app.get("/api/todoist/tasks/:id/comments", isTeam, async (req, res) => {
    const commentsList = await storage.getTodoistComments(parseInt(req.params.id));
    res.json(commentsList);
  });

  app.post("/api/todoist/tasks/:id/comments", isTeam, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      const input = insertTodoistCommentSchema.parse({ ...req.body, taskId, userId });
      const newComment = await storage.createTodoistComment(input);
      res.status(201).json(newComment);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Activity Logs
  app.get("/api/todoist/tasks/:id/activity", isTeam, async (req, res) => {
    const logs = await storage.getTodoistActivityLogs(parseInt(req.params.id));
    res.json(logs);
  });

  // Automations
  app.get("/api/todoist/automations", isTeam, async (req, res) => {
    const automations = await storage.getTodoistAutomations();
    res.json(automations);
  });

  app.post("/api/todoist/automations", isAdmin, async (req, res) => {
    try {
      const input = insertTodoistAutomationSchema.parse(req.body);
      const auto = await storage.createTodoistAutomation(input);
      res.status(201).json(auto);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  });

  app.patch("/api/todoist/automations/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateTodoistAutomation(id, req.body);
    if (!updated) return res.status(404).json({ message: "Automação não encontrada" });
    res.json(updated);
  });

  app.delete("/api/todoist/automations/:id", isAdmin, async (req, res) => {
    await storage.deleteTodoistAutomation(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Notifications
  app.get("/api/todoist/notifications", isTeam, async (req, res) => {
    const userId = (req.user as any)?.id;
    const notifs = await storage.getTodoistNotifications(userId);
    res.json(notifs);
  });

  app.patch("/api/todoist/notifications/:id/read", isTeam, async (req, res) => {
    await storage.markTodoistNotificationRead(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Dashboard Stats
  app.get("/api/todoist/dashboard", isTeam, async (req, res) => {
    const userId = (req.user as any)?.id;
    const stats = await storage.getTodoistDashboardStats(userId);
    res.json(stats);
  });

  // Quick NLP Task Title Interpreter (Gemini AI + Rule-based fallback)
  app.post("/api/todoist/quick-parse", isTeam, async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: "Texto não informado" });
    }

    // 1. Try Gemini AI structured parsing
    const aiParsed = await parseTaskWithGemini(text.trim());
    if (aiParsed && aiParsed.title) {
      let formattedDate: string | null = null;
      if (aiParsed.dueDate) {
        try {
          formattedDate = new Date(aiParsed.dueDate).toISOString();
        } catch (e) {
          formattedDate = null;
        }
      }
      return res.json({
        title: aiParsed.title,
        priority: aiParsed.priority || "P3",
        dueDate: formattedDate,
        dueTime: aiParsed.dueTime || null,
        contactName: aiParsed.contactName || null,
        parsedBy: "Google Gemini 1.5 Flash AI"
      });
    }

    // 2. Rule-based regex fallback parser
    const inputLower = text.trim().toLowerCase();
    let title = text.trim();
    let dateStr: string | null = null;
    let timeStr: string | null = null;
    let priority = "P3";

    if (inputLower.includes("p1") || inputLower.includes("urgente")) {
      priority = "P1";
    } else if (inputLower.includes("p2") || inputLower.includes("alta")) {
      priority = "P2";
    } else if (inputLower.includes("p4") || inputLower.includes("baixa")) {
      priority = "P4";
    }

    const parsedDate = new Date();

    if (inputLower.includes("hoje")) {
      dateStr = parsedDate.toISOString();
      title = title.replace(/hoje/gi, "").trim();
    } else if (inputLower.includes("amanhã") || inputLower.includes("amanha")) {
      parsedDate.setDate(parsedDate.getDate() + 1);
      dateStr = parsedDate.toISOString();
      title = title.replace(/amanhã|amanha/gi, "").trim();
    } else if (inputLower.includes("segunda")) {
      const day = parsedDate.getDay();
      const diff = (1 + 7 - day) % 7 || 7;
      parsedDate.setDate(parsedDate.getDate() + diff);
      dateStr = parsedDate.toISOString();
      title = title.replace(/segunda(-feira)?/gi, "").trim();
    } else if (inputLower.includes("terça") || inputLower.includes("terca")) {
      const day = parsedDate.getDay();
      const diff = (2 + 7 - day) % 7 || 7;
      parsedDate.setDate(parsedDate.getDate() + diff);
      dateStr = parsedDate.toISOString();
      title = title.replace(/terça|terca(-feira)?/gi, "").trim();
    } else if (inputLower.includes("quarta")) {
      const day = parsedDate.getDay();
      const diff = (3 + 7 - day) % 7 || 7;
      parsedDate.setDate(parsedDate.getDate() + diff);
      dateStr = parsedDate.toISOString();
      title = title.replace(/quarta(-feira)?/gi, "").trim();
    } else if (inputLower.includes("quinta")) {
      const day = parsedDate.getDay();
      const diff = (4 + 7 - day) % 7 || 7;
      parsedDate.setDate(parsedDate.getDate() + diff);
      dateStr = parsedDate.toISOString();
      title = title.replace(/quinta(-feira)?/gi, "").trim();
    } else if (inputLower.includes("sexta")) {
      const day = parsedDate.getDay();
      const diff = (5 + 7 - day) % 7 || 7;
      parsedDate.setDate(parsedDate.getDate() + diff);
      dateStr = parsedDate.toISOString();
      title = title.replace(/sexta(-feira)?/gi, "").trim();
    }

    const timeMatch = text.match(/(?:às|as|at)?\s*(\d{1,2})(?::(\d{2})|h(\d{2})?)/i);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, "0");
      const minutes = timeMatch[2] || timeMatch[3] || "00";
      timeStr = `${hours}:${minutes}`;
      title = title.replace(timeMatch[0], "").trim();
    }

    title = title.replace(/\b(para|de|com)\b\s*$/gi, "").trim();

    res.json({
      title: title || text,
      dueDate: dateStr,
      dueTime: timeStr,
      priority,
      parsedBy: "Rule Engine Fallback"
    });
  });

  app.get("/api/site-settings", async (req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  app.patch("/api/site-settings", isAdmin, async (req, res) => {
    try {
      const input = insertSiteSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSiteSettings(input as any);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  // CNPJ Proxy with multiple fallback APIs
  app.get("/api/proxy/cnpj/:cnpj", isAuthenticated, async (req, res) => {
    const cnpj = req.params.cnpj.replace(/\D/g, "");

    if (cnpj.length !== 14) {
      return res.status(400).json({ message: `CNPJ inválido: esperado 14 dígitos, recebido ${cnpj.length}` });
    }

    const fetchWithTimeout = async (url: string, timeoutMs = 8000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        return response;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    const formatAddress = (data: any) => {
      const parts = [
        data.logradouro,
        data.numero,
        data.complemento ? `- ${data.complemento}` : null,
        `- ${data.bairro}`,
        `${data.municipio} - ${data.uf}`,
        data.cep
      ].filter(Boolean);
      return parts.join(", ");
    };

    // API 1: BrasilAPI
    try {
      console.log(`[CNPJ] Tentando BrasilAPI para ${cnpj}...`);
      const brasilRes = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (brasilRes.ok) {
        const data = await brasilRes.json();
        console.log(`[CNPJ] ✅ BrasilAPI respondeu com sucesso`);
        return res.json({
          name: data.razao_social || data.nome_fantasia,
          email: data.email || null,
          phone: data.ddd_telefone_1 || data.ddd_telefone_2 || null,
          address: formatAddress(data)
        });
      }
      console.log(`[CNPJ] BrasilAPI retornou status ${brasilRes.status}`);
    } catch (e: any) {
      console.log(`[CNPJ] BrasilAPI falhou: ${e.message}`);
    }

    // API 2: ReceitaWS
    try {
      console.log(`[CNPJ] Tentando ReceitaWS para ${cnpj}...`);
      const receitaRes = await fetchWithTimeout(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
      if (receitaRes.ok) {
        const data = await receitaRes.json();
        if (data.status !== "ERROR") {
          console.log(`[CNPJ] ✅ ReceitaWS respondeu com sucesso`);
          return res.json({
            name: data.nome || data.fantasia,
            email: data.email || null,
            phone: data.telefone || null,
            address: formatAddress(data)
          });
        }
        console.log(`[CNPJ] ReceitaWS retornou ERROR: ${data.message}`);
      }
    } catch (e: any) {
      console.log(`[CNPJ] ReceitaWS falhou: ${e.message}`);
    }

    // API 3: publica.cnpj.ws
    try {
      console.log(`[CNPJ] Tentando publica.cnpj.ws para ${cnpj}...`);
      const publicaRes = await fetchWithTimeout(`https://publica.cnpj.ws/cnpj/${cnpj}`);
      if (publicaRes.ok) {
        const data = await publicaRes.json();
        console.log(`[CNPJ] ✅ publica.cnpj.ws respondeu com sucesso`);
        const est = data.estabelecimento || {};
        return res.json({
          name: data.razao_social || est.nome_fantasia,
          email: est.email || null,
          phone: est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : null,
          address: est.logradouro ? `${est.tipo_logradouro || ''} ${est.logradouro}, ${est.numero || 'S/N'}${est.complemento ? ` - ${est.complemento}` : ''} - ${est.bairro}, ${est.cidade?.nome || ''} - ${est.estado?.sigla || ''}, ${est.cep}` : null
        });
      }
      console.log(`[CNPJ] publica.cnpj.ws retornou status ${publicaRes.status}`);
    } catch (e: any) {
      console.log(`[CNPJ] publica.cnpj.ws falhou: ${e.message}`);
    }

    // API 4: Open CNPJ (cnpja.com open)
    try {
      console.log(`[CNPJ] Tentando open.cnpja.com para ${cnpj}...`);
      const openRes = await fetchWithTimeout(`https://open.cnpja.com/office/${cnpj}`);
      if (openRes.ok) {
        const data = await openRes.json();
        console.log(`[CNPJ] ✅ open.cnpja.com respondeu com sucesso`);
        const addr = data.address || {};
        return res.json({
          name: data.company?.name || data.alias,
          email: data.emails?.[0]?.address || null,
          phone: data.phones?.[0] ? `(${data.phones[0].area}) ${data.phones[0].number}` : null,
          address: addr.street ? `${addr.street}, ${addr.number || 'S/N'}${addr.details ? ` - ${addr.details}` : ''} - ${addr.district}, ${addr.city} - ${addr.state}, ${addr.zip}` : null
        });
      }
      console.log(`[CNPJ] open.cnpja.com retornou status ${openRes.status}`);
    } catch (e: any) {
      console.log(`[CNPJ] open.cnpja.com falhou: ${e.message}`);
    }

    console.log(`[CNPJ] ❌ Todas as APIs falharam para ${cnpj}`);
    res.status(404).json({ message: "Nenhuma das APIs conseguiu encontrar dados para este CNPJ. Verifique o número e tente novamente." });
  });

  app.patch("/api/site-settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertSiteSettingsSchema.parse(req.body);
      const settings = await storage.updateSiteSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  // Hero Slides
  app.get("/api/hero-slides", async (req, res) => {
    const slides = await storage.getHeroSlides();
    res.json(slides);
  });

  app.post("/api/hero-slides", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertHeroSlideSchema.parse(req.body);
      const slide = await storage.createHeroSlide(input);
      res.status(201).json(slide);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/hero-slides/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const slide = await storage.updateHeroSlide(id, req.body);
      if (!slide) return res.status(404).json({ message: "Slide not found" });
      res.json(slide);
    } catch (err) {
      res.status(500).json({ message: "Failed to update slide" });
    }
  });

  app.delete("/api/hero-slides/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteHeroSlide(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Prospecting Checklists
  app.get("/api/prospecting", isAuthenticated, async (req, res) => {
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const results = await storage.getProspectingChecklists(contactId);
    res.json(results);
  });

  app.post("/api/prospecting", isAuthenticated, async (req, res) => {
    try {
      const input = req.body;
      const userId = (req.user as any).id;

      const result = await storage.createProspectingChecklist({
        ...input,
        userId,
      });

      // Automatically create an interaction of type 'call' to show in history
      const outcomeLabel = {
        'connected': 'Conectado',
        'no_answer': 'Sem Atendimento',
        'busy': 'Ocupado',
        'wrong_number': 'Número Errado'
      }[input.callOutcome as string] || input.callOutcome;

      await storage.createInteraction({
        contactId: input.contactId,
        userId: userId,
        type: "call",
        description: `Prospecção Realizada - Resultado: ${outcomeLabel}. Notas: ${input.notes || "Sem observações."}`,
        date: new Date(),
      });

      res.status(201).json(result);
    } catch (err) {
      console.error("[Prospecting] Error saving:", err);
      res.status(500).json({ message: "Failed to save prospecting result" });
    }
  });

  // Direct CNPJ Lookup Proxy
  app.get("/api/proxy/companies/:cnpj", isAuthenticated, async (req, res) => {
    const cnpj = req.params.cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      return res.status(400).json({ message: "CNPJ inválido" });
    }

    try {
      const url = `https://publica.cnpj.ws/cnpj/${cnpj}`;
      const apiRes = await fetch(url, {
        headers: { "Accept": "application/json", "User-Agent": "MonteiroSeguros/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ message: "Empresa não encontrada ou erro na API" });
      }

      const data: any = await apiRes.json();
      const est = data.estabelecimento || {};
      const ender = est.logradouro ? est : (data.endereco || {});
      const cityData = ender.cidade || {};
      const stateData = ender.estado || {};

      const formatted = {
        razao_social: data.razao_social || data.nome || est.nome_fantasia || "",
        nome_fantasia: est.nome_fantasia || data.nome_fantasia || "",
        cnpj: data.cnpj || est.cnpj || cnpj,
        logradouro: ender.logradouro || data.logradouro || "",
        numero: ender.numero || data.numero || "",
        bairro: ender.bairro || data.bairro || "",
        municipio: cityData.nome || ender.municipio || data.municipio || "",
        uf: stateData.sigla || ender.uf || data.uf || "",
        cep: ender.cep || data.cep || "",
        cnae_principal_descricao: data.cnae_fiscal_descricao || est.atividade_principal?.classe_descricao || data.atividade_principal?.[0]?.text || "",
        ddd_telefone_1: est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : (data.ddd_telefone_1 || data.telefone || est.telefone || ""),
        email: est.email || data.email || "",
      };

      res.json([formatted]); // Return as array for compatibility with the frontend table
    } catch (e: any) {
      res.status(500).json({ message: `Erro ao buscar CNPJ: ${e.message}` });
    }
  });

  // Company Search Proxy (Filtered by region and CNAE)
  app.get("/api/proxy/companies/search", isAuthenticated, async (req, res) => {
    const { state, city, cnae, q, neighborhood, cityId } = req.query;

    if (!state && !q) {
      return res.status(400).json({ message: "Informe pelo menos o Estado." });
    }

    const uf = (state as string || "").toUpperCase();
    const municipio = (city as string || "").trim(); // Preserve original casing
    const bairroFiltroInput = (neighborhood as string || "").trim();
    const keyword = (q as string || "").toLowerCase().trim();
    const targetCity = municipio.toUpperCase() || "SÃO PAULO";
    const targetUf = uf || "SP";

    // -----------------------------------------------------------------------
    // Keyword → CNAE mapping + niche label
    // -----------------------------------------------------------------------
    const NICHE_MAP: Array<{ terms: string[]; cnae: string; label: string; cnaeDesc: string }> = [
      { terms: ["restaurante", "lanchonete", "comida", "alimentação", "refeição", "bar", "boteco", "pizzaria", "hamburgueria", "self service", "cafeteria", "padaria", "confeitaria", "doce", "bolo"], cnae: "5611201", label: "Alimentação", cnaeDesc: "Restaurante e similares" },
      { terms: ["academia", "fitness", "musculação", "ginástica", "pilates", "crossfit", "natação", "esporte"], cnae: "9313100", label: "Academia/Fitness", cnaeDesc: "Atividades de condicionamento físico" },
      { terms: ["médico", "clínica", "hospital", "consultório", "saúde", "dentista", "odonto", "pediatra", "cardiologista", "ortopedista", "dermatologista"], cnae: "8610101", label: "Saúde", cnaeDesc: "Atividades de atendimento hospitalar, exceto pronto-socorro" },
      { terms: ["advocacia", "advogado", "escritório", "jurídico", "direito", "advocacia"], cnae: "6911701", label: "Advocacia", cnaeDesc: "Serviços advocatícios" },
      { terms: ["contabilidade", "contador", "contábil", "fiscal", "tributário", "imposto", "declaração"], cnae: "6920601", label: "Contabilidade", cnaeDesc: "Atividades de contabilidade" },
      { terms: ["seguro", "corretora", "apólice", "previdência", "seguradora", "vida", "residencial"], cnae: "6512000", label: "Seguros", cnaeDesc: "Seguros de vida" },
      { terms: ["farmácia", "drogaria", "medicamento", "remédio", "genérico"], cnae: "4771701", label: "Farmácia", cnaeDesc: "Comércio varejista de produtos farmacêuticos" },
      { terms: ["auto", "automóvel", "veículo", "carro", "moto", "oficina", "mecânica", "funilaria", "pintura", "borracharia", "lava jato", "estética automotiva"], cnae: "4520001", label: "Automotivo", cnaeDesc: "Serviços de manutenção e reparação de automóveis" },
      { terms: ["imobiliária", "imóvel", "imóveis", "corretora de imóveis", "aluguel", "locação", "venda de imóveis"], cnae: "6821801", label: "Imóveis", cnaeDesc: "Corretagem na compra e venda de imóveis" },
      { terms: ["supermercado", "mercado", "mercearia", "hortifruti", "verdura", "frutas"], cnae: "4711301", label: "Supermercado", cnaeDesc: "Comércio varejista de mercadorias em geral" },
      { terms: ["roupa", "moda", "vestuário", "calçado", "tênis", "boutique", "loja", "confecção", "roupas", "moda feminina", "moda masculina"], cnae: "4781400", label: "Vestuário", cnaeDesc: "Comércio varejista de artigos do vestuário e acessórios" },
      { terms: ["escola", "ensino", "educação", "curso", "colégio", "faculdade", "universidade", "pré-escola", "creche"], cnae: "8531700", label: "Educação", cnaeDesc: "Educação superior - graduação" },
      { terms: ["salão", "beleza", "cabeleireiro", "manicure", "pedicure", "estética", "spa", "nail", "hair"], cnae: "9602501", label: "Beleza", cnaeDesc: "Cabeleireiros, manicure e pedicure" },
      { terms: ["hotel", "pousada", "hospedagem", "resort", "hostel", "motel"], cnae: "5510801", label: "Hotelaria", cnaeDesc: "Hotéis e similares" },
      { terms: ["tecnologia", "software", "ti", "informática", "sistema", "desenvolvimento", "app", "aplicativo", "startup"], cnae: "6201500", label: "Tecnologia", cnaeDesc: "Desenvolvimento de programas de computador sob encomenda" },
      { terms: ["marketing", "publicidade", "propaganda", "agência", "comunicação", "mídia", "design", "criativo"], cnae: "7311400", label: "Marketing", cnaeDesc: "Agências de publicidade" },
      { terms: ["construção", "construtora", "obras", "engenharia", "reforma", "civil", "edificação"], cnae: "4120400", label: "Construção", cnaeDesc: "Construção de edifícios" },
      { terms: ["logística", "transporte", "frete", "entrega", "courier", "mudança", "armazenagem", "distribuição"], cnae: "4930201", label: "Transporte", cnaeDesc: "Transporte rodoviário de carga" },
      { terms: ["petshop", "veterinário", "animal", "bicho", "pet", "banho e tosa"], cnae: "7500100", label: "Pet Shop", cnaeDesc: "Atividades veterinárias" },
      { terms: ["banco", "financeiro", "crédito", "empréstimo", "financeira", "câmbio", "investimento"], cnae: "6422100", label: "Financeiro", cnaeDesc: "Bancos múltiplos, com carteira comercial" },
      { terms: ["consultoria", "gestão", "rh", "recursos humanos", "estratégia", "negócios"], cnae: "7020400", label: "Consultoria", cnaeDesc: "Atividades de consultoria em gestão empresarial" },
      { terms: ["gráfica", "impressão", "papel", "gráfico", "tipografia", "plotagem"], cnae: "1811301", label: "Gráfica", cnaeDesc: "Impressão de jornais, livros, revistas e outras publicações" },
      { terms: ["eletrica", "elétrico", "instalação", "painel", "energia", "solar", "fotovoltaico"], cnae: "4321500", label: "Elétrica", cnaeDesc: "Instalação e manutenção elétrica" },
      { terms: ["segurança", "vigilância", "monitoramento", "alarme", "câmera", "cftv", "portaria"], cnae: "8011101", label: "Segurança", cnaeDesc: "Atividades de vigilância e segurança privada" },
      { terms: ["limpeza", "higienização", "lavanderia", "dedetização", "conservação", "faxina"], cnae: "8121400", label: "Limpeza", cnaeDesc: "Limpeza em prédios e em domicílios" },
      { terms: ["móveis", "decoração", "interiores", "arquitetura", "design de interiores", "home"], cnae: "4754701", label: "Móveis/Decoração", cnaeDesc: "Comércio varejista de móveis" },
      { terms: ["eventos", "cerimonial", "casamento", "festa", "buffet", "dj", "fotografia", "video"], cnae: "8230001", label: "Eventos", cnaeDesc: "Serviços de organização de feiras, congressos, exposições e festas" },
      { terms: ["farmácias de manipulação", "manipulação", "homeopatia", "fitoterápico"], cnae: "4771702", label: "Farmácia Manipulação", cnaeDesc: "Comércio varejista de produtos farmacêuticos, com manipulação" },
    ];

    const cnaeClean = (cnae as string || "").replace(/\D/g, "");
    
    // Detect niche from CNAE or keyword
    let detectedNiche = cnaeClean 
      ? NICHE_MAP.find(n => n.cnae === cnaeClean)
      : (keyword ? NICHE_MAP.find(n => n.terms.some(term => keyword.includes(term) || term.includes(keyword))) : undefined);

    // Explicit CNAE override
    const cnaeCode = cnaeClean || detectedNiche?.cnae || "";

    console.log(`[CompanySearch] UF=${uf} | Cidade=${municipio} | Bairro=${bairroFiltroInput} | CNAE=${cnaeCode} | Nicho=${detectedNiche?.label || "geral"} | Keyword="${keyword}"`);

    let results: any[] = [];
    let apiSuccess = false;

    // -----------------------------------------------------------------------
    // Strategy: publica.cnpj.ws — Note: Search by filters is a Premium feature.
    // If it fails with 404/403, we rely on the OSM fallback.
    // -----------------------------------------------------------------------
    if (cnaeCode || municipio || keyword) {
      try {
        const params = new URLSearchParams();
        if (uf) params.set("uf", uf);
        
        // Reverting to using NAME for municipio as it was likely what worked before
        if (municipio) {
          params.set("municipio", municipio.toUpperCase().trim());
        } else if (cityId) {
          params.set("municipio", cityId as string);
        }
        
        if (cnaeCode) params.set("cnae", cnaeCode);
        if (keyword) params.set("q", keyword.toUpperCase());
        else if (bairroFiltroInput) params.set("q", bairroFiltroInput.toUpperCase());

        const url = `https://publica.cnpj.ws/cnpjs?${params.toString()}`;
        console.log(`[CompanySearch] Chamando CNPJ API: ${url}`);
        const apiRes = await fetch(url, {
          headers: { "Accept": "application/json", "User-Agent": "MonteiroSeguros/1.0" },
          signal: AbortSignal.timeout(10000), // Increased timeout
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          const raw = Array.isArray(data) ? data : (data.data || data.companies || []);

          results = raw.map((c: any) => {
            const est = c.estabelecimento || {};
            const ender = est.logradouro ? est : (c.endereco || {});
            const cityData = ender.cidade || {};
            const stateData = ender.estado || {};

            return {
              razao_social: c.razao_social || c.nome || est.nome_fantasia || "",
              nome_fantasia: est.nome_fantasia || c.nome_fantasia || "",
              cnpj: c.cnpj || est.cnpj || "",
              logradouro: ender.logradouro || c.logradouro || "",
              numero: ender.numero || c.numero || "",
              bairro: ender.bairro || c.bairro || "",
              municipio: cityData.nome || ender.municipio || c.municipio || targetCity,
              uf: stateData.sigla || ender.uf || c.uf || targetUf,
              cep: ender.cep || c.cep || "",
              cnae_principal_descricao: c.cnae_fiscal_descricao || est.atividade_principal?.classe_descricao || c.atividade_principal?.[0]?.text || detectedNiche?.cnaeDesc || "",
              ddd_telefone_1: est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : (c.ddd_telefone_1 || c.telefone || est.telefone || ""),
              email: est.email || c.email || "",
            };
          });
        }
      } catch (e: any) {
        console.warn(`[CompanySearch] CNPJ API falhou: ${e.message}`);
      }
    }

    // Helper to resolve city to OSM area ID using Nominatim
    const resolveOsmArea = async (city: string, state: string) => {
      try {
        const q = `${city}, ${state}, Brazil`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
          headers: { "User-Agent": "MonteiroSeguros/1.0" },
          signal: AbortSignal.timeout(5000)
        });
        const data: any = await res.json();
        if (data && data[0]) {
          // Overpass area ID is 3600000000 + osm_id for relations, or 2400000000 + osm_id for ways
          const osmId = data[0].osm_id;
          const type = data[0].osm_type;
          if (type === "relation") return 3600000000 + osmId;
          if (type === "way") return 2400000000 + osmId;
        }
      } catch (e) {
        console.error(`[CompanySearch] Nominatim failed:`, e);
      }
      return null;
    };


    // -----------------------------------------------------------------------
    // Post-processing filter: Ensure results match the city and bairro filters strictly (case-insensitive)
    // -----------------------------------------------------------------------
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

    const applyFilters = (items: any[]) => {
      let filtered = items;
      if (bairroFiltroInput && filtered.length > 0) {
        const bSearch = normalize(bairroFiltroInput);
        filtered = filtered.filter(c => {
          const companyBairro = normalize(c.bairro || "");
          return !companyBairro || companyBairro.includes(bSearch) || bSearch.includes(companyBairro);
        });
      }

      if (municipio && filtered.length > 0) {
        const mSearch = normalize(municipio);
        filtered = filtered.filter(c => {
          const companyCity = normalize(c.municipio || "");
          return !companyCity || companyCity.includes(mSearch) || mSearch.includes(companyCity);
        });
      }
      return filtered;
    };

    // Apply initial filters to CNPJ results
    results = applyFilters(results);

    // -----------------------------------------------------------------------
    // OSM Overpass fallback — fetch REAL businesses from OpenStreetMap
    // If CNPJ API failed OR returned nothing after filtering
    // -----------------------------------------------------------------------
    if (results.length === 0) {
      console.warn(`[CompanySearch] Buscando no OSM (CNPJ API sem resultados para os filtros)...`);

      // Map niche keyword to OSM amenity/shop tags
      const OSM_TAG_MAP: Record<string, string[]> = {
        "Alimentação": ["amenity=restaurant", "amenity=cafe", "amenity=fast_food", "amenity=food_court", "amenity=bar", "shop=bakery", "amenity=pub"],
        "Academia/Fitness": ["leisure=fitness_centre", "leisure=sports_centre", "leisure=gym", "leisure=stadium"],
        "Saúde": ["amenity=clinic", "amenity=doctors", "amenity=hospital", "healthcare=yes", "amenity=dentist"],
        "Advocacia": ["office=lawyer", "office=yes"],
        "Contabilidade": ["office=accountant", "office=financial", "office=yes"],
        "Automotivo": ["shop=car_repair", "amenity=car_wash", "shop=tyres", "shop=car", "shop=car_parts"],
        "Beleza": ["shop=hairdresser", "shop=beauty", "amenity=beauty_salon", "shop=cosmetics"],
        "Pet Shop": ["shop=pet", "amenity=veterinary", "shop=pet_grooming"],
        "Imóveis": ["office=estate_agent", "office=yes"],
        "Seguros": ["office=insurance", "office=yes"],
        "Tecnologia": ["office=it", "office=software", "office=yes"],
        "Marketing": ["office=advertising_agency", "office=marketing", "office=yes"],
        "Construção": ["office=construction", "craft=construction", "shop=hardware"],
        "Logística": ["amenity=courier", "shop=shipping", "office=logistics"],
        "Farmácia Manipulação": ["amenity=pharmacy", "healthcare=pharmacy", "shop=chemist"],
      };

      const nicheLabel = detectedNiche?.label || "";
      let osmTags = OSM_TAG_MAP[nicheLabel] || ["amenity=yes", "shop=yes", "office=yes"];

      // If we have a keyword but no niche, try to search by name as well
      const keywordTag = keyword ? `node["name"~"${keyword}",i](area.searchArea);\nway["name"~"${keyword}",i](area.searchArea);` : "";

      const tagUnion = osmTags
        .map(tag => {
          const [k, v] = tag.split("=");
          return v === "yes"
            ? `node["${k}"](area.searchArea);\nway["${k}"](area.searchArea);`
            : `node["${k}"="${v}"](area.searchArea);\nway["${k}"="${v}"](area.searchArea);`;
        })
        .join("\n") + "\n" + keywordTag;

      const areaSearchName = municipio || targetCity || "São Paulo";
      const areaId = await resolveOsmArea(areaSearchName, targetUf);

      const overpassQuery = areaId 
        ? `[out:json][timeout:30];area(${areaId})->.searchArea;(${tagUnion});out center 100;`
        : `[out:json][timeout:30];area["name"~"${areaSearchName}",i][admin_level~"8|4"]->.searchArea;(${tagUnion});out center 100;`;

      try {
        const overpassUrl = "https://overpass-api.de/api/interpreter";
        console.log(`[CompanySearch] Overpass query (areaId: ${areaId || "detecting..."}) para: ${areaSearchName}`);

        const osmRes = await fetch(overpassUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: AbortSignal.timeout(30000),
        });

        if (osmRes.ok) {
          const osmData = await osmRes.json();
          const elements: any[] = osmData.elements || [];
          console.log(`[CompanySearch] OSM retornou ${elements.length} elementos`);

          if (elements.length > 0) {
            results = elements
              .filter((el: any) => el.tags && el.tags.name)
              .map((el: any, i: number) => {
                const t = el.tags;
                const lat = el.lat ?? el.center?.lat ?? -23.55;
                const lng = el.lon ?? el.center?.lon ?? -46.63;
                const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
                const neighborhood_name = t["addr:suburb"] || t["addr:neighbourhood"] || bairroFiltroInput || "";
                const city_name = t["addr:city"] || (municipio || targetCity);
                const phone = t.phone || t["contact:phone"] || "";
                const website = t.website || t["contact:website"] || "";
                return {
                  razao_social: t.name || `Estabelecimento ${i + 1}`,
                  nome_fantasia: t.name || "",
                  cnpj: "** Consultar separadamente **",
                  logradouro: street || t["addr:street"] || "",
                  numero: t["addr:housenumber"] || "",
                  bairro: neighborhood_name,
                  municipio: city_name,
                  uf: targetUf,
                  cep: t["addr:postcode"] || "",
                  cnae_principal_descricao: t.amenity || t.shop || t.office || t.leisure || detectedNiche?.cnaeDesc || "Estabelecimento",
                  ddd_telefone_1: phone,
                  website,
                  lat,
                  lng,
                };
              });
            if (bairroFiltroInput) {
                console.log(`[CompanySearch] Aplicando filtro de bairro sugerido no OSM: ${bairroFiltroInput}`);
            }
            apiSuccess = true;
            console.log(`[CompanySearch] OSM: ${results.length} negócios reais encontrados`);
          }
        }
      } catch (e: any) {
        console.warn(`[CompanySearch] OSM Overpass falhou: ${e.message}`);
      }
    }

    if (results.length === 0) {
      console.warn(`[CompanySearch] Nenhum dado real encontrado para: ${bairroFiltroInput || municipio}`);
      return res.json([]);
    }

    console.log(`[CompanySearch] Retornando ${results.length} empresas reais | nicho=${detectedNiche?.label || "geral"} | bairro=${bairroFiltroInput || "todos"}`);
    return res.json(results);
  });


  // Seed Data
  const servicesList = await storage.getServices();
  if (servicesList.length === 0) {
    await storage.createService({
      title: "Seguro Auto",
      description: "Proteção completa para seu veículo contra roubo, colisão e terceiros.",
      icon: "Car",
    });
    await storage.createService({
      title: "Seguro de Vida",
      description: "Garanta a segurança financeira da sua família em momentos difíceis.",
      icon: "Heart",
    });
    await storage.createService({
      title: "Plano de Saúde",
      description: "As melhores opções de planos de saúde para você e sua família.",
      icon: "Stethoscope",
    });
    await storage.createService({
      title: "Seguro Residencial",
      description: "Proteja seu lar contra incêndios, roubos e danos elétricos.",
      icon: "Home",
    });
  }


  const postsList = await storage.getPosts(false);
  if (postsList.length === 0) {
    await storage.createPost({
      title: "Por que contratar um seguro auto?",
      slug: "por-que-contratar-seguro-auto",
      summary: "Descubra a importância de ter seu veículo protegido e evite dores de cabeça.",
      content: "Ter um seguro auto é essencial para quem busca tranquilidade no trânsito...",
      coverImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1000",
      publishedAt: new Date(),
    });
    await storage.createPost({
      title: "Dicas para economizar no seguro",
      slug: "dicas-economizar-seguro",
      summary: "Saiba como reduzir o valor do seu seguro sem perder coberturas importantes.",
      content: "Muitas pessoas não sabem, mas pequenas atitudes podem diminuir o valor do seguro...",
      coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000",
      publishedAt: new Date(),
    });
  }


  // Seed Admin User
  const existingUser = await storage.getUserByUsername("admin");
  if (!existingUser) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
    });
  }

  // Seed Produtos de Seguro
  const existingProdutos = await storage.getProdutosSeguro();
  if (existingProdutos.length === 0) {
    const defaultProdutos = ["Auto", "Vida", "Saúde", "Residencial", "Empresarial", "Previdência", "Viagem", "Agrícola"];
    for (const nome of defaultProdutos) {
      await storage.createProdutoSeguro({ nome });
    }
  }

  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const { name, avatar } = req.body;
      const userId = (req.user as any).id;
      const updatedUser = await storage.updateUserProfile(userId, { name, avatar });
      if (updatedUser) {
        if (updatedUser.contactId) {
          await db.execute(sql`UPDATE contacts SET avatar = ${avatar || null} WHERE id = ${updatedUser.contactId}`);
        } else if (updatedUser.email) {
          await db.execute(sql`UPDATE contacts SET avatar = ${avatar || null} WHERE email = ${updatedUser.email}`);
        }
      }
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update existing users with no role to 'client'
  await db.execute(sql`UPDATE users SET role = 'client' WHERE role IS NULL`);

  // Ensure 'admin' has the admin role
  await db.execute(sql`UPDATE users SET role = 'admin' WHERE username = 'admin'`);

  return httpServer;
}
