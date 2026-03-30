import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in env');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: (connectionString.includes('railway.net') || connectionString.includes('rlwy.net'))
            ? { rejectUnauthorized: false }
            : false
    });

    try {
        const query = `
            UPDATE site_settings 
            SET about_content = 'A Monteiro Corretora nasceu com a missão de tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.\n\nAo longo das últimas décadas, crescemos e nos tornamos uma das corretoras mais respeitadas da região. Nosso crescimento não mudou nossos valores fundamentais — tratar cada cliente com exclusividade e dedicação, garantindo a proteção do que é mais importante para você.'
            WHERE about_content LIKE '%Carlos%';
        `;
        const res = await pool.query(query);
        console.log(`✅ Update successful. Rows affected: ${res.rowCount}`);
    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
