import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: !process.env.DATABASE_URL?.includes("localhost") && !process.env.DATABASE_URL?.includes("127.0.0.1")
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 10000,
});

async function main() {
  console.log("Conectando ao banco de dados e verificando tabelas...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT,
      data_nascimento TEXT,
      telefone TEXT,
      whatsapp TEXT,
      email TEXT,
      endereco TEXT,
      cidade TEXT,
      estado TEXT,
      observacoes TEXT,
      tags TEXT,
      responsavel_comercial_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS seguradoras (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS produtos_seguro (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS apolices (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      produto_id INTEGER REFERENCES produtos_seguro(id),
      seguradora_id INTEGER REFERENCES seguradoras(id),
      numero_apolice TEXT,
      status TEXT NOT NULL DEFAULT 'ativa',
      inicio_vigencia TIMESTAMP,
      fim_vigencia TIMESTAMP,
      premio TEXT,
      valor_segurado TEXT,
      comissao TEXT,
      corretor_id INTEGER REFERENCES users(id),
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`
  ];

  for (const q of queries) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 5) {
      attempts++;
      try {
        const client = await pool.connect();
        await client.query(q);
        client.release();
        success = true;
      } catch (err: any) {
        console.warn(`Tentativa ${attempts} falhou: ${err.message}. Tentando novamente...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  console.log("✅ Todas as tabelas do módulo de seguro foram verificadas/criadas no banco com sucesso!");
  await pool.end();
}

main().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
