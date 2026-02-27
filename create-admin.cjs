const { Pool } = require('pg');
const crypto = require('crypto');
const util = require('util');

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
}

async function runWithRetry(fn, maxRetries = 5) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.log(`Attempt ${i + 1} failed: ${error.message}. Retrying...`);
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw lastError;
}

async function createAdmin() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is missing");
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await runWithRetry(async () => {
            const username = "admin";
            const password = "admin123";
            const name = "Administrador";
            const role = "admin";

            console.log(`Checking if user ${username} exists...`);
            const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

            if (rows.length > 0) {
                console.log("Admin user already exists.");
            } else {
                console.log(`Creating admin user: ${username}`);
                const hashedPassword = await hashPassword(password);
                await pool.query(
                    'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
                    [username, hashedPassword, name, role]
                );
                console.log("Admin user created successfully!");
                console.log(`Username: ${username}`);
                console.log(`Password: ${password}`);
            }
        });
    } catch (error) {
        console.error("Error creating admin user after multiple attempts:", error);
    } finally {
        await pool.end();
    }
}

createAdmin();
