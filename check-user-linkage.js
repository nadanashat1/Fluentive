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

async function checkUserSpecificData() {
  try {
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      select: { id: true, name: true, email: true }
    });
    
    if (testUser) {
      console.log('=== USER-SPECIFIC DATA CHECK ===');
      console.log('User:', testUser.name, '(', testUser.email, ')');
      
      const timeTracking = await prisma.timeTracking.findMany({
        where: { userId: testUser.id },
        orderBy: { date: 'desc' },
        take: 3
      });
      
      const activities = await prisma.activity.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log('\nTIME TRACKING RECORDS:', timeTracking.length);
      timeTracking.forEach(tt => {
        console.log(`- ${tt.date}: ${tt.totalSeconds}s total, Active: ${tt.isActive}`);
      });
      
      console.log('\nRECENT ACTIVITIES:', activities.length);
      activities.forEach(activity => {
        console.log(`- ${activity.type}: ${activity.description}`);
      });
      
      console.log('\n=== DATA LINKAGE: SUCCESS ===');
    }
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSpecificData();
