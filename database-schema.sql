generator client {
  provider      = "prisma-client-js"
  output        = "../node_modules/.prisma/client"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String     @id @default(uuid())
  name              String
  email             String     @unique
  password          String
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  isActive          Boolean    @default(true)
  isDeleted         Boolean    @default(false)
  deletedAt         DateTime?
  role              UserRole   @default(SALES)
  lockUntil         DateTime?
  loginAttemptCount Int        @default(0)
  organization      String?
  twoFactorEnabled  Boolean    @default(false)
  twoFactorSecret   String?
  activities        Activity[]
  deals             Deal[]
  leads             Lead[]
}

model Lead {
  id         String     @id @default(uuid())
  name       String
  phone      String
  email      String
  status     LeadStatus @default(NEW)
  userId     String
  isDeleted  Boolean    @default(false)
  deletedAt  DateTime?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  activities Activity[]
  deals      Deal[]
  owner      User       @relation(fields: [userId], references: [id])

  @@index([email])
  @@index([name])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([userId, status])
  @@index([userId, createdAt])
}

model Deal {
  id         String     @id @default(uuid())
  title      String
  value      Float?
  stage      DealStage  @default(OPEN)
  userId     String
  leadId     String
  isDeleted  Boolean    @default(false)
  deletedAt  DateTime?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  activities Activity[]
  lead       Lead       @relation(fields: [leadId], references: [id])
  owner      User       @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([leadId])
  @@index([stage])
  @@index([createdAt])
  @@index([userId, stage])
  @@index([leadId, createdAt])
}

model Activity {
  id          String    @id @default(uuid())
  type        String
  description String?
  userId      String?
  leadId      String?
  dealId      String?
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  deal        Deal?     @relation(fields: [dealId], references: [id])
  lead        Lead?     @relation(fields: [leadId], references: [id])
  user        User?     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([leadId])
  @@index([dealId])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@index([leadId, createdAt])
  @@index([dealId, createdAt])
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  LOST
}

enum DealStage {
  OPEN
  WON
  LOST
}

enum UserRole {
  USER
  SALES
  MANAGER
  ADMIN
}

enum SubscriptionTier {
  FREE
  STARTER
  PRO
  ENTERPRISE
}


