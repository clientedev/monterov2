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
    limit: "100mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "100mb" }));

// Fast 301 domain redirect from monteirocorretora.com.br to monteiroseguros.com.br
app.use((req, res, next) => {
  const host = req.headers.host || "";
  if (host.includes("monteirocorretora.com.br")) {
    const targetUrl = `https://www.monteiroseguros.com.br${req.originalUrl || req.url}`;
    return res.redirect(301, targetUrl);
  }
  next();
});

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
  log("skipping file-based migrations — using raw SQL guards instead");
  const { db } = await import("./db");
  
  // Auto-sync all required tables and columns on startup using individual queries
  // (pg driver does not support multi-statement strings reliably)
  const { pool } = await import("./db");

  const startupQueries = [
    // Insurance tables
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
    // Blog posts — ensure all schema columns exist
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0 NOT NULL`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false NOT NULL`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false NOT NULL`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at timestamp DEFAULT NOW()`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url text`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS youtube_url text`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nome_representante text`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone_representante text`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email_representante text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS id_proposta text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS id_apolice text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS pdf_apolice text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS cobertura text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS data_emissao timestamp`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS numero_proposta text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS link_fatura text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS forma_pagamento text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS mes_atraso text`,
    `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS faturas_aberto text`,

    // Users & Leads & Email Notifications
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false NOT NULL`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to integer REFERENCES users(id)`,
    `CREATE TABLE IF NOT EXISTS email_notification_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      event_type TEXT NOT NULL,
      record_type TEXT,
      record_id INTEGER,
      status TEXT NOT NULL DEFAULT 'sent',
      error_message TEXT,
      sent_at TIMESTAMP DEFAULT NOW()
    )`,

    // TODOIST Module Tables
    `CREATE TABLE IF NOT EXISTS todoist_projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#0F6570',
      icon TEXT DEFAULT 'folder',
      is_favorite BOOLEAN DEFAULT false,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_labels (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'P3',
      kanban_column TEXT DEFAULT 'a_fazer',
      status TEXT DEFAULT 'todo',
      due_date TIMESTAMP,
      due_time TEXT,
      is_recurring BOOLEAN DEFAULT false,
      recurrence_rule TEXT,
      project_id INTEGER REFERENCES todoist_projects(id) ON DELETE SET NULL,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
      apolice_id INTEGER REFERENCES apolices(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_task_labels (
      task_id INTEGER REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      label_id INTEGER REFERENCES todoist_labels(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_subtasks (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_comments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_activity_logs (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_automations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      action_title TEXT NOT NULL,
      priority TEXT DEFAULT 'P2',
      target_user_id INTEGER REFERENCES users(id),
      project_id INTEGER REFERENCES todoist_projects(id),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS todoist_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo' NOT NULL;`
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
    const { eq, like } = await import("drizzle-orm");
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
