const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const res = await pool.query("SELECT id FROM users WHERE email = 'yassin.mahmoud1236@gmail.com'");
  console.log('User ID:', res.rows[0]?.id);
}

main().catch(console.error).finally(() => pool.end());
