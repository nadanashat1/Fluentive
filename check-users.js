const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findMany({
  select: {
    email: true,
    name: true,
    isActive: true,
    role: true
  }
}).then(users => {
  console.log('ACTUAL USERS IN DB:');
  users.forEach(u => {
    console.log(`- ${u.email} (${u.name}) - Active: ${u.isActive} - Role: ${u.role}`);
  });
  process.exit(0);
}).catch(console.error);
