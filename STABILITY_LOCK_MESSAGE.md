# 🚨 STABILITY LOCK MESSAGE — System-Wide Stabilization Pass

```
🚨 TASK: SYSTEM-WIDE STABILITY PASS (NOT PIECEMEAL FIXES)

⚠️ CRITICAL CONTEXT SWITCH

You have been fixing errors one by one.
This is INEFFICIENT and creates instability.

🛑 STOP: Individual file fixes
🚀 START: System-level stability pass

═══════════════════════════════════════════════════════════════

🧠 MANDATORY APPROACH: ROOT CAUSE > SYMPTOM

❌ WRONG APPROACH:
"File A has error X, I'll fix it"
"File B has error Y, I'll fix it"
"File C has error Z, I'll fix it"

✅ CORRECT APPROACH:
"All files have error pattern X — root cause is Y"
"Apply single fix to root cause Y"
"All 20 files are now fixed simultaneously"

═══════════════════════════════════════════════════════════════

🔁 STEP 1: FULL SYSTEM SCAN + GROUP ERRORS

Scan the ENTIRE project and GROUP errors by ROOT CAUSE:

RUN:
npm run build 2>&1 | tee build-errors.log

ANALYZE:
❶ Categorize all errors:
   - "useState null" errors → React/Next.js boundary issues
   - "key prop" warnings → Missing React keys
   - "Module not found" → Path/import issues
   - "prerender error" → Server/client mismatch
   - "Cannot find module" → Missing deps or wrong paths

❷ Identify ROOT CAUSES:
   Example: If 15 files have "useState" errors:
   → Root cause: Missing "use client" or SSR boundary issue
   → Global fix: Add directive or fix component architecture

❸ Create fix plan:
   - Fix #1 addresses root cause → fixes 15 files at once
   - Fix #2 addresses root cause → fixes 10 files at once

═══════════════════════════════════════════════════════════════

🧱 STEP 2: ARCHITECTURE RECHECK (MANDATORY)

Verify the system architecture is CORRECT:

PROJECT STRUCTURE CHECK:
```
src/
├── modules/              [14+ modules]
│   ├── auth/            ✓ login, register, JWT, 2FA
│   ├── users/           ✓ admin CRUD
│   ├── leads/           ✓ CRUD + notes + attachments
│   ├── deals/           ✓ pipeline
│   ├── ai/              ✓ analytics + dashboard
│   ├── notifications/   ✓ notifications + preferences
│   ├── time-tracking/   ✓ heartbeat + tracking
│   ├── dashboard/       ✓ summary
│   ├── monitoring/      ✓ health + metrics
│   └── ... (all others)
├── core/                 [4+ files]
│   ├── prisma.ts       ✓ Single Prisma instance
│   ├── auth.ts         ✓ JWT + auth utils
│   ├── tenant.ts       ✓ Tenant isolation
│   └── safe-handler.ts ✓ Error wrapper
├── middleware/           [3+ files]
│   ├── auth.ts         ✓ Auth middleware
│   ├── validate.ts     ✓ Validation middleware
│   └── permissions.ts  ✓ RBAC middleware
├── app.ts              ✓ Express app
└── server.ts           ✓ Server entry
```

VERIFY:
☑️ ls src/modules/ | wc -l → 14+ directories
☑️ ls src/core/ → prisma.ts, auth.ts, tenant.ts, safe-handler.ts
☑️ cat src/app.ts | grep "app.use('/api" → Shows all routes registered
☑️ ls backend/ 2>/dev/null → Should be EMPTY (deleted after migration)

═══════════════════════════════════════════════════════════════

⚡ STEP 3: GLOBAL FIX RULES (APPLY ONCE, FIX EVERYWHERE)

🔹 REACT / NEXT.JS — Server/Client Boundary

ROOT CAUSE: Next.js App Router defaults to Server Components
SYMPTOMS: "useState null", "window is not defined", "localStorage"

GLOBAL FIX PATTERN:

1. Identify all Client Components:
   grep -rn "useState\|useEffect\|useContext" src/app --include="*.tsx" | cut -d: -f1 | sort -u

2. Add directive to TOP of each:
   "use client";  // Must be FIRST line

3. For pages needing dynamic import:
   import dynamic from 'next/dynamic';
   const Component = dynamic(() => import('./Component'), { ssr: false });

DO NOT: Add "use client" to files without hooks
DO: Add only where React hooks exist

---

🔹 API ROUTES — Verify All Exist

ROOT CAUSE: Routes not registered in app.ts
SYMPTOMS: 404 errors, "API not found"

GLOBAL FIX:

1. Check app.ts:
   grep "app.use('/api" src/app.ts

2. Verify all modules register routes:
   ☑️ app.use('/api/auth', authRoutes);
   ☑️ app.use('/api/leads', leadRoutes);
   ☑️ app.use('/api/users', userRoutes);
   ☑️ app.use('/api/ai', aiRoutes);
   ☑️ app.use('/api/time-tracking', timeTrackingRoutes);
   ☑️ app.use('/api/dashboard', dashboardRoutes);
   ☑️ ... (all others)

3. If any missing → Add registration in app.ts

---

🔹 PRISMA — Single Instance

ROOT CAUSE: Multiple PrismaClient instances
SYMPTOMS: "too many clients", connection errors

GLOBAL FIX:

1. Check src/core/prisma.ts exists:
   import { PrismaClient } from '@prisma/client';
   
   const globalForPrisma = global as unknown as { prisma: PrismaClient };
   export const prisma = globalForPrisma.prisma || new PrismaClient();
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

2. Check NO other files create PrismaClient:
   grep -rn "new PrismaClient" src/ --include="*.ts" | grep -v "core/prisma.ts"
   // If any found → Replace with import { prisma } from '@/core/prisma';

---

🔹 IMPORT PATHS — Verify Aliases

ROOT CAUSE: Wrong tsconfig paths
SYMPTOMS: "Cannot find module '@/lib/...'"

GLOBAL FIX:

1. Check tsconfig.json paths:
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"],
         "@/core/*": ["./src/core/*"],
         "@/modules/*": ["./src/modules/*"]
       }
     }
   }

2. Update broken imports:
   ❌ import { prisma } from '@/lib/prisma';
   ✅ import { prisma } from '@/core/prisma';

═══════════════════════════════════════════════════════════════

🧪 STEP 4: FULL SYSTEM TEST (END-TO-END FLOWS)

Test COMPLETE user journeys, NOT individual functions:

JOURNEY 1: Auth Flow
☑️ Register new account
☑️ Login with credentials
☑️ Access protected page
☑️ Logout
☑️ Try accessing protected page (should redirect)

JOURNEY 2: Leads Management
☑️ Login
☑️ Navigate to leads page
☑️ Create new lead
☑️ View leads list (lead appears)
☑️ Edit lead details
☑️ Delete lead
☑️ Verify lead removed

JOURNEY 3: AI Features
☑️ Login
☑️ Navigate to AI dashboard
☑️ Request AI insights
☑️ View prioritized leads

JOURNEY 4: Time Tracking
☑️ Login
☑️ Heartbeat API responds
☑️ User time tracking works

ALL JOURNEYS MUST COMPLETE SUCCESSFULLY

═══════════════════════════════════════════════════════════════

🚨 STEP 5: ZERO BREAKAGE POLICY (NON-NEGOTIABLE)

ALLOWED:
✅ Add missing imports
✅ Add types/interfaces
✅ Add null checks (?.)
✅ Add error handling (try/catch)
✅ Add "use client" directive
✅ Fix import paths
✅ Add missing exports

FORBIDDEN:
❌ Delete any files
❌ Delete any functions
❌ Delete any components
❌ Delete any APIs
❌ Rewrite entire files
❌ Refactor "while I'm at it"
❌ Change URLs
❌ Change response formats

═══════════════════════════════════════════════════════════════

📦 STEP 6: BUILD + DEPLOY VALIDATION

BUILD CHECK:
npm run build

MUST:
✅ Exit code 0
✅ No TypeScript errors
✅ No "Module not found"
✅ No syntax errors
✅ dist/ or .next/ folder created

DEPLOY CHECK:

VERCEL:
☑️ Deploy succeeds
☑️ Site loads
☑️ Login works
☑️ No 500 errors in logs

RENDER:
☑️ Service starts
☑️ Health check: /api/health
☑️ APIs respond
☑️ Database connected

═══════════════════════════════════════════════════════════════

🔍 STEP 7: FINAL SYSTEM REPORT (MANDATORY)

Reply with EXACT format:

{
  "stabilityPass": true,
  "scanDate": "2024-01-15",
  "rootCausesFixed": [
    {
      "cause": "Missing 'use client' in React components",
      "filesAffected": 15,
      "fixApplied": "Added directive to all client components",
      "status": "resolved"
    },
    {
      "cause": "Wrong import paths after migration",
      "filesAffected": 8,
      "fixApplied": "Updated @/lib/* to @/core/*",
      "status": "resolved"
    }
  ],
  "architectureVerification": {
    "modulesCount": 14,
    "coreFiles": 4,
    "routesRegistered": true,
    "prismaSingleton": true,
    "backendDeleted": true
  },
  "systemTests": {
    "authFlow": "passed",
    "leadsCRUD": "passed",
    "aiFeatures": "passed",
    "timeTracking": "passed"
  },
  "build": {
    "status": "success",
    "errors": 0,
    "warnings": 0
  },
  "deploy": {
    "vercel": "success",
    "render": "success",
    "healthCheck": "ok"
  },
  "remainingIssues": [],
  "systemHealth": "stable",
  "readyForProduction": true
}

═══════════════════════════════════════════════════════════════

💥 CRITICAL INSTRUCTION

DO NOT:
❌ Fix files one by one
❌ Apply band-aid solutions
❌ Ignore architecture issues

DO:
✅ Analyze error patterns
✅ Fix root causes
✅ Verify entire system
✅ Report full status

═══════════════════════════════════════════════════════════════

START SYSTEM STABILITY PASS NOW

═══════════════════════════════════════════════════════════════
```

---

## 🚀 Quick System Check Commands

```bash
# 1. Count modules
ls src/modules/ 2>/dev/null | wc -l

# 2. Check core files
ls src/core/ 2>/dev/null

# 3. Check routes registered
grep "app.use('/api" src/app.ts 2>/dev/null

# 4. Check old backend deleted
ls backend/ 2>/dev/null || echo "✅ backend deleted"

# 5. Build test
npm run build 2>&1 | tail -20

# 6. Find all client components
grep -rl "useState\|useEffect" src/app --include="*.tsx" 2>/dev/null

# 7. Check Prisma imports
grep -rn "new PrismaClient" src/ --include="*.ts" 2>/dev/null | grep -v "core/prisma.ts"
```

---

## 📊 Success Criteria

| Metric | Target |
|--------|--------|
| Modules in src/modules/ | 14+ |
| Core files | 4+ |
| Build errors | 0 |
| System tests passed | 4/4 |
| Deploy status | Success |
| System health | Stable |

---

**Copy the code block above and send to Windsurf** 🚀
