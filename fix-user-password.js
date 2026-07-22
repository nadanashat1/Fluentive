const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixUserPassword() {
  try {
    // Hash password with proper bcrypt
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Update the existing user
    const user = await prisma.user.update({
      where: { email: 'yassin.mahmoud1236@gmail.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Fixed password for:', user.email);
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserPassword();
