const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseAuth() {
  console.log('🔍 DATABASE AUTHENTICATION SCHEMA CHECK\n');
  
  try {
    // 1. Check User table structure
    console.log('1️⃣ Checking User table schema...');
    const userTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position;
    `;
    
    console.log('   User table columns:');
    userTableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2. Check existing users
    console.log('\n2️⃣ Checking existing users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
        isDeleted: true,
        createdAt: true
      },
      take: 10
    });

    console.log(`   Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email}`);
      console.log(`     ID: ${user.id}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Active: ${user.isActive}`);
      console.log(`     Password: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);
      console.log(`     Created: ${user.createdAt}`);
    });

    // 3. Test specific user query
    console.log('\n3️⃣ Testing specific user query...');
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true
      }
    });

    if (testUser) {
      console.log('   ✅ Found test@example.com:');
      console.log(`     Password hash: ${testUser.password}`);
      console.log(`     Is bcrypt: ${testUser.password.startsWith('$2b$') || testUser.password.startsWith('$2a$')}`);
      console.log(`     Hash length: ${testUser.password.length}`);
    } else {
      console.log('   ❌ test@example.com NOT FOUND');
    }

    // 4. Check for NULL passwords
    console.log('\n4️⃣ Checking for NULL passwords...');
    const nullPasswordUsers = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "User" 
      WHERE password IS NULL OR password = '';
    `;
    
    console.log(`   Users with NULL/empty passwords: ${nullPasswordUsers[0]?.count || 0}`);

    // 5. Check for invalid emails
    console.log('\n5️⃣ Checking for invalid emails...');
    const invalidEmails = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "User" 
      WHERE email IS NULL OR email = '' OR NOT (email LIKE '%@%');
    `;
    
    console.log(`   Users with invalid emails: ${invalidEmails[0]?.count || 0}`);

    // 6. Test password comparison logic
    console.log('\n6️⃣ Testing password comparison...');
    if (testUser && testUser.password) {
      const bcrypt = require('bcryptjs');
      
      // Test with correct password
      const correctResult = await bcrypt.compare('123456', testUser.password);
      console.log(`   Compare with correct password (123456): ${correctResult}`);
      
      // Test with wrong password
      const wrongResult = await bcrypt.compare('wrongpassword', testUser.password);
      console.log(`   Compare with wrong password: ${wrongResult}`);
      
      // Test hash format
      const isValidBcrypt = /^\$2[aby]\$\d{2}\$/.test(testUser.password);
      console.log(`   Valid bcrypt format: ${isValidBcrypt}`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseAuth();
