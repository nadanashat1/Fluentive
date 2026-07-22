# 🚨 BACKEND RECOVERY CHECKLIST
## Pre-Reconstruction Safety Protocol

---

## 📦 STEP 1: PACKAGE BACKEND FOR WINDSURF

### ✅ Required Files Checklist

Before sending to Windsurf, verify you have ALL of these:

```
backend/
├── package.json                    ✅ Has dependencies & scripts
├── package-lock.json              ✅ Lock file (critical for versions)
├── tsconfig.json                  ✅ TypeScript config
├── .env.example                   ✅ Template (NOT real .env)
├── .eslintrc.json                ✅ Linting rules (if exists)
├── .gitignore                     ✅ Ignore patterns
├── prisma/
│   ├── schema.prisma             ✅ Database schema (CRITICAL)
│   ├── migrations/               ✅ Migration files (all)
│   └── seed.ts / seed.js         ✅ Database seeding (if exists)
├── src/
│   ├── app.ts OR server.ts       ✅ Express entry point
│   ├── routes/                   ✅ ALL route files
│   │   ├── auth.ts              ✅ JWT, 2FA, login
│   │   ├── leads.ts             ✅ Lead CRUD
│   │   ├── users.ts             ✅ User management
│   │   ├── deals.ts             ✅ Deal management
│   │   ├── notifications.ts     ✅ Notifications
│   │   ├── timeTracking.ts      ✅ Time tracking
│   │   ├── ai.ts                ✅ AI features
│   │   └── ... (all others)     ✅
│   ├── controllers/              ✅ ALL controllers
│   │   ├── auth.ts
│   │   ├── leads.ts
│   │   ├── users.ts
│   │   └── ... (all)
│   ├── middleware/               ✅ ALL middleware
│   │   ├── auth.ts              ✅ JWT protection
│   │   ├── permissions.ts       ✅ RBAC
│   │   ├── validate.ts          ✅ Validation
│   │   └── enhancedRateLimit.ts ✅ Rate limiting
│   ├── services/                 ✅ Business logic
│   │   ├── auth.service.ts
│   │   ├── security.service.ts  ✅ Password, 2FA
│   │   ├── email.service.ts     ✅ Email sending
│   │   ├── websocket.ts         ✅ Real-time
│   │   ├── audit.service.ts     ✅ Audit logging
│   │   └── activity.service.ts  ✅ Activity tracking
│   ├── config/                   ✅ Config files
│   │   ├── prisma.ts            ✅ Prisma client
│   │   └── ...
│   ├── utils/                    ✅ Utilities
│   │   ├── errorResponse.ts     ✅ Error formatting
│   │   ├── safe.ts              ✅ Input sanitization
│   │   └── database.ts          ✅ Safe DB calls
│   ├── validations/              ✅ Zod schemas
│   │   └── schemas.ts           ✅ ALL schemas
│   └── types/                    ✅ TypeScript types
│       └── index.ts             ✅ Type definitions
└── scripts/                      ✅ Helper scripts (if any)
    ├── dev.sh
    ├── seed.ts
    └── ...
```

---

## 🔍 STEP 2: VERIFY CRITICAL FILES EXIST

Run this command in `backend/` folder:

```bash
# Check critical files exist
echo "=== Checking Critical Files ==="
test -f package.json && echo "✅ package.json" || echo "❌ package.json MISSING"
test -f prisma/schema.prisma && echo "✅ prisma/schema.prisma" || echo "❌ schema.prisma MISSING"
test -f src/app.ts && echo "✅ src/app.ts" || echo "❌ app.ts MISSING (check for server.ts)"
test -d src/routes && echo "✅ src/routes/" || echo "❌ routes folder MISSING"
test -d src/controllers && echo "✅ src/controllers/" || echo "❌ controllers folder MISSING"
test -d src/middleware && echo "✅ src/middleware/" || echo "❌ middleware folder MISSING"
test -f src/middleware/auth.ts && echo "✅ auth middleware" || echo "❌ auth.ts MISSING"
test -f src/routes/auth.ts && echo "✅ auth routes" || echo "❌ auth.ts routes MISSING"

echo ""
echo "=== Counting Endpoints ==="
find src/routes -name "*.ts" -type f | wc -l | xargs echo "Route files:"
grep -r "router\." src/routes/ | wc -l | xargs echo "Route definitions:"

echo ""
echo "=== Database Models ==="
grep -E "^model\s+\w+" prisma/schema.prisma | wc -l | xargs echo "Models in schema:"
```

**Expected Output:**
```
✅ package.json
✅ prisma/schema.prisma
✅ src/app.ts
✅ src/routes/
✅ src/controllers/
✅ src/middleware/
✅ auth middleware
✅ auth routes

Route files: 17
Route definitions: 55+
Models in schema: 15+
```

---

## 📋 STEP 3: CREATE BACKEND ZIP ARCHIVE

### Create Clean Archive (NO .env, node_modules, uploads)

```bash
# Navigate to backend folder
cd d:\Fluentive\Fluentive\backend

# Create zip excluding sensitive files
# Using PowerShell (Windows):
powershell -Command "& { 
    $exclude = @('node_modules', '.env', 'uploads', 'logs', '*.log', '.git');
    Compress-Archive -Path src,prisma,scripts,package.json,package-lock.json,tsconfig.json,.env.example,.eslintrc.json,.gitignore -DestinationPath ../backend-source.zip -Force
}"

# Check file size (should be 1-5MB, NOT 100MB+)
ls -lh ../backend-source.zip
```

**Archive Contents:**
- `src/` - All source code
- `prisma/` - Schema and migrations
- `scripts/` - Helper scripts
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `.env.example` - Environment template

**EXCLUDED (for security):**
- `.env` (contains secrets)
- `node_modules/` (too large, reinstallable)
- `uploads/` (user files)
- `logs/` (runtime logs)
- `.git/` (git history, use separate zip if needed)

---

## 📝 STEP 4: DOCUMENT KEY INFORMATION

### Create `BACKEND-INFO.md` for Windsurf:

```markdown
# Backend Information Document

## Project Overview
- **Name:** Fluentive CRM
- **Type:** SaaS Customer Relationship Management
- **Architecture:** Express.js + Prisma + PostgreSQL
- **Frontend:** Next.js (separate, connects via API)

## Critical Requirements
1. **Authentication:** JWT with HttpOnly cookies, 2FA (TOTP), account lockout
2. **RBAC:** 40+ permissions, 4 roles (admin, sales_manager, sales, viewer)
3. **Multi-tenant:** All data filtered by tenantId
4. **APIs:** 55+ endpoints (auth, leads, users, deals, notifications, time-tracking, AI)
5. **Security:** Rate limiting (6 tiers), input validation, audit logging
6. **Integrations:** OpenAI (AI features), Stripe (billing), Email service
7. **Real-time:** WebSocket notifications

## Database Models (from schema.prisma)
- User (auth, roles, lockout)
- Lead (main CRM entity)
- Deal (sales pipeline)
- Tenant (multi-tenancy)
- ActivityLog (audit trail)
- Notification (user alerts)
- TimeTracking (user activity)
- LeadNote, LeadAttachment, etc.

## Environment Variables Required
See .env.example in archive

## API Endpoints Summary
- Auth: 12 endpoints (register, login, 2FA, password reset)
- Leads: 17 endpoints (CRUD, notes, attachments, export)
- Users: 6 endpoints (admin only)
- Deals: 5 endpoints
- Notifications: 4 endpoints
- Time Tracking: 7 endpoints
- AI: 15+ endpoints
- Dashboard, Analytics, etc.

## Special Features to Preserve
1. Lead photo upload
2. CSV export
3. Activity logging
4. Real-time notifications
5. AI lead scoring
6. Account lockout (5 attempts)
7. Password reset flow
8. Audit trail

## Migration Target
Next.js App Router API Routes (/app/api/*)
- Same logic, different syntax
- Serverless compatible
- No Express dependency
```

Save this as: `d:\Fluentive\Fluentive\BACKEND-INFO.md`

---

## 🚀 STEP 5: SEND TO WINDSURF

### What to Upload:

1. **backend-source.zip** (source code)
2. **BACKEND-INFO.md** (documentation)
3. **Improved Prompt** (below)

---

## 📨 STEP 6: IMPROVED PROMPT FOR WINDSURF

Copy and paste this EXACTLY:

```
🚀 FLUENTIVE BACKEND REBUILD + RECOVERY (CRITICAL MISSION)

You are rebuilding a production SaaS backend from an existing legacy backend codebase. This is NOT a rewrite - it is a 1:1 reconstruction.

🎯 OBJECTIVE
Reconstruct a fully working, stable, production-ready Next.js backend with:
- ZERO loss of functionality
- FULL compatibility with existing frontend
- EXACT same API responses
- EXACT same authentication flow

⚠️ NON-NEGOTIABLE RULES (VIOLATION = REJECTION)
1. Do NOT remove or simplify any existing business logic
2. Do NOT break API contracts (same request/response shapes)
3. Do NOT rename endpoints (keep /api/auth/login exactly)
4. Do NOT change response shapes (JSON structure identical)
5. Preserve authentication exactly (JWT, cookies, 2FA, lockout)
6. Preserve database structure intent (Prisma schema logic)
7. Preserve AI + billing logic (OpenAI, Stripe integrations)
8. Maintain backward compatibility 100% (frontend must work unchanged)

📦 INPUT FILES (in uploaded archive)
- package.json - Dependencies and scripts
- prisma/schema.prisma - Database schema
- src/app.ts - Express entry point
- src/routes/*.ts - All API routes (17 files)
- src/controllers/*.ts - Business logic
- src/middleware/*.ts - Auth, permissions, validation
- src/services/*.ts - Helper services
- src/utils/*.ts - Utilities
- src/validations/*.ts - Zod schemas

🧱 TARGET ARCHITECTURE (MANDATORY)
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
│           ├── all-time/route.ts
│           ├── active-users/route.ts
│           ├── page-views/route.ts
│           ├── activities/route.ts
│           └── end-session/route.ts
├── lib/
│   └── server/
│       ├── middleware/
│       │   ├── auth.ts (JWT validation)
│       │   ├── permissions.ts (RBAC 40+ permissions)
│       │   └── validate.ts (Zod validation)
│       ├── services/
│       │   ├── auth.service.ts
│       │   ├── security.service.ts (password, 2FA)
│       │   ├── email.service.ts
│       │   ├── websocket.ts (real-time)
│       │   ├── audit.service.ts
│       │   └── activity.service.ts
│       └── utils/
│           ├── errorResponse.ts
│           ├── safe.ts
│           └── database.ts
└── validations/
    └── schemas.ts (Zod schemas)

🔐 MIGRATION PATTERN (FOLLOW EXACTLY)

Express Route:
```typescript
router.post('/login', validate(loginSchema), login);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ErrorResponse('Invalid credentials', 401);
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ErrorResponse('Invalid credentials', 401);
  sendTokenResponse(user, 200, res);
});
```

Next.js Route (MUST BE EQUIVALENT):
```typescript
// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { safeHandler, successResponse, errorResponse } from '@/lib/server/safe-handler';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const { email, password } = await request.json();
    
    // EXACT same logic from Express controller
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse('Invalid credentials', 401);
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorResponse('Invalid credentials', 401);
    
    // Generate token (same JWT logic)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    
    // Set HttpOnly cookie (Express → Next.js adaptation)
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

🧠 REQUIREMENTS BY MODULE

1. AUTHENTICATION (12 endpoints)
   - JWT with HttpOnly cookies
   - 2FA (TOTP) with speakeasy
   - Account lockout after 5 failed attempts
   - Password reset with email
   - Refresh token rotation
   - Role-based access (RBAC)

2. LEADS (17 endpoints)
   - CRUD operations with pagination
   - Photo upload (multer → Next.js built-in)
   - Notes and attachments
   - Activity logging
   - CSV export
   - Owner-based filtering
   - Tenant isolation

3. USERS (6 endpoints)
   - Admin-only management
   - Account unlock
   - Role assignment

4. DEALS (5 endpoints)
   - Sales pipeline
   - Stage management

5. NOTIFICATIONS (4 endpoints)
   - Real-time via WebSocket
   - Mark as read/unread
   - Delete notifications

6. TIME TRACKING (7 endpoints)
   - Heartbeat (1-minute intervals)
   - Session management
   - Activity tracking
   - Admin dashboard

7. AI MODULE (15+ endpoints)
   - Lead scoring
   - Smart suggestions
   - OpenAI integration (with timeout)
   - Revenue forecasting

🔐 SECURITY MANDATORY

1. JWT authentication on all routes (except login/register)
2. Role-based access control (40+ permissions)
3. Tenant isolation (tenantId filtering on ALL queries)
4. Rate limiting (6 tiers: standard, auth, heavy, admin, webhook, sensitive)
5. Input validation (Zod schemas from validations/schemas.ts)
6. Audit logging (all actions logged)
7. No data leakage between tenants

🗄️ DATABASE RULES

1. Prisma singleton pattern (src/lib/prisma.ts)
2. NO raw SQL outside core layer
3. ALL queries MUST include tenantId where clause
4. Proper error handling for DB failures
5. Connection pooling ready

⚡ STABILITY REQUIREMENTS

1. Wrap ALL APIs with safeHandler (try/catch wrapper)
2. Unified error responses (standard format)
3. Safe JSON responses (no circular references)
4. Timeout protection for external calls (8s default)
5. Graceful degradation on service failures

💰 BILLING PRESERVATION

1. Subscription logic (Stripe integration)
2. Plan limits enforcement
3. Usage tracking per tenant
4. Webhook handling

🤖 AI MODULE PRESERVATION

1. Lead scoring algorithm
2. Suggestion engine
3. AI chat endpoints
4. OpenAI integration with safe wrapper
5. Timeout and error handling

📡 DEPLOYMENT COMPATIBILITY

Must run on:
- Vercel (serverless functions)
- Render (Node.js)
- No Express dependency
- No in-memory state (serverless-safe)
- No long-running processes

🧪 DELIVERABLES

Return:
1. ✅ Clean modular backend structure
2. ✅ ALL 55+ endpoints working
3. ✅ Exact same API responses
4. ✅ Full auth flow working
5. ✅ All middleware migrated
6. ✅ All services migrated
7. ✅ All validations migrated
8. ✅ Prisma schema unchanged
9. ✅ No missing functionality
10. ✅ Production-ready code

🚨 TESTING CHECKLIST

Before declaring done:
- [ ] npm run build passes
- [ ] All endpoints respond correctly
- [ ] JWT auth works end-to-end
- [ ] 2FA setup works
- [ ] Account lockout works
- [ ] Password reset works
- [ ] File upload works
- [ ] CSV export works
- [ ] Real-time notifications work
- [ ] AI endpoints respond
- [ ] No console errors
- [ ] No TypeScript errors

💥 SUCCESS CRITERIA

This backend must be:
- Enterprise-grade
- Fully scalable
- Safe for production
- Zero breaking changes from original
- Frontend-compatible without changes

DO NOT START UNTIL YOU HAVE REVIEWED ALL INPUT FILES.
```

---

## ✅ STEP 7: POST-WINDSURF TESTING PROTOCOL

### 7.1 Build Test
```bash
cd d:\Fluentive\Fluentive

# Clean install
rm -rf node_modules package-lock.json
npm install

# Generate Prisma
npx prisma generate

# Build
npm run build

# Must show: " Compiled successfully"
# Must NOT show: "Build error" or "Type error"
```

### 7.2 API Smoke Test
```bash
# Start dev server
npm run dev

# In another terminal, test endpoints:

# 1. Health check
curl http://localhost:3000/api/health

# 2. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test123!"}'

# 3. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' \
  -c cookies.txt

# 4. Get current user
curl http://localhost:3000/api/auth/me \
  -b cookies.txt

# 5. Create lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Lead Test","email":"lead@test.com","phone":"1234567890","course":"Test","source":"Test"}'

# 6. List leads
curl http://localhost:3000/api/leads \
  -b cookies.txt

# 7. AI endpoint
curl http://localhost:3000/api/ai/prioritized-leads \
  -b cookies.txt

# All must return 200 or 201, NOT 500
```

### 7.3 Frontend Integration Test
```bash
# Start frontend (if separate)
npm run dev

# Test in browser:
# 1. Navigate to http://localhost:3000/login
# 2. Login with test credentials
# 3. Check dashboard loads
# 4. Create a lead
# 5. Check lead appears in list
# 6. Logout and login again
```

---

## 🔒 STEP 8: GIT SAFETY PROTOCOL (CRITICAL)

### After Windsurf Returns Working Backend:

```bash
# 1. Create production-stable branch
git checkout -b production-stable

# 2. Commit working backend
git add .
git commit -m "🎉 WORKING BACKEND: Reconstructed from legacy

- All 55+ endpoints migrated
- Authentication working (JWT, 2FA, lockout)
- RBAC permissions preserved (40+)
- Multi-tenant isolation active
- All tests passing
- Frontend compatible

Status: PRODUCTION READY
Backup of working state"

# 3. Push branch
git push origin production-stable

# 4. Protect main branch
echo "⚠️  MAIN BRANCH PROTECTION ACTIVE"
echo "Rules:"
echo "  ❌ No direct pushes to main"
echo "  ✅ All changes via Pull Request"
echo "  ✅ PR requires: build success + review"
echo "  ✅ Force push disabled"
```

### Workflow Rules (STRICT):

```
FORBIDDEN (Immediate Revert):
❌ git push origin main (direct push)
❌ git push --force (force push)
❌ git branch -D main (delete main)
❌ Delete backend/ folder without backup
❌ Merge without build check
❌ Commit without testing

REQUIRED:
✅ git checkout -b feature/name (branch first)
✅ npm run build (before commit)
✅ npm run test (if tests exist)
✅ PR review (before merge)
✅ Merge to production-stable first
✅ Then merge to main

EMERGENCY ONLY:
🚨 git revert HEAD (undo last commit)
🚨 git checkout production-stable -- . (restore from stable)
```

---

## 🎯 SUMMARY

### What You Have Now:
1. ✅ Complete backend analysis
2. ✅ File checklist (what to send Windsurf)
3. ✅ Verification commands
4. ✅ Improved prompt (production-grade)
5. ✅ Post-reconstruction testing protocol
6. ✅ Git safety workflow

### Next Actions:
1. **Verify** backend folder has all required files
2. **Create** zip archive (backend-source.zip)
3. **Send** to Windsurf with improved prompt
4. **Test** after Windsurf returns code
5. **Create** production-stable branch
6. **Protect** main branch

### Success Criteria:
- [ ] All 55+ endpoints work
- [ ] Build passes
- [ ] Frontend connects without changes
- [ ] production-stable branch created
- [ ] Main branch protected

**Ready to recover the backend safely! 🚀**
