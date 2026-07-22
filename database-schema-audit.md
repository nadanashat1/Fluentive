# 🔍 DATABASE SCHEMA AUDIT

## **PRISMA SCHEMA ANALYSIS**

### **Current Schema Structure**

#### **User Model**
```prisma
model User {
  id         String     @id @default(uuid())
  name       String
  email      String     @unique
  password   String
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  isActive   Boolean    @default(true)
  isDeleted  Boolean    @default(false)
  deletedAt  DateTime?
  role       UserRole   @default(SALES)
  activities Activity[]
  deals      Deal[]
  leads      Lead[]
}
```

#### **Lead Model**
```prisma
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
```

#### **Deal Model**
```prisma
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
  @@index([userId, createdAt])
}
```

---

## **🔍 SCHEMA MISMATCHES IDENTIFIED**

### **1. Missing User Fields**
**Problem**: Services expect security fields that don't exist

**Missing Fields**:
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginAttemptCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockUntil" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organization" TEXT;
```

### **2. Lead Service Mismatches**
**Problem**: Service tries to use non-existent fields

**Issues Found**:
```typescript
// ❌ NON-EXISTENT FIELDS IN SERVICE
const leadData = {
  name: data.name,
  email: data.email || `${Date.now()}@placeholder.com`,
  phone: data.phone || '0000000000',
  course: data.course || 'General',           // ❌ NOT IN SCHEMA
  source: data.source || 'api',             // ❌ NOT IN SCHEMA
  status: data.status || 'new',             // ❌ SHOULD USE LeadStatus ENUM
  priority: data.priority || 'medium',       // ❌ NOT IN SCHEMA
  photo: data.photo || null,                // ❌ NOT IN SCHEMA
  tags: data.tags || [],                   // ❌ NOT IN SCHEMA
  followUpDate: data.followUpDate || null,  // ❌ NOT IN SCHEMA
  lastFollowUp: data.lastFollowUp || null,  // ❌ NOT IN SCHEMA
  ownerId: userId                         // ❌ SHOULD BE userId
};
```

### **3. Deal Service Mismatches**
**Problem**: Deal service expects different field names

**Issues Found**:
```typescript
// ❌ FIELD NAME MISMATCHES
const deal = await prisma.deal.create({
  data: {
    clientName: body.clientName,        // ❌ NOT IN SCHEMA
    clientEmail: body.clientEmail,      // ❌ NOT IN SCHEMA
    clientPhone: body.clientPhone,      // ❌ NOT IN SCHEMA
    company: body.company,              // ❌ NOT IN SCHEMA
    source: body.source,                // ❌ NOT IN SCHEMA
    dealValue: body.dealValue ? parseFloat(body.dealValue) : null, // ❌ SHOULD BE 'value'
    timeline: body.timeline,            // ❌ NOT IN SCHEMA
    stage: body.stage || 'qualification', // ✅ CORRECT
    priority: body.priority || 'warm',   // ❌ NOT IN SCHEMA
    assigneeName: body.assigneeName,    // ❌ NOT IN SCHEMA
    course: body.course,               // ❌ NOT IN SCHEMA
    internalNotes: body.internalNotes,   // ❌ NOT IN SCHEMA
    followUpDate: body.followUpDate ? new Date(body.followUpDate) : null // ❌ NOT IN SCHEMA
  }
});
```

---

## **🔧 IMMEDIATE FIXES REQUIRED**

### **1. Update User Model**
```prisma
model User {
  id         String     @id @default(uuid())
  name       String
  email      String     @unique
  password   String
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  isActive   Boolean    @default(true)
  isDeleted  Boolean    @default(false)
  deletedAt  DateTime?
  role       UserRole   @default(SALES)
  
  // ✅ ADD MISSING FIELDS
  twoFactorEnabled Boolean    @default(false)
  twoFactorSecret TEXT?
  loginAttemptCount Integer    @default(0)
  lockUntil DateTime?
  organization  String?
  
  activities Activity[]
  deals      Deal[]
  leads      Lead[]
}
```

### **2. Fix Lead Service**
```typescript
// ✅ CORRECTED SERVICE
const leadData = {
  name: data.name,
  email: data.email || `${Date.now()}@placeholder.com`,
  phone: data.phone || '0000000000',
  status: data.status || 'NEW',      // ✅ USE LeadStatus ENUM
  userId: userId                    // ✅ USE SCALAR FIELD
  // ❌ REMOVE: course, source, priority, photo, tags, followUpDate, lastFollowUp
};
```

### **3. Fix Deal Service**
```typescript
// ✅ CORRECTED SERVICE
const deal = await prisma.deal.create({
  data: {
    title: body.title,                    // ✅ CORRECT FIELD NAME
    value: body.value ? parseFloat(body.value) : null, // ✅ CORRECT FIELD NAME
    stage: body.stage || 'OPEN',          // ✅ CORRECT
    userId: userId,                        // ✅ CORRECT
    leadId: body.leadId,                  // ✅ CORRECT
    // ❌ REMOVE: clientName, clientEmail, clientPhone, company, source, dealValue, timeline, priority, assigneeName, course, internalNotes, followUpDate
  }
});
```

---

## **📊 SCHEMA AUDIT SUMMARY**

### **Critical Issues Found**: 12
- **User Model**: 5 missing fields (2FA, security, organization)
- **Lead Service**: 8 non-existent field references
- **Deal Service**: 9 non-existent field references
- **Type System**: Multiple interface mismatches

### **Migration Requirements**
```sql
-- User Model Additions
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginAttemptCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockUntil" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organization" TEXT;
```

### **Service Corrections Required**
- Fix leads.service.ts field references
- Fix deals.service.ts field references  
- Update all service type definitions
- Align with actual Prisma schema

---

## **🎯 NEXT STEPS**

1. **Generate Prisma migration** with schema fixes
2. **Update service files** to use correct field names
3. **Test all services** after schema fixes
4. **Verify type safety** across all services
5. **Complete remaining API testing** with working services

**Priority**: CRITICAL - Schema fixes required before any further API testing can succeed.
