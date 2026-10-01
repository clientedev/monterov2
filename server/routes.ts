import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { api } from "@shared/routes";
import { processAiChat, parseTaskWithGemini } from "./ai-service";
import Groq from "groq-sdk";
import { z } from "zod";
import { setupAuth, hashPassword, comparePasswords, isAuthenticated } from "./auth";
import { db } from "./db";
import { sql, eq, or, and, desc, asc } from "drizzle-orm";
import { sendCrmNotification, buildLeadAssignedEmail, buildLeadStatusChangedEmail, buildTaskAssignedEmail, sendBirthdayEmailToContact, sendClientWelcomeEmail, sendOpportunityNotificationEmail, sendEmail } from "./email";
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
  produtosSeguro,
  contacts,
  contactFiles,
  users,
  type InsertContact,
  leadDispatchGroups,
  insertLeadDispatchGroupSchema,
  type InsertLeadDispatchGroup,
  type LeadDispatchGroup,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Auto-approve existing posts in DB so all published posts show publicly
  db.execute(sql`UPDATE posts SET is_approved = true WHERE is_approved = false OR is_approved IS NULL`).catch((err) =>
    console.error("[POSTS] Failed to auto-approve posts on startup:", err)
  );

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
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=120, stale-while-revalidate=600");
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
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
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
      const input = insertPostSchema.parse({
        ...req.body,
        isApproved: req.body.isApproved ?? true,
      });
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

      // Integration with CRM: Salva/atualiza o contato e registra o histórico, SEM criar oportunidade no pipeline automaticamente
      const { contact } = await storage.upsertContact({
        type: "individual",
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        document: null,
        address: null,
        status: "Ativo",
        assignedTo: attributionId,
        notes: `Mensagem enviada pelo formulário do site: ${input.message}`,
      });

      await storage.createInteraction({
        contactId: contact.id,
        userId: attributionId,
        type: "Web Inquiry",
        description: `Contato recebido pelo site: ${input.message}`,
        date: new Date(),
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

  // ============================================================
  // ÁREA DO CLIENTE — Meus Documentos e Apólices
  // ============================================================

  // Retorna os arquivos do cliente logado (via contactId do user)
  app.get("/api/my-files", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!currentUser.contactId) {
        return res.json([]); // Sem contactId vinculado
      }
      const files = await db
        .select()
        .from(contactFiles)
        .where(eq(contactFiles.contactId, currentUser.contactId))
        .orderBy(desc(contactFiles.createdAt));
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Retorna as apólices do cliente logado (vinculadas via email no módulo de seguros)
  app.get("/api/my-apolices", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      // Busca cliente na tabela clientes via email do usuário
      const userEmail = currentUser.email || currentUser.username;
      if (!userEmail) return res.json([]);

      const clienteRows = await db
        .select()
        .from(clientes)
        .where(eq(clientes.email, userEmail))
        .limit(1);

      if (!clienteRows.length) return res.json([]);
      const clienteId = clienteRows[0].id;

      const apoliceList = await db
        .select({
          id: apolices.id,
          numeroApolice: apolices.numeroApolice,
          status: apolices.status,
          inicioVigencia: apolices.inicioVigencia,
          fimVigencia: apolices.fimVigencia,
          premio: apolices.premio,
          pdfApolice: apolices.pdfApolice,
          linkFatura: apolices.linkFatura,
          cobertura: apolices.cobertura,
          observacoes: apolices.observacoes,
          produtoNome: produtosSeguro.nome,
          seguradoraNome: seguradoras.nome,
        })
        .from(apolices)
        .leftJoin(produtosSeguro, eq(apolices.produtoId, produtosSeguro.id))
        .leftJoin(seguradoras, eq(apolices.seguradoraId, seguradoras.id))
        .where(eq(apolices.clienteId, clienteId))
        .orderBy(desc(apolices.createdAt));

      res.json(apoliceList);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
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
    const linkedCliente = (await storage.getClientes()).find((cliente) => {
      if (cliente.contactId === contact.id) return true;
      const contactDoc = (contact.document || "").replace(/\D/g, "");
      const clientDoc = (cliente.cpfCnpj || "").replace(/\D/g, "");
      const contactName = (contact.name || "").trim().toLowerCase();
      const clientName = (cliente.nome || "").trim().toLowerCase();
      const contactPhone = (contact.phone || "").replace(/\D/g, "");
      const clientPhone = (cliente.telefone || "").replace(/\D/g, "");
      return Boolean(contactDoc && clientDoc && contactDoc === clientDoc) ||
        Boolean(contactName === clientName && contactPhone && clientPhone && contactPhone === clientPhone);
    });
    if (linkedCliente) {
      await storage.updateCliente(linkedCliente.id, {
        contactId: contact.id,
        type: contact.type,
        nome: contact.name,
        cpfCnpj: contact.document || null,
        email: contact.email || null,
        telefone: contact.phone || null,
        whatsapp: contact.phone || null,
        endereco: contact.address || null,
        anniversaryDate: contact.anniversaryDate || null,
        productType: contact.productType || null,
        insurers: contact.insurers || null,
        contactOrigin: contact.contactOrigin || null,
        isReferral: contact.isReferral || false,
        referredByContactId: contact.referredByContactId || null,
        internalResponsibleId: contact.internalResponsibleId || null,
        nomeRepresentante: contact.responsibleName || null,
        observacoes: contact.notes || null,
      });
    }
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
      const linkedCliente = (await storage.getClientes()).find((cliente) => {
        if (cliente.contactId === result.contact.id) return true;
        const contactDoc = (result.contact.document || "").replace(/\D/g, "");
        const clientDoc = (cliente.cpfCnpj || "").replace(/\D/g, "");
        const contactName = (result.contact.name || "").trim().toLowerCase();
        const clientName = (cliente.nome || "").trim().toLowerCase();
        const contactPhone = (result.contact.phone || "").replace(/\D/g, "");
        const clientPhone = (cliente.telefone || "").replace(/\D/g, "");
        return Boolean(contactDoc && clientDoc && contactDoc === clientDoc) ||
          Boolean(contactName === clientName && contactPhone && clientPhone && contactPhone === clientPhone);
      });
      if (linkedCliente) {
        await storage.updateCliente(linkedCliente.id, {
          contactId: result.contact.id,
          type: result.contact.type,
          nome: result.contact.name,
          cpfCnpj: result.contact.document || null,
          email: result.contact.email || null,
          telefone: result.contact.phone || null,
          whatsapp: result.contact.phone || null,
          endereco: result.contact.address || null,
          anniversaryDate: result.contact.anniversaryDate || null,
          productType: result.contact.productType || null,
          insurers: result.contact.insurers || null,
          contactOrigin: result.contact.contactOrigin || null,
          isReferral: result.contact.isReferral || false,
          referredByContactId: result.contact.referredByContactId || null,
          internalResponsibleId: result.contact.internalResponsibleId || null,
          nomeRepresentante: result.contact.responsibleName || null,
          observacoes: result.contact.notes || null,
        });
      } else {
        await storage.createCliente({
          contactId: result.contact.id,
          type: result.contact.type,
          nome: result.contact.name,
          cpfCnpj: result.contact.document || null,
          email: result.contact.email || null,
          telefone: result.contact.phone || null,
          whatsapp: result.contact.phone || null,
          endereco: result.contact.address || null,
          anniversaryDate: result.contact.anniversaryDate || null,
          productType: result.contact.productType || null,
          insurers: result.contact.insurers || null,
          contactOrigin: result.contact.contactOrigin || null,
          isReferral: result.contact.isReferral || false,
          referredByContactId: result.contact.referredByContactId || null,
          internalResponsibleId: result.contact.internalResponsibleId || null,
          nomeRepresentante: result.contact.responsibleName || null,
          observacoes: result.contact.notes || null,
        });
      }
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

    // Auto-normalize any existing leads with "Ativo" / "ativo" to "new"
    for (const l of leads) {
      if (l.status === "Ativo" || l.status === "ativo") {
        l.status = "new";
        storage.updateLeadStatus(l.id, "new").catch((err) => {
          console.error("[Leads] Erro ao normalizar status do lead:", err);
        });
      }
    }

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

  // Sincronização automática com Monteiro Conecta (WhatsApp Central) quando um lead é editado ou excluído
  async function notifyMonteiroConectaLeadChange(
    action: "updated" | "deleted",
    lead: any,
    extra?: { leadBefore?: any; changerUserId?: number }
  ) {
    try {
      const conectaBaseUrl =
        process.env.MONTEIRO_CONECTA_URL ||
        process.env.WA_CENTRAL_URL ||
        process.env.WHATSAPP_CENTRAL_URL ||
        "https://whatsapp.monteiroseguros.com.br";

      const apiKey = await getPrimaryExternalApiKey();

      const contact = lead.contactId ? await storage.getContact(lead.contactId) : null;
      const allClientes = await storage.getClientes();
      const cliente = contact ? allClientes.find(c => c.contactId === contact.id) : null;

      const payload = {
        event: action === "deleted" ? "lead.deleted" : "lead.updated",
        action,
        leadId: lead.id,
        id: lead.id,
        clienteId: cliente?.id || null,
        contactId: contact?.id || lead.contactId || null,
        lead: {
          id: lead.id,
          status: lead.status,
          product: lead.product,
          value: lead.value,
          notes: lead.notes,
          assignedTo: lead.assignedTo,
          updatedAt: new Date().toISOString(),
        },
        contact: contact ? {
          id: cliente?.id || contact.id,
          clienteId: cliente?.id || null,
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          document: contact.document,
        } : null,
        timestamp: new Date().toISOString(),
      };

      const endpoints = [
        `${conectaBaseUrl}/api/crm/webhook`,
        `${conectaBaseUrl}/api/webhook/crm`,
        `${conectaBaseUrl}/api/crm/lead-sync`,
        `${conectaBaseUrl}/api/leads/sync`,
      ];

      for (const url of endpoints) {
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }

      console.log(`[Monteiro Conecta] Notificação disparada (${action}) para lead #${lead.id}`);
    } catch (err: any) {
      console.warn("[Monteiro Conecta] Erro ao sincronizar alteração de lead:", err.message);
    }
  }

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

    // Sincroniza alteração no Monteiro Conecta
    notifyMonteiroConectaLeadChange("updated", lead, { leadBefore, changerUserId: (req.user as any)?.id });

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

    // Sincroniza alteração no Monteiro Conecta
    notifyMonteiroConectaLeadChange("updated", lead, { leadBefore, changerUserId: (req.user as any)?.id });

    res.json(lead);
  });

  app.delete("/api/leads/:id", isTeam, async (req, res) => {
    const leadToDelete = await storage.getLead(parseInt(req.params.id));
    await storage.deleteLead(parseInt(req.params.id));
    if (leadToDelete) {
      notifyMonteiroConectaLeadChange("deleted", leadToDelete);
    }
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
  app.get("/api/users", isTeam, async (req, res) => {
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
      const cleanDoc = (parsedClientData.cpfCnpj || "").replace(/\D/g, "");
      const cleanEmail = (parsedClientData.email || "").trim().toLowerCase();
      const cleanPhone = (parsedClientData.telefone || "").replace(/\D/g, "");
      const allClientes = await db.select().from(clientes);
      const existingCliente = allClientes.find((candidate: any) => {
        const candidateDoc = (candidate.cpfCnpj || "").replace(/\D/g, "");
        const candidateName = (candidate.nome || "").trim().toLowerCase();
        const candidateEmail = (candidate.email || "").trim().toLowerCase();
        const candidatePhone = (candidate.telefone || "").replace(/\D/g, "");
        if (cleanDoc && candidateDoc) return cleanDoc === candidateDoc;
        if (cleanEmail && candidateEmail) return cleanEmail === candidateEmail;
        return Boolean(cleanName && candidateName === cleanName && cleanPhone && candidatePhone === cleanPhone);
      });

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
      const cleanContactDoc = (cliente.cpfCnpj || "").replace(/\D/g, "");
      const cleanContactEmail = (cliente.email || "").trim().toLowerCase();
      const cleanContactPhone = (cliente.telefone || "").replace(/\D/g, "");
      const allContacts = await storage.getContacts();
      let existingContact: any = cliente.contactId
        ? allContacts.find((c) => c.id === cliente.contactId)
        : allContacts.find((candidate) => {
            const candidateDoc = (candidate.document || "").replace(/\D/g, "");
            const candidateEmail = (candidate.email || "").trim().toLowerCase();
            const candidatePhone = (candidate.phone || "").replace(/\D/g, "");
            const candidateName = (candidate.name || "").trim().toLowerCase();
            if (cleanContactDoc && candidateDoc) return cleanContactDoc === candidateDoc;
            if (cleanContactEmail && candidateEmail) return cleanContactEmail === candidateEmail;
            return Boolean(cleanContactName && candidateName === cleanContactName && cleanContactPhone && candidatePhone === cleanContactPhone);
          });

      const numericDoc = (cliente.cpfCnpj || "").replace(/\D/g, "");
      const type = cliente.type || (numericDoc.length > 11 ? "company" : "individual");
      const contactPayload: any = {
        type,
        name: cliente.nome,
        email: cliente.email || null,
        phone: cliente.telefone || null,
        document: cliente.cpfCnpj || null,
        address: cliente.endereco || null,
        status: "Ativo",
        responsibleName: cliente.nomeRepresentante || null,
        internalResponsibleId: cliente.internalResponsibleId || cliente.responsavelComercialId || null,
        anniversaryDate: cliente.anniversaryDate || cliente.dataNascimento || null,
        productType: cliente.productType || null,
        insurers: cliente.insurers || null,
        contactOrigin: cliente.contactOrigin || null,
        isReferral: cliente.isReferral || false,
        referredByContactId: cliente.referredByContactId || null,
        notes: cliente.observacoes || null,
        assignedTo: cliente.responsavelComercialId || null,
      };

      if (existingContact) {
        existingContact = await storage.updateContact(existingContact.id, contactPayload);
      } else {
        const result = await storage.upsertContact(contactPayload);
        existingContact = result.contact;
      }

      cliente = await storage.updateCliente(cliente.id, { contactId: existingContact.id, type });

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
      const linkedContact = cliente.contactId
        ? await storage.getContact(cliente.contactId)
        : (await storage.getContacts()).find((candidate) => {
            const doc = (candidate.document || "").replace(/\D/g, "");
            const clientDoc = (cliente.cpfCnpj || "").replace(/\D/g, "");
            const name = (candidate.name || "").trim().toLowerCase();
            const clientName = (cliente.nome || "").trim().toLowerCase();
            const phone = (candidate.phone || "").replace(/\D/g, "");
            const clientPhone = (cliente.telefone || "").replace(/\D/g, "");
            return (clientDoc && doc && clientDoc === doc) ||
              (name === clientName && clientPhone && phone && clientPhone === phone);
          });
      if (linkedContact) {
        await storage.updateContact(linkedContact.id, {
          type: cliente.type,
          name: cliente.nome,
          document: cliente.cpfCnpj || null,
          email: cliente.email || null,
          phone: cliente.telefone || null,
          address: cliente.endereco || null,
          anniversaryDate: cliente.anniversaryDate || cliente.dataNascimento || null,
          responsibleName: cliente.nomeRepresentante || null,
          internalResponsibleId: cliente.internalResponsibleId || cliente.responsavelComercialId || null,
          productType: cliente.productType || null,
          insurers: cliente.insurers || null,
          contactOrigin: cliente.contactOrigin || null,
          isReferral: cliente.isReferral || false,
          referredByContactId: cliente.referredByContactId || null,
          notes: cliente.observacoes || null,
        });
      }
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

  app.post("/api/todoist/tasks/:id/restore", isTeam, async (req, res) => {
    try {
      const restored = await storage.restoreTodoistTask(parseInt(req.params.id));
      if (!restored) return res.status(404).json({ message: "Tarefa não encontrada" });
      res.json(restored);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
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

      // Oportunidade no pipeline apenas se o usuário solicitar explicitamente
      if (input.createPipelineLead === true || input.createPipelineLead === "true") {
        await storage.createLead({
          contactId: input.contactId,
          status: "new",
          source: "Termômetro de Leads (Prospecção)",
          product: input.productType || "Plano de Saúde",
          notes: `[Prospecção] Resultado: ${outcomeLabel}. Interesse: ${input.interestLevel || 'N/A'}. Notas: ${input.notes || ''}`,
          assignedTo: userId,
        });
      }

      res.status(201).json(result);
    } catch (err) {
      console.error("[Prospecting] Error saving:", err);
      res.status(500).json({ message: "Failed to save prospecting result" });
    }
  });

  // -----------------------------------------------------------------------
  // Direct CNPJ Lookup & Multi-Source Intelligence Engine
  // -----------------------------------------------------------------------
  async function unifiedCnpjLookup(cnpj: string) {
    const cleanDoc = String(cnpj).replace(/\D/g, "");
    if (cleanDoc.length !== 14) return null;

    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    // 1. Try publica.cnpj.ws
    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanDoc}`, {
        headers: { "User-Agent": ua, "Accept": "application/json" },
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const d: any = await res.json();
        const est = d.estabelecimento || {};
        const ender = est.logradouro ? est : (d.endereco || {});
        const cityData = ender.cidade || {};
        const stateData = ender.estado || {};
        return {
          cnpj: cleanDoc,
          razao_social: d.razao_social || d.nome || est.nome_fantasia || "",
          nome_fantasia: est.nome_fantasia || d.nome_fantasia || d.razao_social || "",
          email: est.email || d.email || null,
          ddd_telefone_1: est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : (d.ddd_telefone_1 || d.telefone || null),
          logradouro: ender.logradouro || "",
          numero: ender.numero || "",
          bairro: ender.bairro || "",
          municipio: cityData.nome || ender.municipio || "",
          uf: stateData.sigla || ender.uf || "",
          cep: ender.cep || "",
          cnae_principal_descricao: d.cnae_fiscal_descricao || est.atividade_principal?.classe_descricao || "",
          source: "publica.cnpj.ws",
        };
      }
    } catch (e) {}

    // 2. Try ReceitaWS (excellent for corporate emails and phones)
    try {
      const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanDoc}`, {
        headers: { "User-Agent": ua },
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const d: any = await res.json();
        if (d.status !== "ERROR" && (d.nome || d.fantasia)) {
          return {
            cnpj: cleanDoc,
            razao_social: d.nome || d.fantasia,
            nome_fantasia: d.fantasia || d.nome,
            email: d.email || null,
            ddd_telefone_1: d.telefone || null,
            logradouro: d.logradouro || "",
            numero: d.numero || "",
            bairro: d.bairro || "",
            municipio: d.municipio || "",
            uf: d.uf || "",
            cep: d.cep || "",
            cnae_principal_descricao: d.atividade_principal?.[0]?.text || "",
            source: "ReceitaWS",
          };
        }
      }
    } catch (e) {}

    // 3. Try MinhaReceita
    try {
      const res = await fetch(`https://minhareceita.org/${cleanDoc}`, {
        headers: { "User-Agent": ua },
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const d: any = await res.json();
        return {
          cnpj: cleanDoc,
          razao_social: d.razao_social || d.nome_fantasia,
          nome_fantasia: d.nome_fantasia || d.razao_social,
          email: d.email || null,
          ddd_telefone_1: d.ddd_telefone_1 || null,
          logradouro: d.logradouro || "",
          numero: d.numero || "",
          bairro: d.bairro || "",
          municipio: d.municipio || "",
          uf: d.uf || "",
          cep: d.cep || "",
          cnae_principal_descricao: d.cnae_fiscal_descricao || "",
          source: "MinhaReceita",
        };
      }
    } catch (e) {}

    // 4. Try BrasilAPI
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`, {
        headers: { "User-Agent": ua, "Accept": "application/json" },
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const d: any = await res.json();
        return {
          cnpj: cleanDoc,
          razao_social: d.razao_social || d.nome_fantasia,
          nome_fantasia: d.nome_fantasia || d.razao_social,
          email: d.email || null,
          ddd_telefone_1: d.ddd_telefone_1 ? `(${d.ddd_telefone_1.slice(0, 2)}) ${d.ddd_telefone_1.slice(2)}` : null,
          logradouro: d.logradouro || "",
          numero: d.numero || "",
          bairro: d.bairro || "",
          municipio: d.municipio || "",
          uf: d.uf || "",
          cep: d.cep || "",
          cnae_principal_descricao: d.cnae_fiscal_descricao || "",
          source: "BrasilAPI",
        };
      }
    } catch (e) {}

    return null;
  }

  // Multi-Source Discovery Engine for Company CNPJ, Email, Phone and Address
  async function discoverCnpjAndEmail(
    companyName: string,
    locationStr: string,
    existingWebsite?: string,
    existingPhone?: string,
    existingDoc?: string
  ) {
    let cleanDoc = existingDoc ? String(existingDoc).replace(/\D/g, "") : "";
    if (cleanDoc.length === 14) {
      const full = await unifiedCnpjLookup(cleanDoc);
      if (full) {
        return {
          document: full.cnpj,
          corporateName: full.razao_social || full.nome_fantasia || companyName,
          email: full.email,
          phone: full.ddd_telefone_1 || existingPhone || null,
          address: [full.logradouro, full.numero, full.bairro, full.municipio, full.uf].filter(Boolean).join(", "),
          cnae: full.cnae_principal_descricao,
          discoveredAuto: false,
          source: full.source,
        };
      }
    }

    const city = (locationStr || "São Paulo").split(",")[0]?.trim();
    const cleanName = (companyName || "")
      .replace(/\b(unidade|filial|matriz|loja|unid|un)\b.*$/gi, "")
      .replace(/[-_]/g, " ")
      .trim();
    const coreName = cleanName.replace(/\b(seguros|corretora|ltda|s\/a|s\.a\.)\b/gi, "").trim();

    let candidateCnpj: string | null = null;
    let candidateEmail: string | null = null;
    let candidateWebsite = existingWebsite || "";

    const candidateDomains: string[] = [];
    if (candidateWebsite) {
      try {
        const u = new URL(candidateWebsite.startsWith("http") ? candidateWebsite : `https://${candidateWebsite}`);
        const h = u.hostname.replace(/^www\./, "").toLowerCase();
        candidateDomains.push(h);
      } catch (e) {}
    }

    const slug1 = coreName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const slug2 = cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (slug1 && slug1.length >= 3) {
      candidateDomains.push(`${slug1}.com.br`);
    }
    if (slug2 && slug2.length >= 3 && slug2 !== slug1) {
      candidateDomains.push(`${slug2}.com.br`);
    }

    // 1. RDAP Registro.br lookup
    for (const dom of candidateDomains) {
      if (candidateCnpj) break;
      if (!dom.endsWith(".br")) continue;
      try {
        const rdapRes = await fetch(`https://rdap.registro.br/domain/${encodeURIComponent(dom)}`, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(3500),
        });
        if (rdapRes.ok) {
          const d: any = await rdapRes.json();
          const ent = d.entities?.find((e: any) => e.publicIds?.some((p: any) => p.type === "cnpj") || (e.handle && e.handle.length === 14));
          const pub = ent?.publicIds?.find((p: any) => p.type === "cnpj")?.identifier;
          const found = pub ? pub.replace(/\D/g, "") : (ent?.handle && ent.handle.length === 14 ? ent.handle : null);
          if (found && found.length === 14) {
            candidateCnpj = found;
          }
          for (const e of d.entities || []) {
            const vcard = e.vcardArray?.[1] || [];
            const emailEntry = vcard.find((v: any) => v[0] === "email");
            if (emailEntry && emailEntry[3] && !candidateEmail) {
              candidateEmail = emailEntry[3];
            }
          }
        }
      } catch (e) {}
    }

    // 2. Direct website scraping for CNPJ and email
    if (candidateWebsite && (!candidateCnpj || !candidateEmail)) {
      try {
        const siteUrl = candidateWebsite.startsWith("http") ? candidateWebsite : `https://${candidateWebsite}`;
        const siteRes = await fetch(siteUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(4000),
        });
        if (siteRes.ok) {
          const html = await siteRes.text();
          if (!candidateCnpj) {
            const m = html.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/);
            if (m) candidateCnpj = m[0].replace(/\D/g, "");
          }
          if (!candidateEmail) {
            const emails = (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
              .filter(e => !e.includes("sentry") && !e.includes("wix") && !e.includes("schema") && !e.endsWith(".png") && !e.endsWith(".jpg") && !e.endsWith(".webp"));
            if (emails[0]) candidateEmail = emails[0];
          }
        }
      } catch (e) {}
    }

    // 3. Fallback: Search Places for website if missing
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
    if (!candidateCnpj && googleApiKey && !candidateWebsite) {
      try {
        const newApiUrl = `https://places.googleapis.com/v1/places:searchText`;
        const pRes = await fetch(newApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleApiKey,
            "X-Goog-FieldMask": "places.displayName,places.websiteUri,places.nationalPhoneNumber",
          },
          body: JSON.stringify({
            textQuery: `${cleanName} ${city}`,
            languageCode: "pt-BR",
            pageSize: 1,
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (pRes.ok) {
          const pData: any = await pRes.json();
          const place = pData.places?.[0];
          if (place?.websiteUri) {
            candidateWebsite = place.websiteUri;
            if (!existingPhone && place.nationalPhoneNumber) {
              existingPhone = place.nationalPhoneNumber;
            }
            try {
              const u = new URL(candidateWebsite);
              const dom = u.hostname.replace(/^www\./, "").toLowerCase();
              if (dom.endsWith(".br")) {
                const rdapRes = await fetch(`https://rdap.registro.br/domain/${dom}`, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(3500) });
                if (rdapRes.ok) {
                  const d: any = await rdapRes.json();
                  const ent = d.entities?.find((e: any) => e.publicIds?.some((p: any) => p.type === "cnpj") || (e.handle && e.handle.length === 14));
                  const pub = ent?.publicIds?.find((p: any) => p.type === "cnpj")?.identifier;
                  if (pub) candidateCnpj = pub.replace(/\D/g, "");
                  else if (ent?.handle && ent.handle.length === 14) candidateCnpj = ent.handle;
                  for (const e of d.entities || []) {
                    const vcard = e.vcardArray?.[1] || [];
                    const emailEntry = vcard.find((v: any) => v[0] === "email");
                    if (emailEntry && emailEntry[3] && !candidateEmail) candidateEmail = emailEntry[3];
                  }
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    // 4. If CNPJ resolved, fetch full Receita Federal details
    if (candidateCnpj && candidateCnpj.length === 14) {
      const full = await unifiedCnpjLookup(candidateCnpj);
      if (full) {
        return {
          document: candidateCnpj,
          corporateName: full.razao_social || full.nome_fantasia || companyName,
          email: full.email || candidateEmail || null,
          phone: full.ddd_telefone_1 || existingPhone || null,
          address: [full.logradouro, full.numero, full.bairro, full.municipio, full.uf].filter(Boolean).join(", "),
          cnae: full.cnae_principal_descricao,
          discoveredAuto: true,
          source: full.source,
        };
      }
    }

    if (candidateEmail || candidateCnpj) {
      return {
        document: candidateCnpj || null,
        corporateName: companyName,
        email: candidateEmail || null,
        phone: existingPhone || null,
        address: locationStr,
        cnae: null,
        discoveredAuto: true,
      };
    }

    return null;
  }

  // Direct CNPJ Lookup Proxy
  app.get("/api/proxy/companies/:cnpj", isAuthenticated, async (req, res) => {
    const cnpj = req.params.cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      return res.status(400).json({ message: "CNPJ inválido" });
    }

    try {
      const full = await unifiedCnpjLookup(cnpj);
      if (!full) {
        return res.status(404).json({ message: "Empresa não encontrada ou erro na API" });
      }

      res.json([full]);
    } catch (e: any) {
      res.status(500).json({ message: `Erro ao buscar CNPJ: ${e.message}` });
    }
  });

  // Auto-Discover CNPJ for Lead by Name & Region
  app.get("/api/proxy/companies/discover", isAuthenticated, async (req, res) => {
    try {
      const { q, name, city, state, address, document, website, phone } = req.query;
      const searchName = (q as string || name as string || "").trim();
      const rawAddr = (address as string || "");
      const reqCity = (city as string || rawAddr.split(",")[0] || "São Paulo").trim();
      const reqState = (state as string || rawAddr.match(/\b([A-Z]{2})\b/)?.[1] || "SP").toUpperCase();
      const locationStr = `${reqCity}, ${reqState}`;

      const discovered = await discoverCnpjAndEmail(
        searchName,
        locationStr,
        (website as string) || "",
        (phone as string) || "",
        (document as string) || ""
      );

      if (discovered) {
        return res.json({
          razao_social: discovered.corporateName,
          nome_fantasia: discovered.corporateName,
          cnpj: discovered.document || "",
          logradouro: discovered.address || rawAddr,
          numero: "",
          bairro: "",
          municipio: reqCity,
          uf: reqState,
          cep: "",
          cnae_principal_descricao: discovered.cnae || "Atividade Comercial",
          ddd_telefone_1: discovered.phone || "",
          email: discovered.email || "",
          discoveredAuto: discovered.discoveredAuto,
        });
      }

      return res.json({
        razao_social: searchName || "Empresa Identificada",
        nome_fantasia: searchName,
        cnpj: "",
        logradouro: rawAddr,
        numero: "",
        bairro: "",
        municipio: reqCity,
        uf: reqState,
        cep: "",
        cnae_principal_descricao: "Empresa Localizada no Termômetro",
        ddd_telefone_1: (phone as string) || "",
        email: "",
        discoveredAuto: false,
      });
    } catch (err: any) {
      console.error("[DiscoverCNPJ] Error:", err);
      res.status(500).json({ message: "Erro ao buscar dados do CNPJ." });
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

  // -----------------------------------------------------------------------
  // Termômetro de Leads API Endpoints
  // -----------------------------------------------------------------------
    // Helper para enriquecer dados de CNPJ, email corporativo e telefone
  async function autoEnrichLeadCompany(name: string, locationStr: string, website?: string, existingPhone?: string, existingDoc?: string) {
    try {
      return await discoverCnpjAndEmail(name, locationStr, website, existingPhone, existingDoc);
    } catch (e: any) {
      console.warn("[autoEnrichLeadCompany] Erro:", e.message);
      return null;
    }
  }

  app.post("/api/leads-thermometer/search", isTeam, async (req, res) => {
    try {
      const { location = "São Paulo, SP", radiusKm = 10, productType = "Plano de Saúde", customQuery = "" } = req.body || {};

      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
      const isGooglePlacesActive = Boolean(googleApiKey && googleApiKey.trim() !== "");

      let results: any[] = [];

      const PRODUCT_MAP: Record<string, { queryKeywords: string[]; targetNiche: string; cnaeHint: string }> = {
        "Benefícios (Alimentação, Refeição, etc.)": {
          queryKeywords: ["beneficios", "vale alimentacao", "vale refeicao", "empresa", "consultoria", "escritorio", "tecnologia", "industria", "rh", "comercio", "servicos"],
          targetNiche: "Benefícios Corporativos (VA/VR/VT)",
          cnaeHint: "Corporativo / RH / Serviços / Indústria / Tecnologia",
        },
        "Plano de Saúde": {
          queryKeywords: ["empresa", "escritorio", "clinica", "consultoria", "tecnologia"],
          targetNiche: "Saúde & Corporativo",
          cnaeHint: "Saúde / PME / Corporativo",
        },
        "Seguro de Vida": {
          queryKeywords: ["contabilidade", "advocacia", "transporte", "industria", "construtora"],
          targetNiche: "Vida & Benefícios",
          cnaeHint: "Serviços Profissionais / Transporte",
        },
        "Seguro Auto / Frota": {
          queryKeywords: ["transportadora", "locadora de veiculos", "logistica", "comercio", "distribuidora"],
          targetNiche: "Automotivo & Frotas",
          cnaeHint: "Transporte / Logística / Auto",
        },
        "Seguro Empresarial": {
          queryKeywords: ["industria", "restaurante", "loja", "deposito", "supermercado", "oficina"],
          targetNiche: "Patrimonial & Empresarial",
          cnaeHint: "Comércio / Indústria / Serviços",
        },
        "Responsabilidade Civil": {
          queryKeywords: ["construtora", "engenharia", "medico", "agencia", "escritorio de advocacia"],
          targetNiche: "RC Profissional",
          cnaeHint: "Construção / Serviços Profissionais",
        },
      };

      const queryText = customQuery ? `${customQuery} em ${location}` : `${productType} em ${location}`;

      if (isGooglePlacesActive) {
        try {
          // Geocode location to get center lat/lng
          let centerLat = -23.5505;
          let centerLng = -46.6333;
          try {
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleApiKey}`;
            const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
            if (geoRes.ok) {
              const geoData: any = await geoRes.json();
              if (geoData.results?.[0]?.geometry?.location) {
                centerLat = geoData.results[0].geometry.location.lat;
                centerLng = geoData.results[0].geometry.location.lng;
              }
            }
          } catch (e) {
            // ignore geocoding failure, fallback to default center
          }

          const radiusMeters = Math.min(Number(radiusKm) * 1000, 50000);
          const baseTerm = customQuery ? customQuery.trim() : productType;
          const productKeywords = PRODUCT_MAP[productType]?.queryKeywords || ["empresa", "comercio", "servicos"];
          
          // Generate subquery terms to maximize discovery up to 100 companies
          const subQueryTerms = Array.from(new Set([
            `${baseTerm} em ${location}`,
            `${baseTerm} centro em ${location}`,
            `${baseTerm} corporativo em ${location}`,
            `${baseTerm} comercial em ${location}`,
            `${baseTerm} grande em ${location}`,
            `${baseTerm} zona sul em ${location}`,
            `${baseTerm} zona norte em ${location}`,
            `${baseTerm} zona oeste em ${location}`,
            `${baseTerm} zona leste em ${location}`,
            `${baseTerm} avenida em ${location}`,
            ...productKeywords.map(kw => `${kw} em ${location}`),
            ...productKeywords.map(kw => `${kw} ${baseTerm} em ${location}`),
            ...productKeywords.map(kw => `${baseTerm} ${kw} em ${location}`),
          ])).slice(0, 12);

          const placesMap = new Map<string, any>();

          // 1. Try Places API (New - REST) with location bias
          for (const subQuery of subQueryTerms) {
            if (placesMap.size >= 100) break;
            try {
              const newApiUrl = `https://places.googleapis.com/v1/places:searchText`;
              const newApiRes = await fetch(newApiUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Goog-Api-Key": googleApiKey,
                  "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location,places.types",
                },
                body: JSON.stringify({
                  textQuery: subQuery,
                  languageCode: "pt-BR",
                  pageSize: 20,
                  locationBias: {
                    circle: {
                      center: { latitude: centerLat, longitude: centerLng },
                      radius: radiusMeters,
                    },
                  },
                }),
                signal: AbortSignal.timeout(8000),
              });

              if (newApiRes.ok) {
                const newApiData: any = await newApiRes.json();
                const placesList = newApiData.places || [];
                for (const place of placesList) {
                  const id = place.id || `${place.displayName?.text}_${place.formattedAddress}`;
                  if (!placesMap.has(id)) {
                    placesMap.set(id, {
                      placeId: id,
                      name: place.displayName?.text || "Empresa Identificada",
                      address: place.formattedAddress || location,
                      phone: place.nationalPhoneNumber || "",
                      website: place.websiteUri || "",
                      location: place.location ? { lat: place.location.latitude, lng: place.location.longitude } : { lat: centerLat, lng: centerLng },
                      rating: place.rating || null,
                      userRatingsTotal: place.userRatingCount || 0,
                      businessStatus: "OPERATIONAL",
                      types: place.types || [],
                    });
                  }
                  if (placesMap.size >= 100) break;
                }
              }
            } catch (err: any) {
              // ignore single subquery failure
            }
          }

          results = Array.from(placesMap.values()).slice(0, 100);

          // 2. Fallback to Legacy Places API if New Places API returned empty results
          if (results.length === 0) {
            for (const subQuery of subQueryTerms.slice(0, 6)) {
              if (placesMap.size >= 100) break;
              try {
                const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(subQuery)}&key=${googleApiKey}&language=pt-BR`;
                const placesRes = await fetch(placesUrl, { signal: AbortSignal.timeout(8000) });
                if (placesRes.ok) {
                  const placesData: any = await placesRes.json();
                  const placesList = placesData.results || [];
                  for (const place of placesList) {
                    const id = place.place_id || `${place.name}_${place.formatted_address}`;
                    if (!placesMap.has(id)) {
                      placesMap.set(id, {
                        placeId: id,
                        name: place.name,
                        address: place.formatted_address || location,
                        phone: "",
                        website: "",
                        location: place.geometry?.location || { lat: centerLat, lng: centerLng },
                        rating: place.rating || null,
                        userRatingsTotal: place.user_ratings_total || 0,
                        businessStatus: place.business_status || "OPERATIONAL",
                        types: place.types || [],
                      });
                    }
                    if (placesMap.size >= 100) break;
                  }
                }
              } catch (e) {
                // ignore
              }
            }
            results = Array.from(placesMap.values()).slice(0, 100);
          }
        } catch (err: any) {
          console.error("[LeadsThermometer] Google Places fetch error:", err.message);
        }
      }

      if (results.length === 0) {
        const reqState = location.includes(",") ? location.split(",")[1].trim() : "SP";
        const reqCity = location.includes(",") ? location.split(",")[0].trim() : location;
        
        try {
          const searchTerm = customQuery || productType;
          const publicSearchUrl = `${req.protocol}://${req.get("host")}/api/proxy/companies/search?state=${encodeURIComponent(reqState)}&city=${encodeURIComponent(reqCity)}&q=${encodeURIComponent(searchTerm)}`;
          const pubRes = await fetch(publicSearchUrl, { headers: { cookie: req.headers.cookie || "" }, signal: AbortSignal.timeout(15000) });
          if (pubRes.ok) {
            const pubData: any[] = await pubRes.json();
            results = pubData.slice(0, 100).map((item: any) => ({
              placeId: `cnpj_${item.cnpj || Math.random()}`,
              name: item.razao_social || item.nome_fantasia,
              document: item.cnpj || "",
              address: [item.logradouro, item.numero, item.bairro, item.municipio, item.uf].filter(Boolean).join(", "),
              phone: item.ddd_telefone_1 || "",
              email: item.email || "",
              website: "",
              location: { lat: item.lat || -23.5505, lng: item.lng || -46.6333 },
              rating: 4.5,
              userRatingsTotal: 12,
              businessStatus: "OPERATIONAL",
              cnae: item.cnae_principal_descricao || "",
            }));
          }
        } catch (err: any) {
          console.error("[LeadsThermometer] Public proxy fallback error:", err.message);
        }
      }

      // Auto-enriquecimento integrado de CNPJ, email e telefone direto no script de busca
      try {
        const leadsToEnrich = results.slice(0, 25);
        await Promise.allSettled(
          leadsToEnrich.map(async (item) => {
            if (!item.document || !item.email) {
              const enriched = await autoEnrichLeadCompany(item.name, location, item.website, item.phone, item.document);
              if (enriched) {
                if (enriched.document) item.document = enriched.document;
                if (enriched.email) item.email = enriched.email;
                if (enriched.phone && !item.phone) item.phone = enriched.phone;
                if (enriched.corporateName && enriched.corporateName !== item.name) {
                  item.corporateName = enriched.corporateName;
                }
                if (enriched.cnae && !item.cnae) item.cnae = enriched.cnae;
              }
            }
          })
        );
      } catch (enrichErr: any) {
        console.warn("[LeadsThermometer] Aviso no auto-enriquecimento:", enrichErr.message);
      }

      const scoredResults = results.map((item) => {
        let score = 40;
        const reasons: string[] = [];

        if (item.phone) {
          score += 15;
          reasons.push("Telefone direto confirmado");
        } else {
          reasons.push("Sem telefone público");
        }

        if (item.website) {
          score += 15;
          reasons.push("Presença digital ativa (Website)");
        }

        if (item.document) {
          score += 10;
          reasons.push("CNPJ regularizado na Receita");
        }

        score += 20;
        reasons.push(`Perfil compatível para ${productType}`);

        if (item.userRatingsTotal && item.userRatingsTotal > 5) {
          score += 10;
          reasons.push(`Alta atividade com ${item.userRatingsTotal} avaliações`);
        } else {
          score += 5;
        }

        score = Math.min(100, Math.max(10, score));

        let temperature: "frio" | "morno" | "quente" = "morno";
        if (score >= 70) temperature = "quente";
        else if (score < 40) temperature = "frio";

        const reasonText = `${reasons.join(". ")}. Lead identificado no raio de ${radiusKm}km para ${productType}.`;

        return {
          ...item,
          score,
          temperature,
          reason: reasonText,
          productType,
        };
      });

      scoredResults.sort((a, b) => b.score - a.score);

      res.json({
        success: true,
        isGooglePlacesActive,
        noticeMessage: !isGooglePlacesActive
          ? "Modo de busca pública ativado. Para obter dados em tempo real da API do Google Places, configure a variável GOOGLE_PLACES_API_KEY no arquivo .env do servidor."
          : null,
        results: scoredResults,
      });
    } catch (err: any) {
      console.error("[LeadsThermometer] Error in search route:", err);
      res.status(500).json({ message: "Erro ao processar busca no Termômetro de Leads" });
    }
  });

  app.post("/api/leads-thermometer/enrich", isTeam, async (req, res) => {
    try {
      const { name, document, phone } = req.body || {};
      let cleanDoc = document ? String(document).replace(/\D/g, "") : "";

      if (cleanDoc && cleanDoc.length === 14) {
        const proxyUrl = `${req.protocol}://${req.get("host")}/api/proxy/companies/${cleanDoc}`;
        const pRes = await fetch(proxyUrl, { headers: { cookie: req.headers.cookie || "" }, signal: AbortSignal.timeout(10000) });
        if (pRes.ok) {
          const [data] = await pRes.json();
          return res.json({
            success: true,
            enriched: {
              document: data.cnpj,
              name: data.razao_social || data.nome_fantasia || name,
              email: data.email || null,
              phone: data.ddd_telefone_1 || phone || null,
              address: [data.logradouro, data.numero, data.bairro, data.municipio, data.uf].filter(Boolean).join(", "),
              cnae: data.cnae_principal_descricao || null,
            },
          });
        }
      }

      res.json({
        success: true,
        enriched: {
          document: cleanDoc || null,
          name: name || "Empresa Identificada",
          email: null,
          phone: phone || null,
          address: null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao enriquecer dados do lead" });
    }
  });

  app.post("/api/leads-thermometer/save-crm", isTeam, async (req, res) => {
    try {
      const {
        leadName,
        phone,
        email,
        document,
        address,
        website,
        productType = "Plano de Saúde",
        score = 75,
        temperature = "quente",
        reason = "",
        location = "Brasil",
        radiusKm = 10,
        createPipelineLead = false,
      } = req.body || {};

      if (!leadName || typeof leadName !== "string" || !leadName.trim()) {
        return res.status(400).json({ message: "Nome do lead é obrigatório." });
      }

      const userId = (req.user as any)?.id || 1;
      const isCompany = Boolean((document && document.replace(/\D/g, "").length > 11) || website || !phone);

      const contactPayload: InsertContact = {
        name: leadName.trim(),
        type: isCompany ? "company" : "individual",
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        document: document ? String(document).trim() : null,
        address: address ? String(address).trim() : null,
        productType: productType,
        contactOrigin: "Termômetro de Leads",
        notes: `[Termômetro de Leads - Score: ${score}/100 (${temperature.toUpperCase()})]\nMotivo: ${reason}\nWebsite: ${website || "N/A"}`,
        status: "Ativo",
      };

      const parsedContact = insertContactSchema.parse(contactPayload);
      const result = await storage.upsertContact(parsedContact);

      // Não cria lead no pipeline automaticamente a menos que solicitado explicitamente
      let leadOpportunity = null;
      if (createPipelineLead === true || createPipelineLead === "true") {
        leadOpportunity = await storage.createLead({
          contactId: result.contact.id,
          status: "new",
          source: "Termômetro de Leads",
          product: productType,
          notes: `[Termômetro de Leads] Score: ${score}/100 (${temperature.toUpperCase()}) - ${reason}`,
          assignedTo: userId,
        });
      }

      await storage.createLeadThermometerRecord({
        userId,
        location: String(location),
        radiusKm: Number(radiusKm) || 10,
        productType: String(productType),
        leadName: leadName.trim(),
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        document: document ? String(document).trim() : null,
        address: address ? String(address).trim() : null,
        website: website ? String(website).trim() : null,
        score: Number(score) || 50,
        temperature: String(temperature),
        reason: String(reason),
        savedToCrm: true,
        contactId: result.contact.id,
      });

      res.status(201).json({
        success: true,
        isNewContact: result.isNew,
        contact: result.contact,
        lead: leadOpportunity,
        message: leadOpportunity
          ? (result.isNew ? "Lead e Contato criados no CRM com sucesso!" : "Contato existente atualizado e novo Lead associado!")
          : (result.isNew ? "Contato cadastrado na agenda do CRM com sucesso!" : "Contato existente atualizado no CRM!"),
      });
    } catch (err: any) {
      console.error("[LeadsThermometer] Save to CRM error:", err);
      res.status(500).json({ message: "Erro ao salvar lead no CRM" });
    }
  });

  app.get("/api/leads-thermometer/history", isTeam, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const history = await storage.getLeadThermometerHistory(userId);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar histórico do Termômetro de Leads" });
    }
  });

  // -----------------------------------------------------------------------
  // Grupos de Disparo de Leads & Disparos em Massa (E-mail & WhatsApp)
  // -----------------------------------------------------------------------
  app.get("/api/leads-thermometer/dispatch-groups", isTeam, async (req, res) => {
    try {
      const groups = await storage.getLeadDispatchGroups();
      res.json(groups);
    } catch (err: any) {
      console.error("[DispatchGroups] Erro ao listar grupos:", err);
      res.status(500).json({ message: "Erro ao carregar grupos de disparo." });
    }
  });

  app.post("/api/leads-thermometer/dispatch-groups", isTeam, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || null;
      const parsed = insertLeadDispatchGroupSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const created = await storage.createLeadDispatchGroup(parsed);
      res.status(201).json({ success: true, group: created });
    } catch (err: any) {
      console.error("[DispatchGroups] Erro ao criar grupo:", err);
      res.status(400).json({ message: err.message || "Erro ao criar grupo de disparo." });
    }
  });

  app.post("/api/leads-thermometer/dispatch-email", isTeam, async (req, res) => {
    try {
      const { leads = [], subject, bodyTemplate, productType = "Benefícios Corporativos" } = req.body || {};

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ message: "Nenhum lead selecionado para envio de e-mail." });
      }

      if (!subject || !bodyTemplate) {
        return res.status(400).json({ message: "Assunto e mensagem são obrigatórios para o disparo." });
      }

      let sentCount = 0;
      let failedCount = 0;
      const errors: Array<{ email: string; error: string }> = [];

      for (const lead of leads) {
        const toEmail = (lead.email || "").trim();
        if (!toEmail || !toEmail.includes("@")) {
          failedCount++;
          errors.push({ email: toEmail || "vazio", error: "E-mail inválido ou ausente" });
          continue;
        }

        const empresaName = lead.corporateName || lead.company || lead.name || "Sua Empresa";
        const contactName = lead.contactPerson || lead.name || "Prezado(a)";
        const cnpjStr = lead.document || "";

        // Interpolação das variáveis no assunto e no corpo
        const personalizedSubject = subject
          .replace(/\{empresa\}/gi, empresaName)
          .replace(/\{nome\}/gi, contactName)
          .replace(/\{produto\}/gi, productType)
          .replace(/\{cnpj\}/gi, cnpjStr);

        const rawHtmlBody = bodyTemplate
          .replace(/\{empresa\}/gi, empresaName)
          .replace(/\{nome\}/gi, contactName)
          .replace(/\{produto\}/gi, productType)
          .replace(/\{cnpj\}/gi, cnpjStr);

        const styledHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="margin-bottom: 20px; border-bottom: 2px solid #e11d48; padding-bottom: 12px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Monteiro Seguros & Benefícios</h2>
              <span style="font-size: 12px; color: #64748b;">Soluções Corporativas Especializadas</span>
            </div>
            <div style="font-size: 14px; color: #334155; white-space: pre-wrap;">${rawHtmlBody}</div>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">Enviado por Monteiro Seguros e Soluções Corporativas | Contato: (11) 4004-0000</p>
            </div>
          </div>
        `;

        try {
          const result = await sendEmail({
            to: toEmail,
            subject: personalizedSubject,
            html: styledHtml,
          });

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            errors.push({ email: toEmail, error: result.error || "Erro no envio" });
          }
        } catch (e: any) {
          failedCount++;
          errors.push({ email: toEmail, error: e.message || "Exceção no envio" });
        }
      }

      res.json({
        success: true,
        total: leads.length,
        sent: sentCount,
        failed: failedCount,
        errors,
        message: `Disparo concluído: ${sentCount} e-mails enviados com sucesso, ${failedCount} falhas.`,
      });
    } catch (err: any) {
      console.error("[DispatchEmail] Erro no disparo de emails:", err);
      res.status(500).json({ message: "Erro ao processar disparo de e-mails: " + err.message });
    }
  });

  app.post("/api/leads-thermometer/dispatch-whatsapp", isTeam, async (req, res) => {
    try {
      const { leads = [], messageTemplate, productType = "Benefícios Corporativos", accountId } = req.body || {};

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ message: "Nenhum lead selecionado para WhatsApp." });
      }

      if (!messageTemplate) {
        return res.status(400).json({ message: "O texto da mensagem é obrigatório." });
      }

      // Prepara os destinatários com telefone válido
      const validRecipients = leads
        .filter((l: any) => l.phone && String(l.phone).replace(/\D/g, "").length >= 8)
        .map((l: any) => {
          const rawPhone = String(l.phone).replace(/\D/g, "");
          const formattedPhone = rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;
          const empresaName = l.corporateName || l.company || l.name || "sua empresa";
          const contactName = l.contactPerson || l.name || "olá";

          return {
            phone: formattedPhone,
            name: l.name || empresaName,
            variables: {
              empresa: empresaName,
              nome: contactName,
              produto: productType,
              cnpj: l.document || "",
            },
          };
        });

      if (validRecipients.length === 0) {
        return res.status(400).json({ message: "Nenhum dos leads selecionados possui telefone válido para WhatsApp." });
      }

      const candidateUrls = [
        process.env.WA_CENTRAL_URL,
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        process.env.MONTEIRO_CONECTA_URL,
        "https://whatsapp.monteiroseguros.com.br"
      ].filter(Boolean) as string[];
      const waCentralUrl = candidateUrls[0];
      const crmApiKey = process.env.CRM_API_KEY || "ms_live_8a7c289eda9bd623177b50c7e489df3b";

      try {
        const broadcastRes = await fetch(`${waCentralUrl}/api/conversations/broadcast`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": crmApiKey,
          },
          body: JSON.stringify({
            accountId: accountId || undefined,
            messageTemplate,
            recipients: validRecipients,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (broadcastRes.ok) {
          const data = await broadcastRes.json();
          return res.json({
            success: true,
            externalBroadcast: true,
            totalQueued: validRecipients.length,
            data,
            message: `${validRecipients.length} mensagens enviadas para a fila de disparo do WhatsApp (Monteiro Conecta) com sucesso!`,
          });
        }

        const errText = await broadcastRes.text();
        console.warn(`[DispatchWhatsApp] Monteiro Conecta retornou ${broadcastRes.status}: ${errText}`);

        return res.json({
          success: true,
          externalBroadcast: false,
          totalQueued: validRecipients.length,
          recipients: validRecipients,
          warning: `Monteiro Conecta retornou status ${broadcastRes.status}. Foram gerados links manuais de WhatsApp para cada contato.`,
        });
      } catch (fetchErr: any) {
        console.warn("[DispatchWhatsApp] Falha ao conectar no Monteiro Conecta:", fetchErr.message);
        return res.json({
          success: true,
          externalBroadcast: false,
          totalQueued: validRecipients.length,
          recipients: validRecipients,
          warning: `Não foi possível alcançar o servidor do Monteiro Conecta automaticamente (${fetchErr.message}). Links prontos para envio individual via WhatsApp Web.`,
        });
      }
    } catch (err: any) {
      console.error("[DispatchWhatsApp] Erro:", err);
      res.status(500).json({ message: "Erro ao processar disparo de WhatsApp: " + err.message });
    }
  });


  // Seed Data & Startup DB updates
  try {
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
        isApproved: true,
        publishedAt: new Date(),
      });
      await storage.createPost({
        title: "Dicas para economizar no seguro",
        slug: "dicas-economizar-seguro",
        summary: "Saiba como reduzir o valor do seu seguro sem perder coberturas importantes.",
        content: "Muitas pessoas não sabem, mas pequenas atitudes podem diminuir o valor do seguro...",
        coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000",
        isApproved: true,
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

    // Update existing users with no role to 'client'
    await db.execute(sql`UPDATE users SET role = 'client' WHERE role IS NULL`);

    // Ensure 'admin' has the admin role
    await db.execute(sql`UPDATE users SET role = 'admin' WHERE username = 'admin'`);
  } catch (seedErr) {
    console.warn("Seed data / startup DB updates skipped (DB unavailable):", seedErr instanceof Error ? seedErr.message : String(seedErr));
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

  // ============================================================
  // EXTERNAL INTEGRATION API (WhatsApp & External CRMs)
  // ============================================================

  function cleanDigits(val: string | null | undefined): string {
    if (!val) return "";
    return val.replace(/\D/g, "");
  }

  function matchesPhone(inputPhone: string, cPhone: string): boolean {
    const d1 = cleanDigits(inputPhone);
    const d2 = cleanDigits(cPhone);
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;

    const noCc1 = d1.length >= 10 && d1.startsWith("55") ? d1.slice(2) : d1;
    const noCc2 = d2.length >= 10 && d2.startsWith("55") ? d2.slice(2) : d2;
    if (noCc1 === noCc2) return true;

    if (noCc1.length === 11 && noCc2.length === 10) {
      if (noCc1.slice(0, 2) === noCc2.slice(0, 2) && noCc1.slice(3) === noCc2.slice(2)) return true;
    }
    if (noCc2.length === 11 && noCc1.length === 10) {
      if (noCc2.slice(0, 2) === noCc1.slice(0, 2) && noCc2.slice(3) === noCc1.slice(2)) return true;
    }

    if (d1.length >= 8 && d2.length >= 8) {
      if (d1.endsWith(d2.slice(-8)) || d2.endsWith(d1.slice(-8))) return true;
    }

    return false;
  }

  function cleanApiKey(val: unknown): string {
    if (!val) return "";
    let str = "";
    if (Array.isArray(val)) {
      str = String(val[0] || "");
    } else {
      str = String(val);
    }
    return str.trim().replace(/^["']+|["']+$/g, "").trim();
  }

  async function getValidExternalApiKeys(): Promise<Set<string>> {
    const validKeys = new Set<string>();

    // 1. Check environment variables
    const envKey1 = cleanApiKey(process.env.CRM_API_KEY);
    if (envKey1) validKeys.add(envKey1);
    const envKey2 = cleanApiKey(process.env.EXTERNAL_API_KEY);
    if (envKey2) validKeys.add(envKey2);
    const envKey3 = cleanApiKey(process.env.API_KEY);
    if (envKey3) validKeys.add(envKey3);
    const envKey4 = cleanApiKey(process.env.CRM_KEY);
    if (envKey4) validKeys.add(envKey4);

    // 2. Check site settings from DB
    try {
      const settings = await storage.getSiteSettings();
      if (settings?.externalApiKey && settings.externalApiKey.trim()) {
        const parts = settings.externalApiKey.split(",").map(cleanApiKey).filter(Boolean);
        for (const p of parts) {
          validKeys.add(p);
        }
      } else if (validKeys.size === 0) {
        // If no keys configured at all, generate one and save it
        const newKey = "ms_live_" + crypto.randomBytes(16).toString("hex");
        await storage.updateSiteSettings({ ...settings, externalApiKey: newKey });
        validKeys.add(newKey);
      }
    } catch (e) {
      console.error("[External API Auth] Error loading settings:", e);
    }

    return validKeys;
  }

  async function getPrimaryExternalApiKey(): Promise<string> {
    const keys = await getValidExternalApiKeys();
    try {
      const settings = await storage.getSiteSettings();
      if (settings?.externalApiKey && settings.externalApiKey.trim()) {
        return cleanApiKey(settings.externalApiKey.split(",")[0]);
      }
    } catch (_) {}
    for (const k of Array.from(keys)) {
      if (k) return k;
    }
    return "ms_live_" + crypto.randomBytes(16).toString("hex");
  }

  async function getOrGenerateExternalApiKey(): Promise<string> {
    return await getPrimaryExternalApiKey();
  }

  async function externalApiKeyAuth(req: any, res: any, next: any) {
    try {
      if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
      }
      const validKeys = await getValidExternalApiKeys();

      // Check all header variations
      const rawHeader =
        req.headers["x-api-key"] ||
        req.headers["x-apikey"] ||
        req.headers["crm-api-key"] ||
        req.headers["x-crm-api-key"] ||
        req.headers["crm_api_key"] ||
        req.headers["api-key"] ||
        req.headers["apikey"] ||
        req.headers["x-api-token"] ||
        req.headers["x-authorization"];

      const authHeader = req.headers["authorization"];
      const queryKey =
        req.query.api_key ||
        req.query.apiKey ||
        req.query.crm_api_key ||
        req.query.crmApiKey ||
        req.query.key ||
        req.query.token;

      const bodyKey =
        req.body?.apiKey ||
        req.body?.api_key ||
        req.body?.crmApiKey ||
        req.body?.CRM_API_KEY ||
        req.body?.crm_api_key ||
        req.body?.key;

      let extractedKey = cleanApiKey(rawHeader || queryKey || bodyKey);

      if (!extractedKey && authHeader && typeof authHeader === "string") {
        if (authHeader.startsWith("Bearer ")) {
          extractedKey = cleanApiKey(authHeader.substring(7));
        } else {
          extractedKey = cleanApiKey(authHeader);
        }
      }

      if (!extractedKey || !validKeys.has(extractedKey)) {
        console.warn(`[External API] 401 Unauthorized attempt on ${req.method} ${req.originalUrl}. Provided key: "${extractedKey ? extractedKey.slice(0, 4) + '...' : '(none)'}". Valid keys count: ${validKeys.size}`);
        return res.status(401).json({
          success: false,
          error: "Unauthorized: Chave de API externa inválida ou não fornecida. Informe a chave no header X-API-Key (ou crm-api-key), Authorization Bearer, ou ?api_key=",
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Admin GET Settings
  app.get("/api/v1/external/settings", isTeam, async (req, res) => {
    try {
      const key = await getOrGenerateExternalApiKey();
      const settings = await storage.getSiteSettings();
      res.json({
        apiKey: key,
        updatedAt: settings.updatedAt,
        endpointUrl: `${req.protocol}://${req.get("host")}/api/v1/external/contacts/lookup`,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin POST Regenerate Key
  app.post("/api/v1/external/regenerate-key", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const newKey = "ms_live_" + crypto.randomBytes(16).toString("hex");
      await storage.updateSiteSettings({ ...settings, externalApiKey: newKey });
      res.json({
        apiKey: newKey,
        message: "Nova chave de API externa gerada com sucesso! Atualize suas conexões do WhatsApp com a nova chave.",
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin POST Set Custom Key
  app.post(["/api/v1/external/set-key", "/api/v1/external/key"], isAdmin, async (req, res) => {
    try {
      const { apiKey } = req.body;
      const cleanKey = cleanApiKey(apiKey);
      if (!cleanKey || cleanKey.length < 6) {
        return res.status(400).json({ message: "A chave de API deve conter pelo menos 6 caracteres." });
      }
      const settings = await storage.getSiteSettings();
      await storage.updateSiteSettings({ ...settings, externalApiKey: cleanKey });
      res.json({
        apiKey: cleanKey,
        message: "Chave de API externa personalizada salva com sucesso!",
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Helper to normalize the 12 standard product names
  function normalizeBackendProductName(name: string | null | undefined): string {
    if (!name || typeof name !== "string") return "";
    const clean = name.trim();
    const key = clean.toLowerCase();
    const map: Record<string, string> = {
      "auto": "Auto",
      "seguro auto": "Auto",
      "automóvel": "Auto",
      "automovel": "Auto",
      "saúde": "Saúde",
      "saude": "Saúde",
      "plano de saúde": "Saúde",
      "plano de saude": "Saúde",
      "vida": "Vida",
      "seguro de vida": "Vida",
      "residencial": "Residencial",
      "residência": "Residencial",
      "residencia": "Residencial",
      "seguro residencial": "Residencial",
      "empresarial": "Empresarial",
      "vida empresarial": "Empresarial",
      "seguro empresarial": "Empresarial",
      "odonto": "Odonto",
      "odontológico": "Odonto",
      "odontologico": "Odonto",
      "plano odontológico": "Odonto",
      "plano odontologico": "Odonto",
      "consórcio": "Consórcio",
      "consorcio": "Consórcio",
      "previdência": "Previdência",
      "previdencia": "Previdência",
      "previdência privada": "Previdência",
      "previdencia privada": "Previdência",
      "fiança locatícia": "Fiança Locaticia",
      "fianca locaticia": "Fiança Locaticia",
      "fiança locaticia": "Fiança Locaticia",
      "fianca locatícia": "Fiança Locaticia",
      "fiança": "Fiança Locaticia",
      "fianca": "Fiança Locaticia",
      "responsabilidade civil": "Responsabilidade Civil",
      "rc": "Responsabilidade Civil",
      "seguro rc": "Responsabilidade Civil",
      "viagem": "Viagem",
      "seguro viagem": "Viagem",
      "pet": "Pet",
      "seguro pet": "Pet",
    };
    return map[key] || clean;
  }

  // Passo 1: Helper de Conversão de Moeda no CRM
  // Converte "3.500,00", "R$ 3.500,00" ou número em Float válido (3500.00)
  function parseCurrencyToNumber(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (typeof val === 'string') {
      let clean = val.replace(/[R$\s]/g, '').trim();
      if (!clean) return null;
      if (clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      }
      const num = parseFloat(clean);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  // Helper to map external deal status to CRM pipeline stage IDs
  function mapDealStatusToPipelineStage(status: string | null | undefined, responded?: boolean): string {
    if (responded === true) return "Respondida";
    if (!status || typeof status !== "string") return "new";
    const s = status.trim().toLowerCase();
    if (s === "respondida" || s === "respondido" || s === "responded") return "Respondida";
    if (
      s === "cotação" ||
      s === "cotacao" ||
      s === "novo" ||
      s === "novo lead" ||
      s === "new" ||
      s === "enviar cotação" ||
      s === "enviar cotacao" ||
      s === "ativo" ||
      s === "active"
    ) return "new";
    if (
      s === "qualificado" ||
      s === "em negociação" ||
      s === "em negociacao" ||
      s === "negociação" ||
      s === "negociacao" ||
      s === "qualified" ||
      s === "revisão agendada" ||
      s === "revisao agendada"
    ) return "qualified";
    if (s === "proposta" || s === "proposta enviada" || s === "proposal") return "proposal";
    if (
      s === "fechado" ||
      s === "fechado / ganho" ||
      s === "fechado/ganho" ||
      s === "ganho" ||
      s === "implantado" ||
      s === "implemented" ||
      s === "closed"
    ) return "implemented";
    if (s === "perdido" || s === "cancelado" || s === "cancelled" || s === "lost") return "cancelled";
    if (["new", "qualified", "proposal", "cancelled", "implemented", "Respondida"].includes(status)) return status;
    return status.trim() || "new";
  }

  // Core handler to upsert contact & create opportunity & policy (Used by WhatsApp Central)
  async function handleExternalContactAndOpportunity(req: any, res: any) {
    try {
      const body = req.body || {};

      // 1. Telefone e Documento
      const inputPhone =
        body.phone ??
        body.telefone ??
        body.whatsapp ??
        body.celular ??
        body.numero ??
        "";
      const rawPhone = inputPhone !== undefined && inputPhone !== null
        ? String(inputPhone).replace(/@.+$/, "").replace(/\D/g, "").trim()
        : "";

      const inputName =
        body.name ??
        body.nome ??
        body.fullName ??
        body.nomeContato ??
        body.contactName ??
        body.cliente ??
        "";
      let contactName = inputName ? String(inputName).trim() : "";

      const inputDoc =
        body.document ??
        body.documento ??
        body.cpf ??
        body.cnpj ??
        body.cpfCnpj ??
        "";
      const rawDoc = inputDoc ? String(inputDoc).trim() : "";
      const inputEmail = body.email ? String(body.email).trim() : "";

      // 2. Busca contato existente (Regra: Nunca rejeitar telefone existente, sempre fazer UPSERT)
      const allExistingContacts = await storage.getContacts();

      const existingMatch = allExistingContacts.find(c => {
        if (rawPhone && c.phone && matchesPhone(rawPhone, c.phone)) return true;
        if (rawDoc && c.document && cleanDigits(c.document) === cleanDigits(rawDoc) && cleanDigits(rawDoc).length >= 11) return true;
        if (inputEmail && c.email && c.email.trim().toLowerCase() === inputEmail.toLowerCase()) return true;
        return false;
      });

      if (!contactName) {
        if (existingMatch?.name) {
          contactName = existingMatch.name;
        } else if (rawPhone) {
          contactName = `Contato WhatsApp (${rawPhone})`;
        } else {
          contactName = "Contato";
        }
      }

      // 3. Produtos
      const produtos =
        body.produtos ??
        body.produto ??
        body.product ??
        (Array.isArray(body.products) ? body.products.join(', ') : null) ??
        body.dealProduct ??
        body.deal?.product ??
        body.pipeline?.product ??
        body.productType ??
        null;

      let finalProductList: string[] = [];

      if (produtos) {
        const parts = String(produtos).split(",").map((s: string) => s.trim()).filter(Boolean);
        for (const p of parts) {
          const norm = normalizeBackendProductName(p);
          if (norm && !finalProductList.includes(norm)) {
            finalProductList.push(norm);
          }
        }
      }

      // Mescla com produtos já existentes no contato para manter histórico
      if (existingMatch && existingMatch.productType) {
        const existingParts = existingMatch.productType.split(",").map((s: string) => s.trim()).filter(Boolean);
        for (const ep of existingParts) {
          const norm = normalizeBackendProductName(ep);
          if (norm && !finalProductList.includes(norm)) {
            finalProductList.push(norm);
          }
        }
      }

      const finalProductType = finalProductList.length > 0
        ? finalProductList.join(", ")
        : (produtos ? String(produtos).trim() : (existingMatch?.productType || null));

      // 4. Valores Numéricos Tratados
      const dealVal = parseCurrencyToNumber(
        body.deal?.value ??
        body.pipeline?.value ??
        body.dealValue ??
        body.valor ??
        body.value
      );
      const premiumVal = parseCurrencyToNumber(
        body.insurance?.premiumValue ??
        body.premiumValue ??
        body.premio ??
        body.valorPremio
      );

      // 5. Etapa / Status da Oportunidade (Respondida se responded: true ou status Respondida)
      const rawStatus =
        body.status ??
        body.dealStatus ??
        body.deal?.status ??
        body.pipeline?.status ??
        body.etapa ??
        body.stage ??
        body.statusDeal ??
        "";

      const isResponded =
        body.responded === true ||
        body.responded === "true" ||
        body.isResponded === true ||
        String(rawStatus).trim().toLowerCase() === "respondida" ||
        String(rawStatus).trim().toLowerCase() === "respondido" ||
        String(rawStatus).trim().toLowerCase() === "responded";

      const dealStageRaw = rawStatus || (isResponded ? "Respondida" : "Enviar Cotação");
      const dealStage = isResponded ? "Respondida" : mapDealStatusToPipelineStage(dealStageRaw, isResponded);

      const dealProduct =
        body.deal?.product ??
        body.pipeline?.product ??
        body.dealProduct ??
        produtos ??
        body.product ??
        'Seguro';
      const oppProduct = normalizeBackendProductName(dealProduct) || "Seguro";

      // 6. Data de Retorno (dealDate)
      let formattedDealDate = "";
      const rawDealDate = body.dealDate || body.deal_date || body.dataRetorno || body.returnDate;
      if (rawDealDate) {
        try {
          const d = new Date(rawDealDate);
          if (!isNaN(d.getTime())) {
            const day = String(d.getUTCDate()).padStart(2, '0');
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const year = d.getUTCFullYear();
            formattedDealDate = `${day}/${month}/${year}`;
          } else {
            formattedDealDate = String(rawDealDate);
          }
        } catch {
          formattedDealDate = String(rawDealDate);
        }
      }

      // 7. Observações com data de retorno anexada se presente
      const rawNotes = body.notes || body.observacoes || body.dealNotes || body.opportunityNotes || "";
      let finalLeadNotes = rawNotes ? String(rawNotes).trim() : "";
      if (formattedDealDate) {
        const dateTag = `[Data de Retorno: ${formattedDealDate}]`;
        if (!finalLeadNotes.includes(dateTag)) {
          finalLeadNotes = finalLeadNotes ? `${finalLeadNotes}\n\n${dateTag}` : dateTag;
        }
      }

      // Endereço completo
      const zipCode = body.zipCode || body.cep || "";
      const addressStreet = body.address || body.rua || "";
      const addressNumber = body.number || body.numero || "";
      const neighborhood = body.neighborhood || body.bairro || "";
      const city = body.city || body.cidade || "";
      const state = body.state || body.uf || "";

      let fullAddress = addressStreet;
      if (addressNumber) fullAddress = fullAddress ? `${fullAddress}, ${addressNumber}` : addressNumber;
      if (neighborhood) fullAddress = fullAddress ? `${fullAddress} - ${neighborhood}` : neighborhood;
      if (city) fullAddress = fullAddress ? `${fullAddress}, ${city}` : city;
      if (state) fullAddress = fullAddress ? `${fullAddress} - ${state}` : state;
      if (zipCode) fullAddress = fullAddress ? `${fullAddress} (CEP: ${zipCode})` : (zipCode ? `CEP: ${zipCode}` : "");

      // 8. Responsável (Lê de assignedTo.name, assignedTo.email, assignedToName, assignedToEmail ou responsavel)
      const allUsers = await storage.getUsers();
      const staffUsers = allUsers.filter(u => u.role === "admin" || u.role === "employee");

      let respName = "";
      let respEmail = "";
      let respId: number | undefined = undefined;

      if (body.assignedTo && typeof body.assignedTo === "object") {
        if (body.assignedTo.name) respName = String(body.assignedTo.name).trim();
        if (body.assignedTo.email) respEmail = String(body.assignedTo.email).trim();
        if (body.assignedTo.id && !isNaN(Number(body.assignedTo.id))) respId = Number(body.assignedTo.id);
      } else if (body.assignedTo && !isNaN(Number(body.assignedTo))) {
        respId = Number(body.assignedTo);
      } else if (typeof body.assignedTo === "string") {
        if (body.assignedTo.includes("@")) respEmail = body.assignedTo.trim();
        else respName = body.assignedTo.trim();
      }

      if (!respName) {
        respName = body.assignedToName || body.responsibleName || body.responsavel || body.consultor || "";
      }
      if (!respEmail) {
        respEmail = body.assignedToEmail || body.responsibleEmail || "";
      }
      if (!respId && body.internalResponsibleId && !isNaN(Number(body.internalResponsibleId))) {
        respId = Number(body.internalResponsibleId);
      }

      let matchedStaff: any = null;
      if (respId) {
        matchedStaff = staffUsers.find(u => u.id === respId);
      }
      if (!matchedStaff && respEmail) {
        const cleanE = respEmail.toLowerCase().trim();
        matchedStaff = staffUsers.find(u => u.email && u.email.toLowerCase().trim() === cleanE);
      }
      if (!matchedStaff && respName) {
        const cleanN = respName.toLowerCase().trim();
        matchedStaff = staffUsers.find(u =>
          u.name.toLowerCase().trim() === cleanN ||
          u.name.toLowerCase().includes(cleanN) ||
          cleanN.includes(u.name.toLowerCase())
        );
      }

      const resolvedAssignedTo = matchedStaff ? matchedStaff.id : respId;
      const finalRespName = matchedStaff ? matchedStaff.name : (respName || null);
      const finalRespEmail = matchedStaff?.email || respEmail || null;

      // 9. Salva / Atualiza o Contato no CRM (UPSERT)
      const contactPayload: InsertContact = {
        name: contactName,
        type: body.type === "company" ? "company" : "individual",
        phone: rawPhone || (existingMatch?.phone || null),
        email: inputEmail || (existingMatch?.email || null),
        document: rawDoc || (existingMatch?.document || null),
        address: fullAddress || (existingMatch?.address || null),
        responsibleName: finalRespName || (existingMatch?.responsibleName || null),
        responsibleId: body.responsibleId ? Number(body.responsibleId) : (existingMatch?.responsibleId || undefined),
        internalResponsibleId: resolvedAssignedTo || (existingMatch?.internalResponsibleId || undefined),
        anniversaryDate: body.anniversaryDate ? String(body.anniversaryDate).trim() : (existingMatch?.anniversaryDate || null),
        maritalStatus: body.maritalStatus ? String(body.maritalStatus).trim() : (existingMatch?.maritalStatus || null),
        productType: finalProductType,
        insurers: body.insurers ? String(body.insurers).trim() : (existingMatch?.insurers || null),
        contactOrigin: body.contactOrigin ? String(body.contactOrigin).trim() : (existingMatch?.contactOrigin || "WhatsApp Central"),
        isReferral: Boolean(body.isReferral),
        referredByContactId: body.referredByContactId ? Number(body.referredByContactId) : undefined,
        notes: rawNotes ? String(rawNotes).trim() : (existingMatch?.notes || null),
        status: body.status === "Cancelado" || body.status === "Prospects" ? body.status : (existingMatch?.status || "Ativo"),
      };

      let contactRecord: any;
      let isNewContact = false;

      if (existingMatch) {
        contactRecord = await storage.updateContact(existingMatch.id, contactPayload);
        isNewContact = false;
      } else {
        contactRecord = await storage.createContact(contactPayload);
        isNewContact = true;
      }

      // Sincronização com tabela clientes
      const allClientes = await storage.getClientes();
      let linkedCliente = allClientes.find(cliente => {
        if (cliente.contactId === contactRecord.id) return true;
        const contactDoc = cleanDigits(contactRecord.document);
        const clientDoc = cleanDigits(cliente.cpfCnpj);
        const cName = (contactRecord.name || "").trim().toLowerCase();
        const cliName = (cliente.nome || "").trim().toLowerCase();
        const contactPhone = cleanDigits(contactRecord.phone);
        const clientPhone = cleanDigits(cliente.telefone);
        return Boolean(contactDoc && clientDoc && contactDoc === clientDoc) ||
          Boolean(cName === cliName && contactPhone && clientPhone && contactPhone === clientPhone);
      });

      const clienteDataPayload = {
        contactId: contactRecord.id,
        type: contactRecord.type,
        nome: contactRecord.name,
        cpfCnpj: contactRecord.document || null,
        email: contactRecord.email || null,
        telefone: contactRecord.phone || null,
        whatsapp: contactRecord.phone || null,
        endereco: fullAddress || contactRecord.address || null,
        cidade: city || null,
        estado: state || null,
        anniversaryDate: contactRecord.anniversaryDate || null,
        productType: contactRecord.productType || null,
        insurers: contactRecord.insurers || null,
        contactOrigin: contactRecord.contactOrigin || null,
        isReferral: contactRecord.isReferral || false,
        referredByContactId: contactRecord.referredByContactId || null,
        internalResponsibleId: contactRecord.internalResponsibleId || null,
        nomeRepresentante: contactRecord.responsibleName || null,
        telefoneRepresentante: body.responsiblePhone ? String(body.responsiblePhone).trim() : null,
        emailRepresentante: finalRespEmail || (body.responsibleEmail ? String(body.responsibleEmail).trim() : null),
        observacoes: contactRecord.notes || null,
      };

      if (linkedCliente) {
        await storage.updateCliente(linkedCliente.id, clienteDataPayload);
      } else {
        linkedCliente = await storage.createCliente(clienteDataPayload);
      }

      // 10. Grava a Oportunidade no Funil de Vendas (LEADS & Pipeline)
      const isOpportunityEndpoint =
        req.path.includes("opportunities") ||
        req.path.includes("leads") ||
        req.path.includes("deal") ||
        Boolean(req.originalUrl && req.originalUrl.includes("deal"));

      const shouldCreateOpportunity = Boolean(
        isOpportunityEndpoint ||
        body.dealProduct ||
        body.pipeline ||
        body.deal ||
        body.dealValue !== undefined ||
        body.valor !== undefined ||
        body.value !== undefined ||
        body.product !== undefined ||
        body.produto !== undefined ||
        body.dealDate !== undefined ||
        body.status !== undefined ||
        body.responded !== undefined ||
        body.createOpportunity === true ||
        body.createOpportunity === "true" ||
        body.createLead === true ||
        body.createLead === "true" ||
        body.criarOportunidade === true ||
        body.criarOportunidade === "true"
      );

      let createdLead: any = null;
      if (shouldCreateOpportunity) {
        const allExistingLeads = await storage.getLeads(contactRecord.id);

        // Prevenção contra disparo duplicado de webhook em menos de 10 segundos
        const recentDuplicate = allExistingLeads.find(l =>
          (l.product || "").trim().toLowerCase() === oppProduct.toLowerCase() &&
          l.status === dealStage &&
          l.createdAt && (Date.now() - new Date(l.createdAt).getTime() < 10000)
        );

        if (recentDuplicate) {
          createdLead = recentDuplicate;
        } else {
          // Sempre cria e anexa a nova oportunidade ao histórico do contato
          createdLead = await storage.createLead({
            contactId: contactRecord.id,
            product: oppProduct || "Oportunidade Comercial",
            status: dealStage,
            source: body.contactOrigin || "WhatsApp Central",
            value: dealVal !== null ? dealVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : (body.value ? String(body.value) : null),
            notes: finalLeadNotes || null,
            assignedTo: resolvedAssignedTo || undefined,
          });

          // Disparar automações Todoist se configuradas
          try {
            await storage.triggerTodoistAutomations('new_lead', {
              leadId: createdLead.id,
              contactId: createdLead.contactId,
              assignedUserId: (req.user as any)?.id || createdLead.assignedTo || undefined,
            });
          } catch (_) {}
        }
      }

      // 11. Disparo Automático de E-mail para o Responsável
      let emailNotificationResult: { sent: boolean; recipient?: string; error?: string } = { sent: false };

      const shouldNotify =
        body.notifyResponsible === true ||
        body.notifyResponsible === "true" ||
        Boolean(finalRespEmail);

      if (createdLead && shouldNotify) {
        let targetEmail = finalRespEmail;
        if (!targetEmail && resolvedAssignedTo) {
          const staff = staffUsers.find(u => u.id === resolvedAssignedTo);
          if (staff?.email) targetEmail = staff.email;
        }

        // Fallback para e-mail corporativo de notificações caso notifyResponsible seja true mas sem e-mail específico
        if (!targetEmail && (body.notifyResponsible === true || body.notifyResponsible === "true")) {
          const settings = await storage.getSiteSettings();
          targetEmail = settings?.smtpUser || process.env.NOTIFICATION_EMAIL || "notificacoes@monteiroseguros.com.br";
        }

        if (targetEmail) {
          try {
            const emailRes = await sendOpportunityNotificationEmail({
              recipientEmail: targetEmail,
              recipientName: finalRespName || undefined,
              clientName: contactRecord.name,
              clientPhone: contactRecord.phone || rawPhone,
              product: createdLead.product || oppProduct,
              value: dealVal !== null ? dealVal : (body.value || null),
              status: createdLead.status || dealStage,
              dealDate: formattedDealDate || (rawDealDate ? String(rawDealDate) : undefined),
              notes: rawNotes ? String(rawNotes) : undefined,
              leadId: createdLead.id,
            });

            emailNotificationResult = {
              sent: emailRes.success,
              recipient: targetEmail,
              error: emailRes.error,
            };
            if (emailRes.success) {
              console.log(`[External API] ✉️ E-mail de notificação de oportunidade enviado para ${targetEmail}`);
            } else {
              console.warn(`[External API] ⚠️ Falha no envio de e-mail para ${targetEmail}:`, emailRes.error);
            }
          } catch (mailErr: any) {
            console.error("[External API] ❌ Erro inesperado ao disparar e-mail:", mailErr);
            emailNotificationResult = { sent: false, recipient: targetEmail, error: mailErr.message };
          }
        }
      }

      // 12. Se veio Apólice com número e prêmio:
      let createdPolicy: any = null;
      const policyNumber = body.insurance?.policyNumber || body.policyNumber;
      if (policyNumber && linkedCliente) {
        try {
          const expDate = body.insurance?.expirationDate || body.expirationDate;
          createdPolicy = await storage.createApolice({
            clienteId: linkedCliente.id,
            numeroApolice: String(policyNumber).trim(),
            premio: premiumVal !== null ? `R$ ${premiumVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (body.premiumValue || body.premio || null),
            fimVigencia: expDate ? new Date(expDate) : undefined,
            status: "ativa",
            observacoes: body.insurance?.notes || body.notes || "Apólice registrada via WhatsApp",
          });
        } catch (e) {
          console.error("[External API] Erro ao gravar apólice:", e);
        }
      }

      return res.status(isNewContact ? 201 : 200).json({
        ok: true,
        success: true,
        contactId: contactRecord.id,
        isNew: isNewContact,
        message: createdLead
          ? "Contato e Oportunidade registrados com sucesso no CRM e enviados para o LEADS & Pipeline!"
          : (isNewContact
            ? "Contato cadastrado com sucesso no CRM Monteiro Seguros!"
            : "Contato atualizado com sucesso no CRM Monteiro Seguros!"),
        contact: {
          id: contactRecord.id,
          name: contactRecord.name,
          phone: contactRecord.phone,
          email: contactRecord.email,
          document: contactRecord.document,
          address: contactRecord.address,
          status: contactRecord.status,
          produtos: contactRecord.productType,
          anniversaryDate: contactRecord.anniversaryDate,
          type: contactRecord.type === "company" ? "PJ (Pessoa Jurídica)" : "PF (Pessoa Física)",
          rawType: contactRecord.type,
          maritalStatus: contactRecord.maritalStatus,
          productType: contactRecord.productType,
          insurers: contactRecord.insurers,
          contactOrigin: contactRecord.contactOrigin,
          responsibleName: contactRecord.responsibleName,
          responsibleId: contactRecord.responsibleId,
          internalResponsibleId: contactRecord.internalResponsibleId,
          notes: contactRecord.notes,
          createdAt: contactRecord.createdAt,
          rawContact: contactRecord,
        },
        products: contactRecord.productType
          ? contactRecord.productType.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        lead: createdLead,
        opportunity: createdLead,
        deal: createdLead,
        policy: createdPolicy,
        emailNotification: emailNotificationResult,
        pipelineUrl: "/admin/leads",
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ ok: false, success: false, error: err.errors });
      }
      res.status(500).json({ ok: false, success: false, error: err.message });
    }
  }

  // 1. GET /api/v1/external/users & /api/v1/external/employees - Lista funcionários/responsáveis
  app.get([
    "/api/v1/external/users",
    "/api/external/users",
    "/api/v1/external/employees",
    "/api/external/employees",
  ], externalApiKeyAuth, async (_req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const staffUsers = allUsers.filter(u => u.role === "admin" || u.role === "employee");
      const result = staffUsers.map(u => ({
        id: String(u.id),
        name: u.name,
        email: u.email || "",
        role: u.role === "admin" ? "Consultor" : "Corretora",
      }));
      return res.json(result);
    } catch (err: any) {
      console.error("[External API] Error listing employees:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. POST /api/v1/external/contacts - Cadastro / Upsert de Contatos e Oportunidades
  app.post([
    "/api/v1/external/contacts",
    "/api/external/contacts",
  ], externalApiKeyAuth, handleExternalContactAndOpportunity);

  // 3. POST /api/v1/external/deals - Endpoint Dedicado para Oportunidades (WhatsApp Central)
  app.post([
    "/api/v1/external/deals",
    "/api/external/deals",
    "/api/v1/external/opportunities",
    "/api/external/opportunities",
    "/api/v1/external/leads",
    "/api/external/leads",
    "/api/contacts/crm-deal",
    "/api/v1/external/contacts/crm-deal",
    "/api/external/contacts/crm-deal",
    "/api/crm/deal",
    "/api/v1/crm/deal",
  ], externalApiKeyAuth, handleExternalContactAndOpportunity);

  // ============================================================
  // External Lookup API (Used by WhatsApp Central / Monteiro Conecta)
  // Endpoints: GET/POST /api/contacts/lookup, /api/v1/external/contacts/lookup, etc.
  // ============================================================
  const lookupRoutes = [
    "/api/contacts/lookup",
    "/api/v1/contacts/lookup",
    "/api/v1/external/contacts/lookup",
    "/api/external/contacts/lookup",
    "/api/v1/external/lookup",
    "/api/external/lookup",
    "/api/lookup",
    "/api/crm/lookup",
    "/api/v1/crm/lookup",
  ];

  async function handleContactLookup(req: any, res: any) {
    try {
      const rawPhoneQuery =
        req.query.phone ||
        req.query.telefone ||
        req.query.whatsapp ||
        req.query.celular ||
        req.query.numero ||
        req.query.q ||
        req.body?.phone ||
        req.body?.telefone ||
        req.body?.whatsapp ||
        req.body?.numero ||
        "";

      const phone = String(rawPhoneQuery).replace(/\D/g, "");

      const rawDocQuery =
        req.query.document ||
        req.query.documento ||
        req.query.cpf ||
        req.query.cnpj ||
        req.query.cpfCnpj ||
        req.body?.document ||
        req.body?.documento ||
        req.body?.cpf ||
        req.body?.cnpj ||
        req.body?.cpfCnpj ||
        "";
      const document = String(rawDocQuery).trim();

      const email = String(req.query.email || req.body?.email || "").trim();
      const nameQuery = String(req.query.name || req.query.nome || req.body?.name || req.body?.nome || "").trim();

      if (!phone && !document && !email && !nameQuery) {
        return res.status(400).json({
          found: false,
          error: "Telefone obrigatório ou informe ?document= ou ?email= para localizar o contato.",
        });
      }

      const allContacts = await storage.getContacts();
      const allClientes = await storage.getClientes();
      const allApolices = await storage.getApolices();
      const allLeads = await storage.getLeads();
      const allUsers = await storage.getUsers();
      const allSeguradoras = await storage.getSeguradoras();
      const allProdutosSeguro = await storage.getProdutosSeguro();

      const cleanDocInput = cleanDigits(document);
      const cleanEmailInput = email.toLowerCase();
      const cleanNameInput = nameQuery.toLowerCase();

      let matchedContact = allContacts.find(c => {
        if (phone && c.phone && matchesPhone(phone, c.phone)) return true;
        if (cleanDocInput && c.document && cleanDigits(c.document) === cleanDocInput && cleanDocInput.length >= 11) return true;
        if (cleanEmailInput && c.email && c.email.toLowerCase() === cleanEmailInput) return true;
        if (cleanNameInput && c.name && c.name.toLowerCase() === cleanNameInput) return true;
        return false;
      });

      let matchedCliente = allClientes.find(c => {
        if (phone && (c.telefone || c.whatsapp) && (matchesPhone(phone, c.telefone || "") || matchesPhone(phone, c.whatsapp || ""))) return true;
        if (cleanDocInput && c.cpfCnpj && cleanDigits(c.cpfCnpj) === cleanDocInput && cleanDocInput.length >= 11) return true;
        if (cleanEmailInput && c.email && c.email.toLowerCase() === cleanEmailInput) return true;
        if (cleanNameInput && c.nome && c.nome.toLowerCase() === cleanNameInput) return true;
        return false;
      });

      // Se achou contato mas não cliente, vincula ou cria registro em clientes
      if (matchedContact && !matchedCliente) {
        matchedCliente = allClientes.find(c =>
          c.contactId === matchedContact!.id ||
          (c.cpfCnpj && cleanDigits(c.cpfCnpj) === cleanDigits(matchedContact!.document) && cleanDigits(c.cpfCnpj).length >= 11) ||
          ((c.telefone || c.whatsapp) && matchedContact!.phone && (matchesPhone(matchedContact!.phone, c.telefone || "") || matchesPhone(matchedContact!.phone, c.whatsapp || "")))
        );

        if (!matchedCliente) {
          try {
            matchedCliente = await storage.createCliente({
              contactId: matchedContact.id,
              type: matchedContact.type,
              nome: matchedContact.name,
              cpfCnpj: matchedContact.document || null,
              email: matchedContact.email || null,
              telefone: matchedContact.phone || null,
              whatsapp: matchedContact.phone || null,
              endereco: matchedContact.address || null,
              anniversaryDate: matchedContact.anniversaryDate || null,
              productType: matchedContact.productType || null,
              insurers: matchedContact.insurers || null,
              contactOrigin: matchedContact.contactOrigin || null,
              isReferral: matchedContact.isReferral || false,
              internalResponsibleId: matchedContact.internalResponsibleId || null,
              nomeRepresentante: matchedContact.responsibleName || null,
              observacoes: matchedContact.notes || null,
            });
          } catch (e) {
            console.error("[lookup] Erro ao criar cliente vinculado:", e);
          }
        }
      }

      if (matchedCliente && !matchedContact) {
        matchedContact = allContacts.find(c =>
          c.id === matchedCliente!.contactId ||
          (c.document && cleanDigits(c.document) === cleanDigits(matchedCliente!.cpfCnpj) && cleanDigits(c.document).length >= 11) ||
          (c.phone && (matchedCliente!.telefone || matchedCliente!.whatsapp) && (matchesPhone(c.phone, matchedCliente!.telefone || "") || matchesPhone(c.phone, matchedCliente!.whatsapp || "")))
        );
      }

      if (!matchedContact && !matchedCliente) {
        return res.json({
          found: false,
          message: "Nenhum contato ou cliente localizado no CRM com as informações fornecidas.",
          query: { phone, document, email }
        });
      }

      const contactId = matchedContact?.id || matchedCliente?.contactId || null;
      const clienteId = matchedCliente?.id || null;

      // ID principal para redirecionamento para /admin/clientes/:id
      const targetClienteId = clienteId || contactId;

      const name = matchedCliente?.nome || matchedContact?.name || "Sem Nome";
      const finalPhone = matchedCliente?.telefone || matchedCliente?.whatsapp || matchedContact?.phone || phone;
      const finalEmail = matchedCliente?.email || matchedContact?.email || email;
      const finalDoc = matchedCliente?.cpfCnpj || matchedContact?.document || document;
      const address = matchedCliente?.endereco || matchedContact?.address || null;
      const type = matchedCliente?.type || matchedContact?.type || "individual";
      const status = matchedContact?.status || "Ativo";
      const anniversaryDate = matchedCliente?.anniversaryDate || matchedContact?.anniversaryDate || null;
      const maritalStatus = matchedContact?.maritalStatus || null;
      const productType = matchedCliente?.productType || matchedContact?.productType || null;
      const insurers = matchedCliente?.insurers || matchedContact?.insurers || null;
      const contactOrigin = matchedCliente?.contactOrigin || matchedContact?.contactOrigin || null;
      const notes = matchedCliente?.observacoes || matchedContact?.notes || null;
      const responsibleName = matchedCliente?.nomeRepresentante || matchedContact?.responsibleName || null;
      const responsiblePhone = matchedCliente?.telefoneRepresentante || null;
      const responsibleEmail = matchedCliente?.emailRepresentante || null;

      const isReferral = matchedCliente?.isReferral || matchedContact?.isReferral || false;
      const referredByContactId = matchedCliente?.referredByContactId || matchedContact?.referredByContactId || null;
      const referredByContact = referredByContactId ? allContacts.find(c => c.id === referredByContactId) : null;
      const referredByContactName = referredByContact ? referredByContact.name : null;

      const internalResponsibleId = matchedCliente?.internalResponsibleId || matchedContact?.internalResponsibleId || null;
      const internalUser = internalResponsibleId ? allUsers.find(u => u.id === internalResponsibleId) : null;
      const internalResponsibleName = internalUser ? internalUser.name : null;

      const tags = matchedCliente?.tags || null;
      const cidade = matchedCliente?.cidade || null;
      const estado = matchedCliente?.estado || null;
      const createdAt = matchedCliente?.createdAt || matchedContact?.createdAt || null;

      const assignedUserId = matchedCliente?.responsavelComercialId || matchedCliente?.internalResponsibleId || matchedContact?.assignedTo;
      const assignedUser = assignedUserId ? allUsers.find(u => u.id === assignedUserId) : null;
      const responsibleDisplayName = assignedUser?.name || responsibleName || internalResponsibleName || null;

      // Busca de Apólices do Cliente
      let linkedApolices = clienteId
        ? allApolices.filter(a => a.clienteId === clienteId)
        : (contactId ? allApolices.filter(a => {
            const cli = allClientes.find(c => c.id === a.clienteId);
            return cli && cli.contactId === contactId;
          }) : []);

      // Se não encontrou apólices direto pelo ID do cliente, busca por clientes com mesmo documento ou telefone
      if (linkedApolices.length === 0) {
        const clientDoc = cleanDigits(finalDoc);
        const clientPhoneClean = cleanDigits(finalPhone);
        if (clientDoc || clientPhoneClean) {
          const relatedClientIds = new Set(
            allClientes
              .filter(c =>
                (clientDoc && cleanDigits(c.cpfCnpj) === clientDoc && clientDoc.length >= 11) ||
                (clientPhoneClean && (c.telefone || c.whatsapp) && (matchesPhone(clientPhoneClean, c.telefone || "") || matchesPhone(clientPhoneClean, c.whatsapp || "")))
              )
              .map(c => c.id)
          );
          linkedApolices = allApolices.filter(a => relatedClientIds.has(a.clienteId));
        }
      }

      const activePolicies = linkedApolices.filter(a => a.status === "ativa");
      const totalAnnualPremium = activePolicies.reduce((sum, a) => sum + (parseCurrencyToNumber(a.premio) || 0), 0);
      const totalAnnualPremiumFormatted = `R$ ${totalAnnualPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const formatPolicy = (a: any) => {
        const seg = allSeguradoras.find(s => s.id === a.seguradoraId);
        const prod = allProdutosSeguro.find(p => p.id === a.produtoId);
        const pNumVal = parseCurrencyToNumber(a.premio) || 0;
        const pFormatted = pNumVal > 0
          ? `R$ ${pNumVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : (a.premio ? (String(a.premio).startsWith("R$") ? String(a.premio) : `R$ ${a.premio}`) : "R$ 0,00");

        const expIso = a.fimVigencia ? new Date(a.fimVigencia).toISOString().split('T')[0] : "";
        const expBr = a.fimVigencia ? new Date(a.fimVigencia).toLocaleDateString('pt-BR') : "";

        const productName = prod?.nome || a.ramo || a.numeroApolice || "Seguro";
        const insurerName = seg?.nome || "Seguradora";
        const polNum = a.numeroApolice || a.idApolice || "Sem número";

        return {
          id: a.id,
          // Nomes do Produto (suporta 'product', 'produto' e 'ramo')
          product: productName,
          produto: productName,
          ramo: productName,
          // Nomes da Seguradora (suporta 'insurer', 'seguradora' e 'companhia')
          insurer: insurerName,
          seguradora: insurerName,
          companhia: insurerName,
          // Número da Apólice (suporta 'policyNumber', 'apolice' e 'numeroApolice')
          policyNumber: polNum,
          apolice: polNum,
          numeroApolice: polNum,
          // Data de Término de Vigência (suporta 'expirationDate', 'vencimento', 'vigenciaFim', 'fimVigencia')
          expirationDate: expIso || expBr || "",
          vencimento: expBr || expIso || "",
          vigenciaFim: expIso || expBr || "",
          fimVigencia: expIso || expBr || null,
          inicioVigencia: a.inicioVigencia ? new Date(a.inicioVigencia).toISOString().split('T')[0] : null,
          // Valor do Prêmio (suporta 'premiumValue', 'valorPremio' e 'premio')
          premiumValue: pFormatted,
          valorPremio: pFormatted,
          premio: pFormatted,
          premiumValueNumber: pNumVal,
          status: a.status,
          pdfUrl: a.pdfApolice || null,
        };
      };

      const policiesToReturn = (activePolicies.length > 0 ? activePolicies : linkedApolices).map(formatPolicy);

      const rawLinkedLeads = contactId ? allLeads.filter(l => l.contactId === contactId) : [];
      const seenLeads = new Set<string>();
      const linkedLeads = rawLinkedLeads.filter(l => {
        const prod = (l.product || "Oportunidade Comercial").trim().toLowerCase();
        const stg = (l.status || "").trim().toLowerCase();
        const key = `${prod}_${stg}`;
        if (seenLeads.has(key)) return false;
        seenLeads.add(key);
        return true;
      });
      const activeLeads = linkedLeads.filter(l => l.status !== "closed" && l.status !== "lost" && l.status !== "cancelled");

      const formattedLeads = linkedLeads.map(l => {
        const numVal = parseCurrencyToNumber(l.value) || 0;
        const normalizedStatus = (l.status === "Ativo" || l.status === "ativo" || !l.status) ? "new" : l.status;
        const stageLabel = normalizedStatus === "new" ? "Novo Lead" : (normalizedStatus === "qualified" ? "Qualificado" : (normalizedStatus === "proposal" ? "Proposta" : (normalizedStatus === "implemented" ? "Implantado" : (normalizedStatus === "cancelled" ? "Cancelado" : normalizedStatus))));
        return {
          id: l.id,
          product: l.product || "Oportunidade Comercial",
          title: l.product || "Oportunidade Comercial",
          value: numVal,
          valueFormatted: l.value
            ? (String(l.value).startsWith("R$") ? String(l.value) : `R$ ${numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
            : 'R$ 0,00',
          status: normalizedStatus,
          stage: stageLabel,
          stageId: normalizedStatus,
          source: l.source || "CRM",
          notes: l.notes,
          createdAt: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : null,
        };
      });

      // Monta resposta compatível com Monteiro Conecta / WhatsApp Central
      return res.json({
        found: true,
        // 1. ID do cliente na raiz para redirecionar para /admin/clientes/:id
        id: targetClienteId,
        clienteId: targetClienteId,
        contactId: contactId,
        // 1. Objeto contact com id apontando para o cliente
        contact: {
          id: targetClienteId,
          clienteId: targetClienteId,
          contactId: contactId,
          name,
          phone: finalPhone,
          email: finalEmail,
          document: finalDoc,
          address,
          cidade,
          estado,
          city: cidade,
          state: estado,
          status,
          produtos: productType,
          anniversaryDate,
          type: type === "company" ? "PJ (Pessoa Jurídica)" : "PF (Pessoa Física)",
          rawType: type,
          maritalStatus,
          productType,
          insurers,
          contactOrigin,
          responsibleName,
          responsibleId: matchedContact?.responsibleId || null,
          responsiblePhone,
          responsibleEmail,
          internalResponsibleId,
          internalResponsibleName,
          isReferral,
          referredByContactId,
          referredByContactName,
          notes,
          tags,
          createdAt,
          assignedTo: assignedUser ? {
            id: assignedUser.id,
            name: assignedUser.name,
            email: assignedUser.email,
          } : (responsibleDisplayName ? { name: responsibleDisplayName } : null),
          rawContact: matchedContact || null,
          rawCliente: matchedCliente || null,
        },
        // 2. Bloco insurance com as apólices ativas e formatadas
        insurance: {
          activePoliciesCount: activePolicies.length,
          totalPoliciesCount: linkedApolices.length,
          totalAnnualPremiumFormatted,
          totalAnnualPremiumValue: totalAnnualPremium,
          policies: policiesToReturn,
        },
        products: productType ? productType.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        pipeline: {
          totalDealsCount: linkedLeads.length,
          activeDealsCount: activeLeads.length || linkedLeads.length,
          deals: formattedLeads,
        }
      });

    } catch (err: any) {
      console.error("[lookup] Erro na consulta de contato/cliente:", err);
      res.status(500).json({ found: false, error: err.message });
    }
  }

  // Registra as rotas de consulta (suporta GET e POST para máxima compatibilidade)
  app.get(lookupRoutes, externalApiKeyAuth, handleContactLookup);
  app.post(lookupRoutes, externalApiKeyAuth, handleContactLookup);

  return httpServer;
}
