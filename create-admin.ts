import { hashPassword } from "./server/auth";
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;

// Minimal schema for script
const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("employee"),
    name: text("name").notNull(),
});

async function createAdmin() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is missing");
        return;
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    try {
        const username = "admin";
        const password = "admin123";
        const name = "Administrador";
        const role = "admin";

        console.log(`Checking if user ${username} exists...`);
        const result = await db.select().from(users);
        const existing = result.find(u => u.username === username);

        if (existing) {
            console.log("Admin user already exists.");
        } else {
            console.log(`Creating admin user: ${username}`);
            const hashedPassword = await hashPassword(password);
            await db.insert(users).values({
                username,
                password: hashedPassword,
                name,
                role as any
            });
            console.log("Admin user created successfully!");
            console.log(`Username: ${username}`);
            console.log(`Password: ${password}`);
        }
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await pool.end();
    }
}

createAdmin();
