import { pool, db } from "./server/db";
import { users } from "./shared/schema";
import { sql } from "drizzle-orm";

async function checkSchema() {
  try {
    console.log("Checking users table...");
    const result = await db.execute(sql`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log("Columns in 'users' table:");
    console.table(result.rows);
    
    const roles = await db.execute(sql`
      SELECT DISTINCT role FROM users;
    `);
    console.log("Existing roles in 'users' table:");
    console.table(roles.rows);
    
    process.exit(0);
  } catch (err) {
    console.error("Error checking schema:", err);
    process.exit(1);
  }
}

checkSchema();
