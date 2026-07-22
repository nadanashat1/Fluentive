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

async function setupSalesPipeline() {
  try {
    console.log('=== SALES PIPELINE SETUP ===');
    
    // Check if there are any deals in the database
    const deals = await prisma.deal.findMany({
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        createdAt: true
      },
      take: 5
    });
    
    console.log('DEALS IN DATABASE:', deals.length);
    deals.forEach(deal => {
      console.log(`- ${deal.title} - Stage: ${deal.stage} - Value: ${deal.value || 'N/A'}`);
    });
    
    if (deals.length === 0) {
      console.log('No deals found. Creating sample deals...');
      
      // Create some sample deals for testing
      const testUser = await prisma.user.findFirst({
        where: { email: 'yassin.mahmoud12367@gmail.com' },
        select: { id: true }
      });
      
      if (testUser) {
        // First create some leads for the deals
        const leads = await prisma.lead.createMany({
          data: [
            {
              name: 'John Smith',
              email: 'john@techcorp.com',
              company: 'Tech Corp',
              status: 'qualified',
              userId: testUser.id
            },
            {
              name: 'Sarah Johnson',
              email: 'sarah@marketingsolutions.com',
              company: 'Marketing Solutions',
              status: 'converted',
              userId: testUser.id
            },
            {
              name: 'Mike Davis',
              email: 'mike@startup.com',
              company: 'Startup Inc',
              status: 'qualified',
              userId: testUser.id
            }
          ]
        });

        // Get the created leads
        const createdLeads = await prisma.lead.findMany({
          where: { userId: testUser.id },
          take: 3
        });

        // Create deals linked to leads
        const sampleDeals = await prisma.deal.createMany({
          data: [
            {
              title: 'Advanced Sales Training - John Smith',
              value: 5000,
              stage: 'OPEN',
              leadId: createdLeads[0].id,
              userId: testUser.id
            },
            {
              title: 'Sales Fundamentals - Sarah Johnson',
              value: 3500,
              stage: 'WON',
              leadId: createdLeads[1].id,
              userId: testUser.id
            },
            {
              title: 'Enterprise Sales - Mike Davis',
              value: 10000,
              stage: 'OPEN',
              leadId: createdLeads[2].id,
              userId: testUser.id
            }
          ]
        });
        
        console.log('✅ SAMPLE DEALS CREATED:', sampleDeals.count);
      }
    }
    
    console.log('\n=== SALES PIPELINE: READY ===');
    
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSalesPipeline();
