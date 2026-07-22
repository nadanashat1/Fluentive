const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({ 
      select: { 
        email: true, 
        isActive: true, 
        password: true, 
        role: true, 
        createdAt: true, 
        updatedAt: true, 
        isDeleted: true, 
        deletedAt: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('All users in database:');
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Deleted: ${user.isDeleted}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('---');
    });
    
    // Also check specifically for yassin
    const yassinUsers = users.filter(user => 
      user.email.toLowerCase().includes('yassin')
    );
    
    console.log(`\nUsers with 'yassin' in email: ${yassinUsers.length}`);
    yassinUsers.forEach(user => {
      console.log(`Found: ${user.email} (Active: ${user.isActive}, Deleted: ${user.isDeleted})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
