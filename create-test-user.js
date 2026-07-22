// Load environment variables
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'SALES',
        isActive: true,
        organization: 'Test Organization'
      }
    });
    
    console.log('Test user created successfully:');
    console.log('Email: test@example.com');
    console.log('Password: 123456');
    console.log('User ID:', user.id);
    console.log('Stored hash:', user.password);
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
