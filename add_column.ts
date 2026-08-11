import { Client } from 'pg';
const client = new Client({
  connectionString: 'postgresql://postgres:CuvCrlpuOQAPfAWLzYpMxWeIAjeguCJC@trolley.proxy.rlwy.net:56311/railway',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    await client.connect();
    await client.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false NOT NULL;');
    await client.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false NOT NULL;');
    await client.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at timestamp DEFAULT NOW();');
    console.log('Colunas do Railway DB sincronizadas com sucesso!');
  } catch (e: any) {
    console.error('Erro ao atualizar Railway DB:', e.message);
  } finally {
    await client.end();
  }
}
run();
