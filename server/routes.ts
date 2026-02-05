import type { Express } from "express";
import { createServer, type Server } from "http";
import { prisma } from "./lib/prisma";
import {
  verifyToken,
  requireAuth,
  isAdmin,
  generateToken,
  hashPassword,
  comparePassword
} from "./lib/auth";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to parse JSON and verify token on all routes (optional per route checks)
  app.use(verifyToken);

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Usuário ou email já cadastrado" });
      }

      const hashedPassword = await hashPassword(password);

      // First user is ADMIN, others are USER
      const userCount = await prisma.user.count();
      const role = userCount === 0 ? "ADMIN" : "USER";

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role,
        },
      });

      const token = generateToken({ id: user.id, role: user.role });
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao registrar usuário" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(400).json({ message: "Usuário ou senha inválidos" });
      }

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Usuário ou senha inválidos" });
      }

      const token = generateToken({ id: user.id, role: user.role });
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    if (!req.user) return res.status(401).send();
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, role: true, email: true }
    });
    res.json(user);
  });

  // --- Public Content Routes ---

  // Get Posts (Published only)
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await prisma.post.findMany({
        where: { published: true },
        include: { author: { select: { username: true } } },
        orderBy: { publishedAt: "desc" }, // or createdAt if publishedAt is null? Schema says defaultNow()
      });
      // Corrected: publishedAt is timestamp defaultNow(), likely non-null if published.
      // But let's stick to simple orderBy createdAt for now or publishedAt
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar posts" });
    }
  });

  // Get Single Post
  app.get("/api/posts/:slug", async (req, res) => {
    try {
      const post = await prisma.post.findUnique({
        where: { slug: req.params.slug },
        include: {
          author: { select: { username: true } },
          comments: {
            where: { approved: true },
            include: { author: { select: { username: true } } },
            orderBy: { createdAt: "desc" }
          }
        },
      });

      if (!post) return res.status(404).json({ message: "Post não encontrado" });

      // If not published and not admin, hide it
      if (!post.published) {
        if (!req.user || req.user.role !== "ADMIN") {
          return res.status(404).json({ message: "Post não encontrado" });
        }
      }

      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar post" });
    }
  });

  // Post Comment
  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      const userId = req.user!.userId;

      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: userId,
          approved: false, // Must be approved by admin
        },
      });

      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao comentar" });
    }
  });

  // Get Hero Slides
  app.get("/api/hero", async (req, res) => {
    try {
      const slides = await prisma.heroSlide.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      });
      res.json(slides);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar slides" });
    }
  });

  // Get Testimonials (Approved)
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await prisma.testimonial.findMany({
        where: { approved: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar depoimentos" });
    }
  });

  // Post Testimonial (Public or Auth?) - Spec says users can send. Let's assume public is fine or Auth?
  // "Usuários podem enviar uma avaliação". Let's allow public for now or assume they are logged in if they want to track it.
  // Req says "usuários". Let's assume anyone can post but requires pending approval. 
  // For simplicity, let's allow unauthenticated for name/text/rating.
  app.post("/api/testimonials", async (req, res) => {
    try {
      const { name, text, rating } = req.body;
      const testimonial = await prisma.testimonial.create({
        data: { name, text, rating: parseInt(rating), approved: false }
      });
      res.json(testimonial);
    } catch (error) {
      res.status(500).json({ message: "Erro ao enviar depoimento" });
    }
  });

  // Get Site Config
  app.get("/api/services", async (req, res) => {
    try {
      const services = await prisma.service.findMany();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviços" });
    }
  });

  app.get("/api/config", async (req, res) => {
    try {
      const config = await prisma.siteConfig.findFirst();
      // specific default colors if not found
      if (!config) {
        return res.json({ primaryColor: "#0ea5e9", secondaryColor: "#64748b" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });


  // --- ADMIN ROUTES ---

  // Dashboard Stats (Optional but good)
  app.get("/api/admin/stats", requireAuth, isAdmin, async (req, res) => {
    const postCount = await prisma.post.count();
    const commentPending = await prisma.comment.count({ where: { approved: false } });
    const testimonialPending = await prisma.testimonial.count({ where: { approved: false } });
    res.json({ postCount, commentPending, testimonialPending });
  });

  // Manage Posts
  app.get("/api/admin/posts", requireAuth, isAdmin, async (req, res) => {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
    res.json(posts);
  });

  app.post("/api/admin/posts", requireAuth, isAdmin, async (req, res) => {
    try {
      const { title, slug, content, summary, coverImage, videoUrl, published } = req.body;
      const post = await prisma.post.create({
        data: {
          title, slug, content, summary, coverImage, videoUrl, published,
          authorId: req.user!.userId
        }
      });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar post" });
    }
  });

  app.put("/api/admin/posts/:id", requireAuth, isAdmin, async (req, res) => {
    try {
      const { title, slug, content, summary, coverImage, videoUrl, published } = req.body;
      const post = await prisma.post.update({
        where: { id: parseInt(req.params.id) },
        data: { title, slug, content, summary, coverImage, videoUrl, published }
      });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar post" });
    }
  });

  app.delete("/api/admin/posts/:id", requireAuth, isAdmin, async (req, res) => {
    try {
      await prisma.post.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ message: "Post excluído" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir post" });
    }
  });

  // Manage Comments
  app.get("/api/admin/comments", requireAuth, isAdmin, async (req, res) => {
    const comments = await prisma.comment.findMany({
      include: { post: { select: { title: true } }, author: { select: { username: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(comments);
  });

  app.put("/api/admin/comments/:id", requireAuth, isAdmin, async (req, res) => {
    try {
      const { approved } = req.body;
      const comment = await prisma.comment.update({
        where: { id: parseInt(req.params.id) },
        data: { approved }
      });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao moderar comentário" });
    }
  });

  app.delete("/api/admin/comments/:id", requireAuth, isAdmin, async (req, res) => {
    await prisma.comment.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Comentário excluído" });
  });

  // Manage Hero
  app.get("/api/admin/hero", requireAuth, isAdmin, async (req, res) => {
    const slides = await prisma.heroSlide.findMany({ orderBy: { order: "asc" } });
    res.json(slides);
  });

  app.post("/api/admin/hero", requireAuth, isAdmin, async (req, res) => {
    const slide = await prisma.heroSlide.create({ data: req.body });
    res.json(slide);
  });

  app.put("/api/admin/hero/:id", requireAuth, isAdmin, async (req, res) => {
    const slide = await prisma.heroSlide.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(slide);
  });

  app.delete("/api/admin/hero/:id", requireAuth, isAdmin, async (req, res) => {
    await prisma.heroSlide.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Slide removido" });
  });

  // Manage Testimonials
  app.get("/api/admin/testimonials", requireAuth, isAdmin, async (req, res) => {
    const query = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
    res.json(query);
  });

  app.put("/api/admin/testimonials/:id", requireAuth, isAdmin, async (req, res) => {
    const { approved } = req.body;
    const t = await prisma.testimonial.update({
      where: { id: parseInt(req.params.id) },
      data: { approved }
    });
    res.json(t);
  });

  // Manage Config
  app.post("/api/admin/config", requireAuth, isAdmin, async (req, res) => {
    // Upsert
    const count = await prisma.siteConfig.count();
    let config;
    if (count === 0) {
      config = await prisma.siteConfig.create({ data: req.body });
    } else {
      // Assuming single row
      const first = await prisma.siteConfig.findFirst();
      config = await prisma.siteConfig.update({
        where: { id: first!.id },
        data: req.body
      });
    }
    res.json(config);
  });

  const httpServer = createServer(app);
  return httpServer;
}
