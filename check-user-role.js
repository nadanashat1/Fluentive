const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      take: 5
    });
    
    console.log('Users in database:');
    console.table(users);
    
    // Find user with email containing 'admin' or similar
    const adminUsers = users.filter(u => 
      u.email.includes('admin') || 
      u.name.includes('admin') || 
      u.role.includes('admin')
    );
    
    if (adminUsers.length > 0) {
      console.log('\nAdmin/Manager users found:');
      console.table(adminUsers);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
