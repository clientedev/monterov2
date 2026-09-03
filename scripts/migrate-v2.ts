import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
});

async function runMigrations() {
  console.log("🔄 Running migrations...");
  const client = await pool.connect();

  try {
    // 1. Add email to users (nullable, preserves existing data)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
    console.log("✅ users.email added");

    // 2. Add assigned_to to leads
    await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id);`);
    console.log("✅ leads.assigned_to added");

    // 3. Create email_notification_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_notification_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_type TEXT NOT NULL,
        record_type TEXT,
        record_id INTEGER,
        status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ email_notification_logs table created");

    console.log("🎉 All migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
  process.exit(0);
}

runMigrations();
