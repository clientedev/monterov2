import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { api } from "@shared/routes";
import Groq from "groq-sdk";
import { z } from "zod";
import { setupAuth, hashPassword, isAuthenticated } from "./auth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  insertInquirySchema,
  insertContactSchema,
  insertLeadSchema,
  insertTaskSchema,
  insertCampaignSchema,
  insertUserSchema,
  insertPostSchema,
  insertServiceSchema,
  insertHeroSlideSchema,
  insertProspectingChecklistSchema,
  insertCommentSchema,
  insertInteractionSchema,
  insertSiteSettingsSchema,
  insertReviewSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // AI Chat Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid messages format" });
      }

      // Initialize Groq only if key exists
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "GROQ_API_KEY não configurada no ambiente." });
      }

      const groq = new Groq({ apiKey });

      const stream = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Você é a Carol, especialista da Monteiro Corretora (focada em planos de saúde e seguros de vida corporativos e familiares). Seja extremamente profissional, educada, amigável e MUITO concisa. Resolva dúvidas rapidamente."
          },
          ...messages
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 512,
        stream: true,
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) res.write(text);
      }

      res.end();
    } catch (error: any) {
      console.error("Groq Chat Error:", error);
      res.status(500).json({ message: error.message || "Internal server error connecting to AI" });
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

  // SEO / Blog Social Previews
  app.get("/blog/:slug", async (req, res, next) => {
    try {
      const slug = req.params.slug;
      const post = await storage.getPostBySlug(slug);

      if (!post) {
        return next(); // Fall through to 404 handled by frontend
      }

      // Read index.html
      const indexPath = process.env.NODE_ENV === "production"
        ? path.resolve(process.cwd(), "dist", "public", "index.html")
        : path.resolve(process.cwd(), "client", "index.html");

      if (!fs.existsSync(indexPath)) {
        return next();
      }

      let html = fs.readFileSync(indexPath, "utf8");

      // OG Tags to inject
      const ogTags = `
    <!-- Dynamic OG Tags -->
    <title>${post.title} | Monteiro Corretora</title>
    <meta name="description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${post.title}" />
    <meta property="og:description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${post.coverImage}" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${post.title}" />
    <meta name="twitter:description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${post.coverImage}" />
      `.trim();

      // Inject before </head>
      html = html.replace("</head>", `${ogTags}\n</head>`);

      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    } catch (error) {
      console.error("SEO Middleware Error:", error);
      next();
    }
  });

  // Posts
  app.get(api.posts.list.path, async (req, res) => {
    const isAdminUser = req.isAuthenticated() && (req.user as any).role === "admin";
    const posts = await storage.getPosts(!isAdminUser);
    res.json(posts);
  });

  app.get(api.posts.get.path, async (req, res) => {
    const post = await storage.getPostBySlug(req.params.slug as string);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  });

  app.delete("/api/posts/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deletePost(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.patch("/api/posts/:id", isAuthenticated, isAdmin, async (req, res) => {
    const post = await storage.updatePost(parseInt(req.params.id), req.body);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.patch("/api/admin/posts/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    const post = await storage.approvePost(parseInt(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    const input = req.body;
    const isApproved = (req.user as any).role === "admin";
    const post = await storage.createPost({ ...input, isApproved });
    res.status(201).json(post);
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

  // Inquiries
  app.post(api.inquiries.create.path, async (req, res) => {
    try {
      const input = api.inquiries.create.input.parse(req.body);
      const userId = req.isAuthenticated() ? (req.user as any).id : null;
      
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
          assignedTo: 0
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
        userId: userId || 0,
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

  app.post("/api/contacts", isTeam, async (req, res) => {
    try {
      const input = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(input);
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
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
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/leads/:id/status", isTeam, async (req, res) => {
    const lead = await storage.updateLeadStatus(parseInt(req.params.id), req.body.status);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  });

  app.patch("/api/leads/:id", isTeam, async (req, res) => {
    const lead = await storage.updateLead(parseInt(req.params.id), req.body);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
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
      const { username, password, name, role } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ message: "username, password e name são obrigatórios" });
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
      });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;

      const { comparePasswords } = await import("./auth");
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
    const validStatuses = [
      "pendencia", "revisao", "prospect", "cotacao_enviada", 
      "implantacao", "fechado", "venda_perdida", "venda_cancelada"
    ];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Status inválido" });
    }
    const task = await storage.updateTaskStatus(parseInt(req.params.id), req.body.status);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.patch("/api/tasks/:id", isTeam, async (req, res) => {
    const task = await storage.updateTask(parseInt(req.params.id), req.body);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.delete("/api/tasks/:id", isTeam, async (req, res) => {
    await storage.deleteTask(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.get("/api/site-settings", async (req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  app.patch("/api/site-settings", isAdmin, async (req, res) => {
    try {
      const input = insertSiteSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSiteSettings(input);
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

  // Company Search Proxy (Filtered by region and CNAE)
  app.get("/api/proxy/companies/search", isAuthenticated, async (req, res) => {
    const { state, city, cnae, q, neighborhood } = req.query;

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

    // Detect niche from keyword
    let detectedNiche = NICHE_MAP.find(n =>
      n.terms.some(term => keyword.includes(term) || term.includes(keyword))
    );

    // Explicit CNAE override
    const cnaeCode = cnae
      ? (cnae as string).replace(/\D/g, "")
      : detectedNiche?.cnae || "";

    console.log(`[CompanySearch] UF=${uf} | Cidade=${municipio} | Bairro=${bairroFiltroInput} | CNAE=${cnaeCode} | Nicho=${detectedNiche?.label || "geral"} | Keyword="${keyword}"`);

    let results: any[] = [];
    let apiSuccess = false;

    // -----------------------------------------------------------------------
    // Strategy: publica.cnpj.ws — search by UF + municipio + CNAE
    // -----------------------------------------------------------------------
    if (cnaeCode || municipio) {
      try {
        const params = new URLSearchParams();
        if (uf) params.set("uf", uf);
        if (municipio) params.set("municipio", municipio.toUpperCase());
        if (cnaeCode) params.set("cnae", cnaeCode);
        if (bairroFiltroInput) params.set("q", bairroFiltroInput.toUpperCase());

        const url = `https://publica.cnpj.ws/cnpjs?${params.toString()}`;
        const apiRes = await fetch(url, {
          headers: { "Accept": "application/json", "User-Agent": "MonteiroSeguros/1.0" },
          signal: AbortSignal.timeout(7000),
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          const raw = Array.isArray(data) ? data : (data.data || data.companies || []);

          results = raw.map((c: any) => ({
            razao_social: c.razao_social || c.nome || "",
            nome_fantasia: c.nome_fantasia || "",
            cnpj: c.cnpj || "",
            logradouro: c.logradouro || c.endereco?.logradouro || "",
            numero: c.numero || c.endereco?.numero || "",
            bairro: c.bairro || c.endereco?.bairro || "",
            municipio: c.municipio || c.endereco?.municipio || targetCity,
            uf: c.uf || c.endereco?.uf || targetUf,
            cep: c.cep || c.endereco?.cep || "",
            cnae_principal_descricao: c.cnae_fiscal_descricao || c.atividade_principal?.[0]?.text || detectedNiche?.cnaeDesc || "",
            ddd_telefone_1: c.ddd_telefone_1 || c.telefone || "",
            email: c.email || "",
          }));

          if (results.length > 0) {
            apiSuccess = true;
            console.log(`[CompanySearch] API retornou ${results.length} empresas reais`);
          }
        } else {
          console.warn(`[CompanySearch] API HTTP ${apiRes.status}`);
        }
      } catch (e: any) {
        console.warn(`[CompanySearch] API falhou: ${e.message}`);
      }
    }

    // -----------------------------------------------------------------------
    // OSM Overpass fallback — fetch REAL businesses from OpenStreetMap
    // -----------------------------------------------------------------------
    if (!apiSuccess) {
      console.warn(`[CompanySearch] CNPJ API sem resultado. Buscando negócios reais no OSM para: ${bairroFiltroInput || municipio}`);

      // Map niche keyword to OSM amenity/shop tags
      const OSM_TAG_MAP: Record<string, string[]> = {
        "Alimentação": ["amenity=restaurant", "amenity=cafe", "amenity=fast_food", "amenity=food_court", "amenity=bar", "shop=bakery"],
        "Academia/Fitness": ["leisure=fitness_centre", "leisure=sports_centre", "leisure=gym"],
        "Saúde": ["amenity=clinic", "amenity=doctors", "amenity=hospital", "healthcare=yes"],
        "Advocacia": ["office=lawyer"],
        "Contabilidade": ["office=accountant", "office=financial"],
        "Automotivo": ["shop=car_repair", "amenity=car_wash", "shop=tyres", "shop=car"],
        "Beleza": ["shop=hairdresser", "shop=beauty", "amenity=beauty_salon"],
        "Pet Shop": ["shop=pet", "amenity=veterinary"],
        "Imóveis": ["office=estate_agent"],
        "Seguros": ["office=insurance"],
        "Tecnologia": ["office=it", "office=software"],
        "Marketing": ["office=advertising_agency", "office=marketing"],
        "Construção": ["office=construction", "craft=construction"],
        "Logística": ["amenity=courier", "shop=shipping"],
        "Farmácia Manipulação": ["amenity=pharmacy", "healthcare=pharmacy"],
      };

      const nicheLabel = detectedNiche?.label || "";
      let osmTags = OSM_TAG_MAP[nicheLabel] || ["amenity=yes", "shop=yes", "office=yes"];

      // Build Overpass QL query — search within the neighborhood polygon in the city
      const locationQuery = bairroFiltroInput
        ? `"${bairroFiltroInput}" "${municipio || ""}" Brazil`
        : `"${municipio || targetCity}" Brazil`;

      // Build tag union for Overpass
      const tagUnion = osmTags
        .map(tag => {
          const [k, v] = tag.split("=");
          return v === "yes"
            ? `node["${k}"](area.searchArea);\nway["${k}"](area.searchArea);`
            : `node["${k}"="${v}"](area.searchArea);\nway["${k}"="${v}"](area.searchArea);`;
        })
        .join("\n");

      const areaName = bairroFiltroInput || municipio || "São Paulo";
      const overpassQuery = `
[out:json][timeout:30];
area[name="${areaName}"]->.searchArea;
(
${tagUnion}
);
out center 50;
`.trim();

      try {
        const overpassUrl = "https://overpass-api.de/api/interpreter";
        console.log(`[CompanySearch] Overpass query para: ${areaName}`);

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
            apiSuccess = true;
            console.log(`[CompanySearch] OSM: ${results.length} negócios reais encontrados`);
          }
        }
      } catch (e: any) {
        console.warn(`[CompanySearch] OSM Overpass falhou: ${e.message}`);
      }
    }

    // -----------------------------------------------------------------------
    // Last resort: if both CNPJ API and OSM failed, return empty with a message
    // -----------------------------------------------------------------------
    if (!apiSuccess || results.length === 0) {
      console.warn(`[CompanySearch] Nenhum dado real encontrado para: ${bairroFiltroInput || municipio}`);
      // Return empty — the frontend will show "Nenhum resultado encontrado"
      return res.json([]);
    }

    // Post-processing filter: Ensure results match the city and bairro filters strictly (case-insensitive)
    if (bairroFiltroInput && results.length > 0) {
      const bSearch = bairroFiltroInput.toUpperCase().trim();
      results = results.filter(c =>
        (c.bairro || "").toUpperCase().trim().includes(bSearch)
      );
    }

    if (municipio && results.length > 0) {
      const mSearch = municipio.toUpperCase().trim();
      results = results.filter(c =>
        !c.municipio || (c.municipio || "").toUpperCase().trim().includes(mSearch)
      );
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
    });
    await storage.createPost({
      title: "Dicas para economizar no seguro",
      slug: "dicas-economizar-seguro",
      summary: "Saiba como reduzir o valor do seu seguro sem perder coberturas importantes.",
      content: "Muitas pessoas não sabem, mas pequenas atitudes podem diminuir o valor do seguro...",
      coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000",
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

  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const { name, avatar } = req.body;
      const userId = (req.user as any).id;
      const updatedUser = await storage.updateUserProfile(userId, { name, avatar });
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
