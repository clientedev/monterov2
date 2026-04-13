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
  log("running migrations...");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { db } = await import("./db");
  const migrationsPath = resolve(process.cwd(), "migrations");
  await migrate(db, { migrationsFolder: migrationsPath });
  log("migrations completed");
  
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
