const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ORG_ID = '839d3f62-75f2-4f21-85b7-d8e61e416849';
const USER_ID = '01ae41d6-2bf9-4c70-b4f0-955697429015';

async function main() {
  console.log('Clearing existing dashboard data for org:', ORG_ID);
  
  // Clean up in reverse order of dependencies
  await prisma.deal.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.lead.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.invoice.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.employee.deleteMany({ where: { organizationId: ORG_ID } });
  await prisma.campaign.deleteMany({ where: { organizationId: ORG_ID } });

  console.log('Seeding fresh dashboard data...');

  // 1. Create some Leads
  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
  const leadIds = [];
  for (let i = 0; i < 30; i++) {
    const lead = await prisma.lead.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: ORG_ID,
        userId: USER_ID,
        name: `Client Lead ${i}`,
        email: `lead${i}@example.com`,
        status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)],
        source: ['LinkedIn', 'Google', 'Referral', 'Event'][Math.floor(Math.random() * 4)],
        estimatedValue: Math.floor(Math.random() * 5000),
      }
    });
    leadIds.push(lead.id);
  }

  // 2. Create some Deals
  const dealStages = ['DISCOVERY', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  for (let i = 0; i < 15; i++) {
    await prisma.deal.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: ORG_ID,
        userId: USER_ID,
        leadId: leadIds[Math.floor(Math.random() * leadIds.length)],
        title: `Enterprise Solution Deal ${i}`,
        value: Math.floor(Math.random() * 50000) + 10000,
        stage: dealStages[Math.floor(Math.random() * dealStages.length)],
        probability: Math.floor(Math.random() * 100),
        expectedCloseDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      }
    });
  }

  // 3. Create some Invoices (Revenue)
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    await prisma.invoice.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: ORG_ID,
        number: `INV-2026-${i}-${Math.floor(Math.random()*1000)}`,
        amount: Math.floor(Math.random() * 20000) + 5000,
        total: Math.floor(Math.random() * 20000) + 5000,
        clientName: `Partner ${i}`,
        status: 'PAID',
        issueDate: date,
        dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
      }
    });
  }

  // 4. Create some Employees
  for (let i = 0; i < 12; i++) {
    await prisma.employee.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: ORG_ID,
        firstName: `TeamMember`,
        lastName: `${i}`,
        email: `tm${i}@fluentive.com`,
        status: 'ACTIVE',
        position: ['Sales Rep', 'Software Engineer', 'Marketing Manager', 'HR Specialist'][Math.floor(Math.random() * 4)],
      }
    });
  }

  // 5. Create some Campaigns
  for (let i = 0; i < 3; i++) {
    await prisma.campaign.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: ORG_ID,
        name: `Q2 Performance Campaign ${i}`,
        status: 'ACTIVE',
        budget: 5000,
        spent: Math.floor(Math.random() * 4000) + 1000,
        leadsGenerated: Math.floor(Math.random() * 100) + 20,
      }
    });
  }

  console.log('Seeding complete! Dashboard should now be fully populated.');
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); await pool.end(); });
