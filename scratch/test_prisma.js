const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();

// Manual initialization for scratch script
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function testCreateLead() {
  try {
    const lead = await prisma.lead.create({
      data: {
        name: "Test Lead " + Date.now(),
        email: "test@example.com",
        phone: "123456789",
        status: "NEW",
        pipelineStage: "New Lead",
        source: "Website",
        estimatedValue: 1000,
        userId: "7d7a37a6-7d05-47fb-a85c-332efe4e7e81"
      }
    });
    console.log("Success! Lead created:", lead.id);
  } catch (error) {
    console.error("Failed to create lead:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateLead();
