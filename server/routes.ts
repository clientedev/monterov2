import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, hashPassword } from "./auth";
import {
  insertContactSchema,
  insertLeadSchema,
  insertInteractionSchema,
  insertCampaignSchema,
  insertTaskSchema,
  insertSiteSettingsSchema,
  insertHeroSlideSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Middleware to check authentication
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  // Posts
  app.get(api.posts.list.path, async (req, res) => {
    const posts = await storage.getPosts();
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

  app.post("/api/posts", isAuthenticated, isAdmin, async (req, res) => {
    const input = req.body;
    const post = await storage.createPost(input);
    res.status(201).json(post);
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
      const inquiry = await storage.createInquiry(input);
      res.status(201).json(inquiry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });


  // CRM Routes

  // Contacts
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    const contacts = await storage.getContacts();
    res.json(contacts);
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
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
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    const leads = await storage.getLeads();
    res.json(leads);
  });

  app.post("/api/leads", isAuthenticated, async (req, res) => {
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

  app.patch("/api/leads/:id/status", isAuthenticated, async (req, res) => {
    const lead = await storage.updateLeadStatus(parseInt(req.params.id), req.body.status);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  });

  // Interactions
  app.get("/api/interactions", isAuthenticated, async (req, res) => {
    const leadId = req.query.leadId ? parseInt(req.query.leadId as string) : undefined;
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const interactions = await storage.getInteractions(leadId, contactId);
    res.json(interactions);
  });

  app.post("/api/interactions", isAuthenticated, async (req, res) => {
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
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
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
  app.get("/api/users", isAuthenticated, async (req, res) => {
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

  // Tasks
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    const assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
    const tasks = await storage.getTasks(assignedTo);
    res.json(tasks);
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
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

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    await storage.deleteTask(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Site Settings
  app.get("/api/site-settings", async (req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
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

  const postsList = await storage.getPosts();
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

  return httpServer;
}
