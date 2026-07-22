const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentRoles() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      take: 10
    });
    
    console.log('Current users and their roles:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - Role: "${user.role}" (${typeof user.role})`);
    });
    
    // Check role distribution
    const roleCounts = {};
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('\nRole distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  "${role}": ${count} users`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentRoles();
