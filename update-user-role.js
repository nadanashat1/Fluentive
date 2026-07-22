const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    // Update yassin's role to SALES_ADMIN_MANAGER
    const updatedUser = await prisma.user.update({
      where: { email: 'yassin.mahmoud12367@gmail.com' },
      data: { role: 'SALES_ADMIN_MANAGER' }
    });
    
    console.log('Updated user role:');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Name: ${updatedUser.name}`);
    console.log(`New Role: "${updatedUser.role}"`);
    
    // Verify the update
    const verifiedUser = await prisma.user.findUnique({
      where: { email: 'yassin.mahmoud12367@gmail.com' },
      select: { id: true, email: true, name: true, role: true }
    });
    
    console.log('\nVerified updated role:');
    console.log(`Role: "${verifiedUser.role}"`);
    
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();
