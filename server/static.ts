import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve hashed assets with immutable long-term caching, and standard files with validation
  app.use(
    express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.includes("assets") || filePath.match(/\.[a-f0-9]{8,}\.(js|css|png|jpg|webp|svg)$/i)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      },
    }),
  );

  // Fall through to index.html ONLY for navigation routes. Never for missing assets or API calls!
  app.use("/{*path}", (req, res, next) => {
    // If request is for an asset, API, or static file that doesn't exist, return 404
    if (req.path.startsWith("/assets/") || req.path.startsWith("/api/") || req.path.includes(".")) {
      return res.status(404).end();
    }

    // Always serve index.html without cache so users always get the latest bundle
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
