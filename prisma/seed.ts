import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Starting Enterprise Seed Restoration...');
  
  // 1. Create or Get Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'fluentive-global' },
    update: {},
    create: {
      name: 'Fluentive Global',
      slug: 'fluentive-global',
      domain: 'fluentive.com'
    }
  });

  console.log(`✅ Organization created: ${org.id}`);

  // 2. Create Core Enterprise Users
  const password = await bcrypt.hash('123456', 10);
  
  const roles = ['admin', 'manager', 'sales', 'hr', 'finance', 'marketing'];
  const users = [];

  for (const role of roles) {
    const email = `${role}@fluentive.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} Director`,
        email,
        password,
        role: role as any,
        isActive: true,
        organizationId: org.id
      }
    });
    users.push(user);
    
    // Create Employee Profile if not exists
    const existingEmployee = await prisma.employee.findFirst({
      where: { userId: user.id }
    });

    if (!existingEmployee) {
      await prisma.employee.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          firstName: role.toUpperCase(),
          lastName: 'Director',
          email: user.email,
          position: `VP of ${role.toUpperCase()}`,
          status: 'ACTIVE',
          joinDate: new Date('2023-01-01')
        }
      });
    }
  }

  const salesUser = users.find(u => u.role === 'sales')!;
  const adminUser = users.find(u => u.role === 'admin')!;

  console.log('✅ Core Users & Employees generated.');

  // 3. Seed Marketing Campaigns (Simplified)
  const campaigns = [];
  for (let i = 0; i < 5; i++) {
    const c = await prisma.campaign.create({
      data: {
        organizationId: org.id,
        name: `Q${(i % 4) + 1} Growth Initiative ${2024 + Math.floor(i/4)}`,
        status: 'ACTIVE',
        budget: 5000 + Math.random() * 20000,
        spent: 4000 + Math.random() * 10000,
        leadsGenerated: Math.floor(50 + Math.random() * 150)
      }
    });
    campaigns.push(c);
  }
  console.log('✅ Marketing Campaigns generated.');

  // 4. Seed CRM Leads (120+)
  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
  for (let i = 0; i < 120; i++) {
    const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        userId: salesUser.id,
        name: `Enterprise Prospect ${i}`,
        email: `contact${i}@enterprise.com`,
        status: status as any,
        source: 'Organic',
        estimatedValue: 10000 + Math.floor(Math.random() * 90000),
        createdAt: randomDate(new Date(new Date().setMonth(new Date().getMonth() - 6)), new Date())
      }
    });

    // 5. If CONVERTED or QUALIFIED, create a Deal
    if (status === 'CONVERTED' || status === 'QUALIFIED') {
      const stage = status === 'CONVERTED' ? 'WON' : 'DISCOVERY';
      await prisma.deal.create({
        data: {
          organizationId: org.id,
          userId: salesUser.id,
          leadId: lead.id,
          title: `Project Implementation for ${lead.name}`,
          value: lead.estimatedValue,
          stage: stage as any,
          probability: stage === 'WON' ? 100 : 30,
          expectedCloseDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        }
      });
    }
  }
  console.log('✅ CRM Pipeline (Leads & Deals) generated.');

  // 6. Seed Finance (Invoices & Expenses)
  for (let i = 0; i < 40; i++) {
    const isPaid = Math.random() > 0.3;
    const issueDate = randomDate(new Date(new Date().setMonth(new Date().getMonth() - 6)), new Date());
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: `CUST-${i}`,
        clientName: `Enterprise Client ${i}`,
        number: `INV-${2024}-${1000 + i}`,
        status: isPaid ? 'PAID' : 'SENT',
        amount: 5000 + Math.floor(Math.random() * 45000),
        total: 5000 + Math.floor(Math.random() * 45000),
        issueDate,
        dueDate: new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        paidDate: isPaid ? new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000) : null
      }
    });

    await prisma.expense.create({
      data: {
        organizationId: org.id,
        category: 'OPEX',
        description: `Server & Operations ${i}`,
        amount: 1000 + Math.floor(Math.random() * 5000),
        status: 'PAID',
        date: issueDate
      }
    });
  }
  console.log('✅ Financial Ledgers generated.');

  // 7. Seed Time Tracking
  for (let i = 0; i < 7; i++) {
    const trackDate = new Date();
    trackDate.setDate(trackDate.getDate() - i);
    trackDate.setHours(0, 0, 0, 0);

    await prisma.timeTracking.create({
      data: {
        userId: adminUser.id,
        date: trackDate,
        loginTime: new Date(trackDate.getTime() + 8 * 60 * 60 * 1000),
        totalSeconds: 8 * 3600,
        activeSeconds: Math.floor((5 + Math.random() * 3) * 3600),
        idleSeconds: Math.floor(Math.random() * 3600),
        lastHeartbeat: new Date(trackDate.getTime() + 16 * 60 * 60 * 1000),
        ip: '127.0.0.1'
      }
    });
  }
  console.log('✅ Time Tracking sessions generated.');

  console.log('🚀 ENTERPRISE DATABASE RESTORATION COMPLETE!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
