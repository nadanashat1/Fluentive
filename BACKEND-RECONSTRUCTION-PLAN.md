# 🚀 BACKEND RECONSTRUCTION PLAN - FLUENTIVE
## 1:1 Migration from Express to Next.js API Routes

---

## 📊 CURRENT BACKEND ANALYSIS

### Existing Architecture (Backend Folder)
```
backend/
├── src/
│   ├── app.ts                    # Express app entry
│   ├── routes/
│   │   ├── auth.ts              # 14 auth endpoints
│   │   ├── leads.ts             # 20+ lead endpoints
│   │   ├── users.ts             # 7 user endpoints (admin)
│   │   ├── deals.ts             # 5 deal endpoints
│   │   ├── notifications.ts     # 4 notification endpoints
│   │   ├── timeTracking.ts      # 7 time tracking endpoints
│   │   ├── ai.ts                # AI features
│   │   ├── advancedAI.ts        # Advanced AI
│   │   ├── dashboard.ts         # Dashboard
│   │   └── ... (17 total route files)
│   ├── controllers/             # 30+ controllers
│   ├── middleware/
│   │   ├── auth.ts              # JWT protection
│   │   ├── permissions.ts       # RBAC system
│   │   ├── validate.ts          # Input validation
│   │   └── enhancedRateLimit.ts # Rate limiting
│   ├── services/                # Business logic
│   ├── config/
│   │   └── prisma.ts            # Prisma singleton
│   └── types/                   # TypeScript types
└── prisma/
    └── schema.prisma            # Database schema
```

### Critical Features to Preserve:
1. **Authentication System:**
   - JWT with HttpOnly cookies
   - Refresh tokens
   - 2FA (TOTP)
   - Account lockout (5 attempts)
   - Password reset flow

2. **RBAC (Role-Based Access Control):**
   - 40+ granular permissions
   - 4 roles: admin, sales_manager, sales, viewer
   - Middleware protection

3. **Lead Management:**
   - CRUD operations
   - Photo upload
   - Notes & attachments
   - Activity logs
   - Export to CSV

4. **Security:**
   - Rate limiting (6 tiers)
   - Input validation (Zod)
   - Helmet headers
   - CORS protection

---

## 🎯 RECONSTRUCTION STRATEGY

### Phase 1: Foundation Layer (Core Infrastructure)

#### 1.1 Database Layer (Already Exists ✅)
**Current:** `backend/src/config/prisma.ts`
**Target:** `src/lib/prisma.ts` (✅ Already done)

```typescript
// Singleton Prisma client - PRESERVE EXACTLY
const globalForPrisma = globalThis as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
});
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

#### 1.2 Authentication Middleware Migration
**Current:** `backend/src/middleware/auth.ts`
**Target:** `src/lib/server/middleware/auth.ts`

**MIGRATION NOTES:**
- Express `req.cookies` → Next.js `cookies()` from `next/headers`
- Express `req.headers.authorization` → Next.js `request.headers.get('authorization')`
- JWT verification logic stays EXACTLY the same
- User attachment to request → Return user from function

```typescript
// BEFORE (Express):
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
  next();
});

// AFTER (Next.js):
export async function protect(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value || 
                request.headers.get('authorization')?.split(' ')[1];
  const decoded = jwt.verify(token, env.JWT_SECRET);
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  return user;
}
```

#### 1.3 Permission Middleware Migration
**Current:** `backend/src/middleware/permissions.ts`
**Target:** `src/lib/server/middleware/permissions.ts`

**ALL 40 PERMISSIONS MUST BE PRESERVED:**
```typescript
export const Permissions = {
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  // ... all 40 permissions
  TWOFA_DISABLE: '2fa:disable'
} as const;

export const RolePermissions: Record<string, Permission[]> = {
  admin: [...Object.values(Permissions)],
  sales_manager: [...], // Exact permissions
  sales: [...],          // Exact permissions
  viewer: [...]          // Exact permissions
};
```

---

### Phase 2: API Routes Migration (Endpoint by Endpoint)

#### 2.1 Auth Routes (`/api/auth/*`)
**Source:** `backend/src/routes/auth.ts` (262 lines)

| Endpoint | Method | Controller | Status |
|----------|--------|------------|--------|
| /api/auth/register | POST | register | 🔴 NEEDS MIGRATION |
| /api/auth/login | POST | login | 🔴 NEEDS MIGRATION |
| /api/auth/me | GET | getMe | 🔴 NEEDS MIGRATION |
| /api/auth/logout | POST | logout | 🔴 NEEDS MIGRATION |
| /api/auth/refresh | POST | refresh | 🔴 NEEDS MIGRATION |
| /api/auth/updatedetails | PUT | updateDetails | 🔴 NEEDS MIGRATION |
| /api/auth/change-password | POST | changePassword | 🔴 NEEDS MIGRATION |
| /api/auth/forgotpassword | POST | forgotPassword | 🔴 NEEDS MIGRATION |
| /api/auth/resetpassword/:token | PUT | resetPassword | 🔴 NEEDS MIGRATION |
| /api/auth/2fa/enable | POST | enable2FA | 🔴 NEEDS MIGRATION |
| /api/auth/2fa/verify | POST | verify2FA | 🔴 NEEDS MIGRATION |
| /api/auth/2fa/disable | POST | disable2FA | 🔴 NEEDS MIGRATION |

**MIGRATION PATTERN:**
```typescript
// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { safeHandler } from '@/lib/server/safe-handler';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const { email, password } = await request.json();
    
    // EXACT logic from backend/src/controllers/auth.ts
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Handle login attempts, lockout, etc. (EXACT logic)
      return errorResponse('Invalid credentials', 401);
    }
    
    // Generate tokens
    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '30d' });
    
    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    return successResponse({ user, token });
  }, 'Auth Login');
}
```

#### 2.2 Lead Routes (`/api/leads/*`)
**Source:** `backend/src/routes/leads.ts` (283 lines)

| Endpoint | Method | Permission | Status |
|----------|--------|------------|--------|
| /api/leads | GET | LEAD_READ | 🔴 NEEDS MIGRATION |
| /api/leads | POST | LEAD_CREATE | 🔴 NEEDS MIGRATION |
| /api/leads/:id | GET | LEAD_READ | 🔴 NEEDS MIGRATION |
| /api/leads/:id | PUT | LEAD_UPDATE | 🔴 NEEDS MIGRATION |
| /api/leads/:id | DELETE | LEAD_DELETE | 🔴 NEEDS MIGRATION |
| /api/leads/stats | GET | ANALYTICS_VIEW | 🔴 NEEDS MIGRATION |
| /api/leads/export | GET | LEAD_EXPORT | 🔴 NEEDS MIGRATION |
| /api/leads/:id/photo | PUT | LEAD_UPLOAD_PHOTO | 🔴 NEEDS MIGRATION |
| /api/leads/:id/notes | GET/POST | NOTE_CREATE | 🔴 NEEDS MIGRATION |
| /api/leads/:id/attachments | GET/POST | LEAD_READ/UPDATE | 🔴 NEEDS MIGRATION |

**CRITICAL:** Lead controller has complex logic including:
- Owner-based filtering
- Status tracking
- Photo upload (multer → Next.js built-in)
- CSV export

#### 2.3 User Routes (`/api/users/*`)
**Source:** `backend/src/routes/users.ts` (165 lines)

All endpoints require admin role. Migration is straightforward CRUD.

#### 2.4 Deal Routes (`/api/deals/*`)
**Source:** `backend/src/routes/deals.ts` (20 lines)

Currently PUBLIC (no auth) - TEMPORARY according to comments.
**PRESERVE THIS BEHAVIOR** during migration, then add auth.

#### 2.5 Notification Routes (`/api/notifications/*`)
**Source:** `backend/src/routes/notifications.ts` (90 lines)

Uses websocket service for real-time notifications.
**CRITICAL:** Must preserve `sendNotification` service integration.

#### 2.6 Time Tracking Routes (`/api/time-tracking/*`)
**Source:** `backend/src/routes/timeTracking.ts` (40 lines)

Includes heartbeat endpoint called every minute from frontend.

---

### Phase 3: Service Layer Migration

#### 3.1 Services to Migrate:
1. **auth.service.ts** - Token generation, response formatting
2. **security.service.ts** - Password hashing, 2FA, encryption
3. **email.service.ts** - Email sending
4. **websocket.service.ts** - Real-time notifications
5. **audit.service.ts** - Audit logging
6. **activity.service.ts** - Activity tracking

#### 3.2 Utility Functions:
1. **errorResponse.ts** - Error formatting
2. **async.ts** - Async handler wrapper (NOT NEEDED in Next.js - use safeHandler)
3. **database.ts** - Safe DB calls
4. **safe.ts** - Input sanitization

---

### Phase 4: Validation Layer

**Source:** `backend/src/validations/schemas.ts`

**ALL ZOD SCHEMAS MUST BE PRESERVED:**
- registerSchema
- loginSchema
- leadCreateSchema
- leadUpdateSchema
- noteSchema
- userCreateSchema
- userUpdateSchema
- dealSchema

---

## 🔧 CRITICAL MIGRATION RULES

### Rule 1: NO Logic Changes
```diff
- // DON'T: Change business logic
- if (user.role === 'admin') { ... }
+ // DO: Preserve exact logic
+ if (req.user?.role !== 'admin') { ... } // Same condition, different syntax
```

### Rule 2: Preserve All Endpoints
```diff
- // DON'T: Skip endpoints
- "I'll just migrate the important ones"
+ // DO: Migrate ALL 50+ endpoints
+ Every single route in backend/src/routes/*.ts
```

### Rule 3: Maintain Security
```diff
- // DON'T: Remove security checks
- // skip auth for now
+ // DO: Keep all auth middleware
+ const user = await protect(request);
+ checkPermission(user, Permissions.LEAD_CREATE);
```

### Rule 4: Database Compatibility
```diff
- // DON'T: Change Prisma queries
- await prisma.lead.findMany({ where: { active: true } }) // NEW
+ // DO: Keep exact queries
+ await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }) // SAME as backend
```

---

## 📋 ENDPOINT MIGRATION CHECKLIST

### Auth (12 endpoints)
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] GET /api/auth/me
- [ ] POST /api/auth/logout
- [ ] POST /api/auth/refresh
- [ ] PUT /api/auth/updatedetails
- [ ] POST /api/auth/change-password
- [ ] POST /api/auth/forgotpassword
- [ ] PUT /api/auth/resetpassword/:token
- [ ] POST /api/auth/2fa/enable
- [ ] POST /api/auth/2fa/verify
- [ ] POST /api/auth/2fa/disable

### Leads (20 endpoints)
- [ ] GET /api/leads
- [ ] POST /api/leads
- [ ] GET /api/leads/stats
- [ ] GET /api/leads/export
- [ ] GET /api/leads/:id
- [ ] PUT /api/leads/:id
- [ ] DELETE /api/leads/:id
- [ ] PUT /api/leads/:id/photo
- [ ] GET /api/leads/:id/logs
- [ ] GET /api/leads/:id/notes
- [ ] POST /api/leads/:id/notes
- [ ] PUT /api/leads/:id/notes/:noteId
- [ ] DELETE /api/leads/:id/notes/:noteId
- [ ] GET /api/leads/:id/attachments
- [ ] POST /api/leads/:id/attachments
- [ ] DELETE /api/leads/:id/attachments/:attachmentId
- [ ] GET /api/leads/important-notes

### Users (7 endpoints)
- [ ] GET /api/users
- [ ] POST /api/users
- [ ] GET /api/users/:id
- [ ] PUT /api/users/:id
- [ ] DELETE /api/users/:id
- [ ] PUT /api/users/:id/unlock

### Deals (5 endpoints)
- [ ] GET /api/deals
- [ ] POST /api/deals
- [ ] GET /api/deals/:id
- [ ] PUT /api/deals/:id
- [ ] DELETE /api/deals/:id

### Notifications (4 endpoints)
- [ ] GET /api/notifications
- [ ] PATCH /api/notifications/:id/read
- [ ] PATCH /api/notifications/read-all
- [ ] DELETE /api/notifications/:id

### Time Tracking (7 endpoints)
- [ ] POST /api/time-tracking/heartbeat
- [ ] GET /api/time-tracking/my-time
- [ ] GET /api/time-tracking/all-time
- [ ] GET /api/time-tracking/active-users
- [ ] GET /api/time-tracking/page-views
- [ ] GET /api/time-tracking/activities
- [ ] POST /api/time-tracking/end-session

---

## 🚀 IMPLEMENTATION ORDER

### Week 1: Foundation
1. Migrate auth middleware
2. Migrate permission middleware
3. Migrate validation schemas
4. Test auth flow end-to-end

### Week 2: Core Features
1. Migrate all auth endpoints (12)
2. Migrate lead endpoints (20)
3. Migrate user endpoints (7)
4. Test with frontend

### Week 3: Secondary Features
1. Migrate deal endpoints (5)
2. Migrate notification endpoints (4)
3. Migrate time tracking endpoints (7)
4. Migrate remaining routes

### Week 4: Testing & Validation
1. Compare responses 1:1
2. Load testing
3. Security audit
4. Documentation update

---

## ✅ SUCCESS CRITERIA

- [ ] All 50+ endpoints respond identically
- [ ] JWT auth works with HttpOnly cookies
- [ ] 2FA flow works end-to-end
- [ ] RBAC permissions enforced
- [ ] File uploads work
- [ ] All tests pass
- [ ] Frontend connects without changes
- [ ] No breaking changes

---

## 🎯 FINAL ARCHITECTURE

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   ├── me/route.ts
│       │   ├── logout/route.ts
│       │   ├── refresh/route.ts
│       │   ├── change-password/route.ts
│       │   ├── forgotpassword/route.ts
│       │   ├── resetpassword/[token]/route.ts
│       │   └── 2fa/
│       │       ├── enable/route.ts
│       │       ├── verify/route.ts
│       │       └── disable/route.ts
│       ├── leads/
│       │   ├── route.ts (GET, POST)
│       │   ├── stats/route.ts
│       │   ├── export/route.ts
│       │   ├── [id]/route.ts (GET, PUT, DELETE)
│       │   ├── [id]/photo/route.ts
│       │   ├── [id]/notes/route.ts
│       │   ├── [id]/attachments/route.ts
│       │   └── important-notes/route.ts
│       ├── users/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/unlock/route.ts
│       ├── deals/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── notifications/
│       │   ├── route.ts
│       │   ├── [id]/read/route.ts
│       │   └── read-all/route.ts
│       └── time-tracking/
│           ├── heartbeat/route.ts
│           ├── my-time/route.ts
│           └── ...
├── lib/
│   └── server/
│       ├── middleware/
│       │   ├── auth.ts
│       │   ├── permissions.ts
│       │   └── validate.ts
│       ├── services/
│       │   ├── auth.service.ts
│       │   ├── security.service.ts
│       │   ├── email.service.ts
│       │   └── ...
│       └── utils/
│           ├── errorResponse.ts
│           └── safe.ts
└── validations/
    └── schemas.ts (Zod schemas)
```

---

**Ready to start reconstruction. This plan ensures ZERO feature loss.** 🚀
