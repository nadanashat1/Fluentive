const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'yassin.mahmoud1236@gmail.com' },
    select: { id: true, email: true, role: true, isActive: true, organizationId: true }
  });
  console.log('User:', JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); await pool.end(); });
