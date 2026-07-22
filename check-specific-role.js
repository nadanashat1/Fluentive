const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificRole() {
  try {
    // Check for users with lowercase roles or containing 'sales admin manager'
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('All users and their roles:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: "${user.role}" (length: ${user.role?.length || 0})`);
      console.log(`   Role type: ${typeof user.role}`);
      console.log('---');
    });
    
    // Look for any user with role containing 'sales admin manager'
    const specificUser = allUsers.find(u => 
      u.role && (
        u.role.toLowerCase().includes('sales') ||
        u.role.toLowerCase().includes('admin') ||
        u.role.toLowerCase().includes('manager')
      )
    );
    
    if (specificUser) {
      console.log('\nFound user with sales/admin/manager role:');
      console.log(specificUser);
    } else {
      console.log('\nNo user found with sales/admin/manager in role');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificRole();
