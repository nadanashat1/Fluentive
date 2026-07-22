// Load environment variables
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function updateUserPassword() {
  try {
    const userEmail = 'yassin.mahmoud12367@gmail.com';
    const newPassword = '123456';
    
    console.log('=== UPDATING USER PASSWORD ===');
    console.log('User:', userEmail);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user password
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { 
        password: hashedPassword,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    console.log('✅ PASSWORD UPDATED SUCCESSFULLY');
    console.log('User:', updatedUser.name);
    console.log('Email:', updatedUser.email);
    console.log('Role:', updatedUser.role);
    console.log('Active:', updatedUser.isActive);
    console.log('New Password:', newPassword);
    console.log('\nYou can now login with:');
    console.log('Email:', userEmail);
    console.log('Password:', newPassword);
    
  } catch (error) {
    console.error('ERROR UPDATING PASSWORD:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPassword();
