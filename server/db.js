import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max:Number(process.env.DB_POOL_MAX||10) });
pool.on('error',err=>console.error('Conexão de banco interrompida:',err.message));
export async function tx(fn){
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
  catch(e){ await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}
