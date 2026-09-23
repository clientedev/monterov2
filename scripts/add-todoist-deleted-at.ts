import { Client } from 'pg';
import 'dotenv/config';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    await client.query('ALTER TABLE todoist_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;');
    console.log('Column deleted_at successfully added to todoist_tasks table!');
  } catch (e: any) {
    console.error('Error updating todoist_tasks:', e.message);
  } finally {
    await client.end();
  }
}

run();
