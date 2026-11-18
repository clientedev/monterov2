// Remove, uma única vez, os dois artigos que foram publicados automaticamente em
// 18/11/2026 sem aprovação. Só apaga se o título for exatamente o publicado.

import { pool } from "./db";
import { storage } from "./storage";

const KEY = "remove-seo-blog-posts-2026-11";

const POSTS: Array<[string, string]> = [
  ["plano-de-saude-empresarial-mei-pequenas-empresas", "Plano de saúde empresarial para MEI e pequenas empresas: como funciona"],
  ["pgbl-ou-vgbl-qual-previdencia-privada-escolher", "PGBL ou VGBL: qual previdência privada escolher"],
];

export async function seedSeoPosts() {
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS seed_runs (key TEXT PRIMARY KEY, ran_at TIMESTAMP DEFAULT NOW())");
    const done = await pool.query("SELECT 1 FROM seed_runs WHERE key = $1", [KEY]);
    if (done.rowCount) return;
    for (const [slug, title] of POSTS) {
      const r = await pool.query("SELECT id FROM posts WHERE slug = $1 AND title = $2", [slug, title]);
      for (const row of r.rows) {
        await pool.query("DELETE FROM comments WHERE post_id = $1", [row.id]);
        await storage.deletePost(row.id);
        console.log(`[SEO] artigo removido: ${slug}`);
      }
    }
    await pool.query("INSERT INTO seed_runs (key) VALUES ($1) ON CONFLICT DO NOTHING", [KEY]);
  } catch (err: any) {
    console.warn("[SEO] não foi possível remover os artigos:", err?.message);
  }
}
