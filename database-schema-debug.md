# 🔍 DATABASE SCHEMA DEBUG ANALYSIS

## **ROOT CAUSE IDENTIFIED**

### **Database Schema Mismatch Causing Service Failures**

**Error Message**: `Unknown argument 'ownerId'. Did you mean 'owner'? Available options are marked with ?`

**Root Cause**: The Lead model in Prisma schema uses `owner` relation field, but the service is trying to use `ownerId` scalar field.

## **SCHEMA ANALYSIS**

### **Prisma Lead Model (from schema.prisma)**
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
}
```

### **Service Code (leads.service.ts)**
```typescript
// Line 12: WHERE clause using ownerId
if (userRole !== 'admin') {
  where.ownerId = userId; // ❌ WRONG - should be where.owner = { id: userId }
}

// Line 28: Query using ownerId
prisma.lead.findMany({
  where, // ❌ Contains ownerId which doesn't exist
  include: {
    owner: { select: { name: true, email: true } } // ✅ CORRECT - uses relation
  }
})
```

## **EXACT PROBLEM IDENTIFIED**

### **Issue 1: Wrong Where Clause**
```typescript
// ❌ CURRENT (BROKEN)
where.ownerId = userId;

// ✅ CORRECT (FIX)
where.owner = { id: userId };
```

### **Issue 2: Missing Required Fields**
The service tries to create leads with fields that don't exist in schema:
```typescript
// ❌ Fields service tries to use (line 74-87)
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
  ownerId: userId                         // ❌ SHOULD BE userId (scalar field)
};
```

## **IMMEDIATE FIXES REQUIRED**

### **Fix 1: Correct Where Clause**
```typescript
// File: src/lib/server/services/leads.service.ts
// Line 12-16
if (userRole !== 'admin') {
  where.owner = { id: userId }; // ✅ USE RELATION
}

// Line 44-48
if (userRole !== 'admin') {
  where.owner = { id: userId }; // ✅ USE RELATION
}
```

### **Fix 2: Remove Non-Existent Fields**
```typescript
// File: src/lib/server/services/leads.service.ts
// Line 74-87 (createLead function)
const leadData = {
  name: data.name,
  email: data.email,
  phone: data.phone,
  status: data.status || 'NEW',      // ✅ USE LeadStatus ENUM
  userId: userId,                    // ✅ USE SCALAR FIELD
  // Remove: course, source, priority, photo, tags, followUpDate, lastFollowUp
};
```

## **EXPECTED OUTCOME AFTER FIXES**

### **Authentication**: ✅ Already working
### **Service Layer**: Should work after schema fixes
### **API Endpoints**: Should return 200 OK with data

## **NEXT STEPS**

1. **Fix where clauses** to use `owner = { id: userId }` instead of `ownerId = userId`
2. **Remove non-existent fields** from createLead function
3. **Update updateLead function** to use correct fields
4. **Test leads endpoint** with corrected service code
5. **Continue with full API testing** once service layer works

## **PRODUCTION READINESS IMPACT**

**Current Status**: Authentication working, database schema broken
**After Schema Fix**: Expected to improve to 70% (service layer working)
**Critical Priority**: Fix database schema mismatches to enable API testing
