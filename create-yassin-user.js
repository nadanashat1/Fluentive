const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/lib/auth/password-service');

const prisma = new PrismaClient();

async function createYassinUser() {
  try {
    const hashedPassword = await hashPassword('password123');
    
    const user = await prisma.user.create({
      data: {
        email: 'yassin.mahmoud1236@gmail.com',
        name: 'Yassin Mahmoud',
        password: hashedPassword,
        isActive: true,
        role: 'ADMIN'
      }
    });
    
    console.log('Created user:', user.email);
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createYassinUser();
