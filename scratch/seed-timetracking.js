const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'yassin.mahmoud1236@gmail.com' }
  });
  console.log('User ID:', user?.id);
  
  if (user) {
    console.log('Creating time tracking for user...');
    
    // Clear old data
    await prisma.timeTracking.deleteMany({ where: { userId: user.id } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const isToday = i === 0;
      const hoursWorked = isToday ? 5 : 8;
      const totalSeconds = hoursWorked * 3600;
      
      const productivityRatio = 0.75;
      const activeSeconds = Math.floor(totalSeconds * productivityRatio);
      const idleSeconds = totalSeconds - activeSeconds;

      const loginTime = new Date(date);
      loginTime.setHours(9, 0, 0, 0);
      
      const lastActivity = new Date(loginTime.getTime() + totalSeconds * 1000);

      await prisma.timeTracking.create({
        data: {
          userId: user.id,
          date: date,
          loginTime: loginTime,
          totalSeconds: totalSeconds,
          activeSeconds: activeSeconds,
          idleSeconds: idleSeconds,
          isActive: isToday,
          isIdle: false,
          lastHeartbeat: lastActivity,
          lastActivity: lastActivity,
        }
      });
    }
    console.log('Done!');
  } else {
    console.log('User not found!');
  }
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); await pool.end(); });
