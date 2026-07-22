const { PrismaClient } = require('@prisma/client');

// Simple bcrypt implementation for this one-off
async function hashPassword(password) {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

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
    
    console.log('✅ Created user:', user.email);
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createYassinUser();
