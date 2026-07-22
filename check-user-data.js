// Load environment variables
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function checkUserData() {
  try {
    console.log('=== DATABASE CONNECTIVITY CHECK ===');
    
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('USERS IN DATABASE:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
    // Check related data for first user
    if (users.length > 0) {
      const userId = users[0].id;
      
      const timeTracking = await prisma.timeTracking.findMany({
        where: { userId },
        select: {
          date: true,
          totalSeconds: true,
          activeSeconds: true,
          idleSeconds: true,
          isActive: true
        },
        orderBy: { date: 'desc' },
        take: 5
      });
      
      const activities = await prisma.activity.findMany({
        where: { userId },
        select: {
          type: true,
          description: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log(`\nTIME TRACKING FOR ${users[0].name}:`);
      timeTracking.forEach(tt => {
        console.log(`- ${tt.date}: ${tt.totalSeconds}s total, ${tt.activeSeconds}s active, ${tt.idleSeconds}s idle`);
      });
      
      console.log(`\nRECENT ACTIVITIES FOR ${users[0].name}:`);
      activities.forEach(activity => {
        console.log(`- ${activity.type}: ${activity.description} (${activity.createdAt})`);
      });
    }
    
    console.log('\n=== DATABASE CONNECTIVITY: SUCCESS ===');
    
  } catch (error) {
    console.error('DATABASE ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
