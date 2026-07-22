// Check users in DB - using same Prisma setup as the app
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const prisma = new PrismaClient({
    log: ['error'],
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });
  
  try {
    const users = await prisma.user.findMany({
      select: { email: true, isActive: true, isDeleted: true, role: true },
      take: 10
    });
    console.log('Users in database:');
    users.forEach(u => console.log(`  ${u.email} | active=${u.isActive} | deleted=${u.isDeleted} | role=${u.role}`));
    if (users.length === 0) console.log('  (no users found)');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
