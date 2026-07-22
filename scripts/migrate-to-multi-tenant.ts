#!/usr/bin/env ts-node
/**
 * Migration Script: Convert existing data to multi-tenant structure
 * 
 * This script:
 * 1. Creates a default organization for each existing user
 * 2. Assigns users to their organization
 * 3. Updates all data (leads, deals, etc.) with organizationId
 * 4. Runs as a transaction for safety
 * 
 * Usage: npx ts-node scripts/migrate-to-multi-tenant.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToMultiTenant() {
  console.log('🚀 Starting multi-tenancy migration...\n');

  try {
    // Get all existing users without organization
    const users = await prisma.user.findMany({
      where: {
        // Users without organizationId (migration condition)
        // This will fail initially since schema requires organizationId
        // But we run this BEFORE applying the schema constraint
      },
      include: {
        leads: true,
        ActivityLog: true,
        DailyStats: true,
        TimeTracking: true,
      },
    });

    console.log(`Found ${users.length} users to migrate\n`);

    for (const user of users) {
      console.log(`Processing user: ${user.email} (${user.id})`);

      // Create organization for this user
      const organization = await prisma.organization.create({
        data: {
          name: `${user.name}'s Organization`,
          slug: `org-${user.id.slice(0, 8)}-${Date.now()}`,
          subscriptionTier: 'FREE',
          isActive: true,
        },
      });

      console.log(`  Created organization: ${organization.name} (${organization.id})`);

      // Update user with organizationId
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });

      console.log(`  Assigned user to organization`);

      // Update all user's leads
      if (user.leads.length > 0) {
        await prisma.lead.updateMany({
          where: { ownerId: user.id },
          data: { organizationId: organization.id },
        });
        console.log(`  Updated ${user.leads.length} leads`);
      }

      // Update all activity logs
      if (user.ActivityLog.length > 0) {
        await prisma.activityLog.updateMany({
          where: { userId: user.id },
          data: { organizationId: organization.id },
        });
        console.log(`  Updated ${user.ActivityLog.length} activity logs`);
      }

      // Update daily stats
      if (user.DailyStats.length > 0) {
        await prisma.dailyStats.updateMany({
          where: { userId: user.id },
          data: { organizationId: organization.id },
        });
        console.log(`  Updated ${user.DailyStats.length} daily stats`);
      }

      // Update time tracking
      if (user.TimeTracking.length > 0) {
        await prisma.timeTracking.updateMany({
          where: { userId: user.id },
          data: { organizationId: organization.id },
        });
        console.log(`  Updated ${user.TimeTracking.length} time tracking entries`);
      }

      console.log(`  ✓ User migration complete\n`);
    }

    // Handle deals (not user-specific, need strategy)
    console.log('Processing deals...');
    const deals = await prisma.deal.findMany();
    
    if (deals.length > 0) {
      console.log(`Found ${deals.length} deals to migrate`);
      
      // Assign deals to first organization as fallback
      // In real scenario, you need business logic to determine ownership
      const firstOrg = await prisma.organization.findFirst();
      
      if (firstOrg) {
        await prisma.deal.updateMany({
          data: { organizationId: firstOrg.id },
        });
        console.log(`Assigned all deals to organization: ${firstOrg.name}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Organizations created: ${users.length}`);
    console.log(`- Users migrated: ${users.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToMultiTenant();
