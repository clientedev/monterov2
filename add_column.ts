import { Client } from 'pg';
const client = new Client({
  connectionString: 'postgresql://postgres:CuvCrlpuOQAPfAWLzYpMxWeIAjeguCJC@trolley.proxy.rlwy.net:56311/railway',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    await client.connect();
    await client.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false NOT NULL;');
    console.log('coluna adicionada com sucesso!');
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await client.end();
  }
}
run();
