const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking for existing admin users...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email: 'admin@test.com',
        role: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists. Skipping seed.');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`✅ Active: ${existingAdmin.isActive}`);
      return;
    }

    console.log('🔧 Creating admin user...');
    
    // Create admin user with consistent bcrypt settings (12 rounds)
    const hashedPassword = await bcrypt.hash('Admin123456!', 12);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Production Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: Admin123456!`);
    console.log(`👤 Name: ${admin.name}`);
    console.log(`🔐 Role: ${admin.role}`);
    console.log(`📅 Created: ${admin.createdAt}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change password immediately after first login!');
    
  } catch (error) {
    console.error('❌ Error during seed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
