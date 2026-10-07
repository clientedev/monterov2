import "dotenv/config";
import { pool } from "../server/db";

async function main() {
  console.log("Adicionando colunas de vídeo à tabela hero_slides...");

  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE hero_slides 
      ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image',
      ADD COLUMN IF NOT EXISTS video_url text,
      ADD COLUMN IF NOT EXISTS video_fit text DEFAULT 'cover';
    `);

    // Torna image_base64 opcional caso o slide use apenas vídeo
    await client.query(`
      ALTER TABLE hero_slides ALTER COLUMN image_base64 DROP NOT NULL;
    `);

    console.log("✅ Colunas media_type, video_url e video_fit adicionadas com sucesso!");

    // Listar slides atuais para conferir
    const res = await client.query(`
      SELECT id, title, media_type, video_url, video_fit, "order", is_active FROM hero_slides ORDER BY "order" ASC;
    `);
    console.log("Slides existentes:", res.rows);
  } catch (error) {
    console.error("Erro ao alterar tabela hero_slides:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
