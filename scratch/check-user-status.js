const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env' });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'yassin.mahmoud12367@gmail.com';
  console.log('Searching for email:', email);
  
  const users = await prisma.user.findMany({
    where: { email: { contains: email, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      isActive: true,
      isDeleted: true,
      role: true,
      organizationId: true
    }
  });

  console.log('Matches found:', users.length);
  console.log('Results:', JSON.stringify(users, null, 2));

  if (users.length === 0) {
    const total = await prisma.user.count();
    console.log('Total users in DB:', total);
    const lastUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { email: true, createdAt: true }
    });
    console.log('Last 5 registered users:', JSON.stringify(lastUsers, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
