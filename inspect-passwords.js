const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectPasswords() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        password: true,
        name: true
      }
    });
    
    console.log('=== PASSWORD INSPECTION ===');
    users.forEach(user => {
      const isBcrypt = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
      const format = isBcrypt ? '✅ BCRYPT' : '❌ PLAIN TEXT';
      const preview = user.password.length > 20 ? user.password.substring(0, 20) + '...' : user.password;
      
      console.log(`${format} ${user.email} (${user.name})`);
      console.log(`   Password: "${preview}"`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error inspecting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectPasswords();
