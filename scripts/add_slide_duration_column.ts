import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Adicionando coluna slide_duration em hero_slides...");
  try {
    await db.execute(sql`
      ALTER TABLE hero_slides 
      ADD COLUMN IF NOT EXISTS slide_duration integer NOT NULL DEFAULT 7;
    `);
    console.log("Coluna slide_duration adicionada com sucesso!");
  } catch (err) {
    console.error("Erro ao adicionar coluna:", err);
  }
  process.exit(0);
}

main();
