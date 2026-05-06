import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding logo_scale and logo_scale_mobile columns to site_settings...");
    await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_scale INTEGER NOT NULL DEFAULT 150`);
    await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_scale_mobile INTEGER NOT NULL DEFAULT 130`);
    console.log("Columns added successfully!");
  } catch (err) {
    console.error("Error adding columns:", err);
  } finally {
    process.exit(0);
  }
}

main();
