const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_USERS = [
  {
    email: 'admin@test.com',
    name: 'Production Admin',
    password: 'admin123',
    role: 'ADMIN'
  },
  {
    email: 'abdoo@gmail.com',
    name: 'Abdop',
    password: 'password123',
    role: 'ADMIN'
  },
  {
    email: 'yassin.mahmoud1236@gmail.com',
    name: 'Yassin Mahmoud',
    password: 'password123',
    role: 'ADMIN'
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Starting user seed...');
    
    for (const userData of DEFAULT_USERS) {
      const { email, name, password, role } = userData;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        console.log(`✅ User ${email} already exists, skipping...`);
        continue;
      }
      
      // Hash password with bcrypt (NEVER store plain text)
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user with properly hashed password
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
          isActive: true
        }
      });
      
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }
    
    console.log('🎉 User seed completed successfully!');
    
    // Verify all users have bcrypt passwords
    const users = await prisma.user.findMany({
      select: { email: true, password: true }
    });
    
    console.log('\n🔍 Password verification:');
    users.forEach(user => {
      const isBcrypt = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
      console.log(`${isBcrypt ? '✅' : '❌'} ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers };
