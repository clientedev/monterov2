import "dotenv/config";
import { pool } from "../server/db";

async function run() {
  try {
    await pool.query("ALTER TABLE posts ADD COLUMN IF NOT EXISTS instagram_url text");
    await pool.query("ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'article'");
    console.log("Migration completed successfully: instagram_url and post_type columns are present!");
  } catch (err: any) {
    console.error("Migration error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
