import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { resolve } from "path";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Serve attached_assets statically so images referenced by path work
app.use("/attached_assets", express.static(resolve(process.cwd(), "attached_assets")));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  log("Running startup schema sync...");
  const { db } = await import("./db");
  const { pool } = await import("./db");

  // Comprehensive startup SQL sync — ensures every table and column the app
  // needs exists in the Railway (or any) PostgreSQL database.
  // Each query runs independently so one failure never blocks the rest.
  const startupQueries = [
    // ── Core tables (no FK deps on other custom tables) ───────────────────────
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      name TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      summary TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      published_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      budget TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY,
      site_name TEXT NOT NULL DEFAULT 'Monteiro Seguros e Benefícios',
      logo_base64 TEXT,
      primary_color TEXT NOT NULL DEFAULT '#08454c',
      secondary_color TEXT NOT NULL DEFAULT '#c65f54',
      font_sans TEXT NOT NULL DEFAULT 'Inter',
      font_display TEXT NOT NULL DEFAULT 'Outfit',
      logo_scale INTEGER NOT NULL DEFAULT 150,
      logo_scale_mobile INTEGER NOT NULL DEFAULT 130,
      hero_title TEXT NOT NULL DEFAULT 'Proteção que Transforma,' || chr(10) || 'Benefícios que Cuidam',
      hero_subtitle TEXT NOT NULL DEFAULT 'A Monteiro Seguros e Benefícios é especializada em consultoria estratégica em proteção e benefícios para empresas e famílias.',
      about_title TEXT NOT NULL DEFAULT 'Sobre a Monteiro Seguros e Benefícios',
      about_content TEXT NOT NULL DEFAULT 'A Monteiro Corretora nasceu com a missão de tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.',
      about_image_base64 TEXT DEFAULT 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600',
      services_title TEXT NOT NULL DEFAULT 'Soluções Completas em Proteção e Benefícios',
      services_subtitle TEXT NOT NULL DEFAULT 'Planos personalizados para cada momento da sua vida e do seu negócio.',
      blog_title TEXT NOT NULL DEFAULT 'Blog e Novidades',
      blog_subtitle TEXT NOT NULL DEFAULT 'Fique por dentro das novidades e dicas do mercado de seguros e benefícios.',
      contact_email TEXT NOT NULL DEFAULT 'contato@monteiroseguros.com.br',
      contact_phone TEXT NOT NULL DEFAULT '+55 (11) 9999-9999',
      address TEXT NOT NULL DEFAULT 'São Paulo, SP',
      footer_text TEXT NOT NULL DEFAULT 'Cuidar de pessoas é uma decisão estratégica. Benefícios não são custo. São estratégia.',
      facebook_url TEXT,
      instagram_url TEXT,
      twitter_url TEXT,
      linkedin_url TEXT,
      whatsapp_url TEXT,
      task_columns TEXT,
      lead_columns TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS hero_slides (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_base64 TEXT NOT NULL,
      button_text TEXT NOT NULL DEFAULT 'Cotação Gratuita',
      button_link TEXT NOT NULL DEFAULT '/contact',
      "order" INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS session (
      sid TEXT PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS seguradoras (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS produtos_seguro (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ── Tables with FK to users ───────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      document TEXT,
      address TEXT,
      responsible_name TEXT,
      responsible_id INTEGER,
      anniversary_date TEXT,
      marital_status TEXT,
      assigned_to INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      is_approved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT,
      data_nascimento TEXT,
      telefone TEXT,
      whatsapp TEXT,
      email TEXT,
      endereco TEXT,
      cidade TEXT,
      estado TEXT,
      observacoes TEXT,
      tags TEXT,
      responsavel_comercial_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ── Tables with FK to contacts / users ────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      contact_id INTEGER NOT NULL REFERENCES contacts(id),
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT,
      product TEXT,
      value TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pendencia',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_to INTEGER NOT NULL REFERENCES users(id),
      contact_id INTEGER REFERENCES contacts(id),
      created_by INTEGER NOT NULL REFERENCES users(id),
      due_date TIMESTAMP,
      color TEXT NOT NULL DEFAULT 'default',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS prospecting_checklists (
      id SERIAL PRIMARY KEY,
      contact_id INTEGER NOT NULL REFERENCES contacts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      call_outcome TEXT NOT NULL,
      interest_level TEXT NOT NULL,
      notes TEXT,
      checklist_data TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ── Tables with FK to leads / contacts / users ────────────────────────────
    `CREATE TABLE IF NOT EXISTS interactions (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id),
      contact_id INTEGER NOT NULL REFERENCES contacts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      date TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ── Tables with FK to campaigns ───────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS marketing_stats (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER REFERENCES campaigns(id),
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      spend TEXT,
      date TIMESTAMP DEFAULT NOW()
    )`,

    // ── Tables with FK to posts ───────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id),
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_approved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ── Insurance module (FK to clientes, produtos_seguro, seguradoras, users) ─
    `CREATE TABLE IF NOT EXISTS apolices (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      produto_id INTEGER REFERENCES produtos_seguro(id),
      seguradora_id INTEGER REFERENCES seguradoras(id),
      numero_apolice TEXT,
      status TEXT NOT NULL DEFAULT 'ativa',
      inicio_vigencia TIMESTAMP,
      fim_vigencia TIMESTAMP,
      premio TEXT,
      valor_segurado TEXT,
      comissao TEXT,
      corretor_id INTEGER REFERENCES users(id),
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ── ADD COLUMN IF NOT EXISTS — incremental columns from later migrations ──
    // posts
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0 NOT NULL`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false NOT NULL`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS youtube_url TEXT`,
    // users
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`,
    // services
    `ALTER TABLE services ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0 NOT NULL`,
    // contacts
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS responsible_name TEXT`,
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS responsible_id INTEGER`,
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS anniversary_date TEXT`,
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marital_status TEXT`,
    // leads
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS product TEXT`,
    // inquiries
    `ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`,
    // tasks
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'default' NOT NULL`,
    // site_settings (columns added in later migrations)
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_scale INTEGER DEFAULT 150 NOT NULL`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_scale_mobile INTEGER DEFAULT 130 NOT NULL`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS task_columns TEXT`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS lead_columns TEXT`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS font_sans TEXT DEFAULT 'Inter' NOT NULL`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS font_display TEXT DEFAULT 'Outfit' NOT NULL`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitter_url TEXT`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS linkedin_url TEXT`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_url TEXT`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_image_base64 TEXT DEFAULT 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600'`,
  ];

  for (const sql of startupQueries) {
    try {
      await pool.query(sql);
    } catch (err) {
      log(`Startup SQL warning (non-fatal): ${err instanceof Error ? err.message : String(err)}`, "warn");
    }
  }
  log("Database startup sync completed");

  // Force cleanup of "Carlos" from database on startup
  try {
    const { siteSettings } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const settings = await db.select().from(siteSettings);
    if (settings.length > 0) {
      const target = settings[0];
      if (target.aboutContent.includes("Carlos")) {
        log("Purging 'Carlos' from database...");
        const newContent = "A Monteiro Corretora nasceu com a missão de tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.\n\nAo longo das últimas décadas, crescemos e nos tornamos uma das corretoras mais respeitadas da região. Nosso crescimento não mudou nossos valores fundamentais — tratar cada cliente com exclusividade e dedicação, garantindo a proteção do que é mais importante para você.";
        await db.update(siteSettings).set({ aboutContent: newContent }).where(eq(siteSettings.id, target.id));
        log("Database content cleaned successfully.");
      }
    }
  } catch (err) {
    log(`Startup cleanup failed: ${err instanceof Error ? err.message : String(err)}`, "error");
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
