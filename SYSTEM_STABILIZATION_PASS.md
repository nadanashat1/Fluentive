# 🚨 SYSTEM STABILIZATION PASS — Production Stability Mode

```
🚨 TASK: SYSTEM STABILIZATION PASS (PRODUCTION STABILITY ENGINEER MODE)

⚠️ ROLE CHANGE ALERT

You are NO LONGER a feature developer.
You are NOW a Production Stability Engineer.

Your ONLY goal: Make the system 100% stable and reliable.
Your job is NOT to add features or refactor.
Your job is to eliminate all instability.

═══════════════════════════════════════════════════════════════

🧠 RULE #1 — ABSOLUTE PRIORITIES (NO NEGOTIATION)

STOP DOING:
❌ Adding new features
❌ Refactoring for "cleaner code"
❌ Restructuring architecture
❌ Deleting files "that look unused"
❌ Rewriting working code

START DOING:
✅ Finding root causes of errors
✅ Applying minimal surgical fixes
✅ Verifying system-wide stability
✅ Testing end-to-end flows
✅ Ensuring zero breakage

═══════════════════════════════════════════════════════════════

🔍 STEP 1: FULL SYSTEM SCAN — CATEGORIZE ALL ISSUES

Run comprehensive scan and categorize:

COMMAND:
npm run build 2>&1 | tee /tmp/build.log
cd backend && npm run type-check 2>&1 | tee /tmp/backend.log

OUTPUT FORMAT (REQUIRED):
{
  "scanDate": "2024-01-15",
  "frontendIssues": {
    "total": 0,
    "byCategory": {
      "clientBoundary": [],      // Missing "use client"
      "hydrationMismatch": [],   // SSR issues
      "missingKeys": [],         // React key warnings
      "nullChecks": [],          // useState(null) issues
      "importErrors": []         // Module not found
    }
  },
  "backendIssues": {
    "total": 0,
    "byCategory": {
      "typeErrors": [],          // TypeScript errors
      "missingImports": [],      // Import issues
      "prismaErrors": [],        // DB connection issues
      "routeErrors": []          // Missing routes
    }
  },
  "integrationIssues": {
    "frontendToApi": [],         // API calls failing
    "corsIssues": [],            // CORS errors
    "authIntegration": []        // Auth flow broken
  },
  "buildIssues": {
    "typescript": [],            // TS compilation
    "webpack": [],               // Bundle issues
    "missingDeps": []            // Dependencies
  },
  "runtimeIssues": {
    "consoleErrors": [],         // Browser console
    "apiFailures": [],           // API 500s
    "performance": []            // Slow operations
  }
}

═══════════════════════════════════════════════════════════════

🧠 STEP 2: ROOT CAUSE ANALYSIS (NOT SYMPTOM FIXING)

FOR EACH ERROR CATEGORY, IDENTIFY ROOT CAUSE:

❌ WRONG:
"File X has error Y, I'll fix it"

✅ RIGHT:
"Files X, Y, Z all have similar error pattern
Root cause is Z
Fix Z once, all files are resolved"

EXAMPLE ROOT CAUSES:

1. Client/Server Boundary (Next.js)
   SYMPTOMS: useState errors, window undefined
   ROOT CAUSE: Next.js App Router defaults to Server Components
   FIX: Identify ALL files with hooks, add "use client" systematically

2. Import Path Migration
   SYMPTOMS: Cannot find module '@/lib/...'
   ROOT CAUSE: Paths changed in migration (@/lib → @/core)
   FIX: Global search/replace ALL wrong imports

3. Prisma Client Duplication
   SYMPTOMS: Connection errors, "too many clients"
   ROOT CAUSE: Multiple files creating new PrismaClient()
   FIX: Ensure ALL imports use singleton from @/core/prisma

4. Missing Route Registration
   SYMPTOMS: 404 on valid endpoints
   ROOT CAUSE: Routes not added to app.ts
   FIX: Verify ALL module routes registered in app.ts

═══════════════════════════════════════════════════════════════

⚡ STEP 3: NEXT.JS STABILITY LAYER

MUST VERIFY:

☑️ ALL Client Components have "use client"
   CHECK: grep -rn "useState\|useEffect\|useContext\|onClick\|onSubmit" src/app --include="*.tsx" | cut -d: -f1 | sort -u
   ACTION: Add "use client" to TOP of each file

☑️ NO hooks in Server Components
   CHECK: Files WITHOUT "use client" but WITH hooks
   ACTION: Move to client component OR refactor

☑️ NO hydration mismatches
   CHECK: Browser console for hydration warnings
   ACTION: Ensure server/client render same initial HTML

☑️ Proper error boundaries
   CHECK: Error boundaries around routes
   ACTION: Add error.tsx where missing

═══════════════════════════════════════════════════════════════

🔗 STEP 4: API SYSTEM STABILITY

VERIFY EVERY ENDPOINT:

RUN:
curl -s http://localhost:3000/api/health | jq .

MUST RETURN:
{ "status": "ok" }

THEN TEST EACH:
☑️ POST /api/auth/register → 200 + user object
☑️ POST /api/auth/login → 200 + token
☑️ GET /api/auth/me → 200 + user (with auth)
☑️ GET /api/leads → 200 + array
☑️ POST /api/leads → 201 + lead object
☑️ PUT /api/leads/:id → 200 + updated lead
☑️ DELETE /api/leads/:id → 200 + success
☑️ GET /api/users → 200 (admin only)
☑️ GET /api/dashboard/summary → 200
☑️ POST /api/time-tracking/heartbeat → 200

IF ANY FAILS → STOP, FIX, RETEST

═══════════════════════════════════════════════════════════════

🧱 STEP 5: BACKEND ARCHITECTURE VALIDATION

VERIFY STRUCTURE:

src/
├── modules/              [MUST: 14 directories]
│   ├── auth/            [4 files: controller, service, routes, validation]
│   ├── users/           [4 files]
│   ├── leads/           [4 files]
│   ├── deals/           [4 files]
│   ├── ai/              [4 files]
│   ├── notifications/   [4 files]
│   ├── time-tracking/   [4 files]
│   ├── dashboard/       [4 files]
│   ├── monitoring/      [4 files]
│   ├── activities/      [4 files]
│   ├── intelligence/    [4 files]
│   ├── evolution/       [4 files]
│   ├── advanced-ai/     [4 files]
│   └── maintenance/     [4 files]
├── core/                 [MUST: 4 files]
│   ├── prisma.ts        [Single Prisma instance]
│   ├── auth.ts          [JWT utilities]
│   ├── tenant.ts        [Tenant isolation]
│   └── safe-handler.ts  [Error wrapper]
├── middleware/           [3 files]
│   ├── auth.ts
│   ├── validate.ts
│   └── permissions.ts
├── app.ts               [Express app with ALL routes]
└── server.ts            [Server entry]

VERIFY COMMANDS:
ls src/modules/ | wc -l                    # Should be 14
ls src/core/                              # Should show 4 files
ls backend/ 2>/dev/null || echo "Clean"   # Should be empty
grep -c "app.use('/api" src/app.ts        # Should be 14+

═══════════════════════════════════════════════════════════════

🗄️ STEP 6: DATABASE STABILITY (PRISMA)

MUST VERIFY:

☑️ SINGLE PRISMA INSTANCE
   cat src/core/prisma.ts
   // Must export singleton, not new instance each time

☑️ NO DUPLICATE CLIENTS
   grep -rn "new PrismaClient" src/ --include="*.ts" | grep -v "core/prisma.ts"
   // Must return NOTHING

☑️ DATABASE CONNECTED
   npm run dev
   // Watch for: "Database connected successfully"

☑️ SCHEMA UP TO DATE
   npx prisma generate
   npx prisma db pull
   // No errors

☑️ ENV VAR SET
   grep DATABASE_URL .env
   // Must have value

═══════════════════════════════════════════════════════════════

🧪 STEP 7: FULL END-TO-END TEST (CRITICAL)

TEST COMPLETE USER JOURNEYS:

JOURNEY 1: Registration → Dashboard
1. Open browser → http://localhost:3000
2. Click "Register"
3. Fill: name, email, password, company
4. Submit
5. EXPECT: Redirect to dashboard
6. EXPECT: Dashboard shows data
7. EXPECT: No console errors

JOURNEY 2: Leads Full Lifecycle
1. Login
2. Navigate to Leads page
3. Click "Add Lead"
4. Fill lead info
5. Submit → EXPECT: Lead created
6. See lead in list
7. Click Edit
8. Change status
9. Save → EXPECT: Updated
10. Click Delete
11. Confirm → EXPECT: Removed
12. Verify not in list

JOURNEY 3: Auth Flow
1. Login
2. Copy token
3. Try accessing /api/users with user token
4. EXPECT: 403 Forbidden
5. Logout
6. Try accessing /api/leads without token
7. EXPECT: 401 Unauthorized

ALL MUST PASS WITHOUT ERRORS

═══════════════════════════════════════════════════════════════

⚡ STEP 8: BUILD STABILITY CHECK

RUN:
npm run build

MUST SEE:
✅ "Compiled successfully" or "Build completed"
✅ Exit code 0
✅ No TypeScript errors
✅ No "Module not found"
✅ No "Cannot resolve"

IF ERRORS:
1. Read FIRST error only
2. Identify root cause
3. Apply fix
4. Rebuild
5. Repeat until clean

═══════════════════════════════════════════════════════════════

🌐 STEP 9: DEPLOY STABILITY CHECK

DEPLOY TO VERCEL:
☑️ Deploy succeeds (green check)
☑️ Site loads
☑️ Login works
☑️ APIs respond
☑️ No 500 errors in logs

DEPLOY TO RENDER:
☑️ Service starts
☑️ Health check passes: /api/health
☑️ Database connected
☑️ APIs working

POST-DEPLOY TEST:
☑️ Register on production
☑️ Login on production
☑️ Create lead on production
☑️ No errors in logs

═══════════════════════════════════════════════════════════════

📡 STEP 10: HEALTH SYSTEM CHECK

VERIFY ENDPOINT EXISTS:

GET /api/health

MUST RETURN:
{
  "status": "stable",
  "system": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.0.0"
}

IF MISSING:
Create src/modules/health/health.routes.ts:
import { Router } from 'express';
const router = Router();

router.get('/api/health', (req, res) => {
  res.json({
    status: 'stable',
    system: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

export default router;

Register in app.ts:
import healthRoutes from './modules/health/health.routes';
app.use('/', healthRoutes);

═══════════════════════════════════════════════════════════════

🧹 STEP 11: SAFE CLEANUP ONLY

SAFE TO REMOVE:
☑️ Unused imports (verified not used)
☑️ console.log (keep console.error)
☑️ Commented code blocks
☑️ Broken temp files
☑️ old/, temp/, backup/ folders

NOT SAFE:
❌ Any file in src/modules/
❌ Any file in src/core/
❌ app.ts, server.ts
❌ Working API code
❌ Any feature

CLEANUP COMMANDS:
# Remove console.logs (not errors)
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '/console\.log/d'

# Remove empty folders
find src/ -type empty -delete

# Verify backend deleted
rm -rf backend/ 2>/dev/null || true

═══════════════════════════════════════════════════════════════

📊 STEP 12: FINAL STABILITY REPORT (MANDATORY)

Reply with EXACT JSON:

{
  "mode": "stabilization_pass",
  "scanDate": "2024-01-15",
  "systemStable": true,
  "rootCausesFixed": true,
  "categories": {
    "frontend": { "issuesFound": 0, "issuesFixed": 0, "status": "stable" },
    "backend": { "issuesFound": 0, "issuesFixed": 0, "status": "stable" },
    "integration": { "issuesFound": 0, "issuesFixed": 0, "status": "stable" },
    "build": { "issuesFound": 0, "issuesFixed": 0, "status": "stable" },
    "deploy": { "issuesFound": 0, "issuesFixed": 0, "status": "stable" }
  },
  "architecture": {
    "modulesCount": 14,
    "coreFiles": 4,
    "routesRegistered": true,
    "prismaSingleton": true,
    "backendDeleted": true,
    "structureValid": true
  },
  "tests": {
    "authFlow": "passed",
    "leadsCRUD": "passed",
    "dashboard": "passed",
    "apiIntegration": "passed",
    "endToEnd": "passed"
  },
  "buildStatus": "success",
  "deployStatus": {
    "vercel": "success",
    "render": "success"
  },
  "healthCheck": "ok",
  "remainingRisks": [],
  "recommendations": [],
  "readyForProduction": true
}

═══════════════════════════════════════════════════════════════

💥 FINAL INSTRUCTION — READ CAREFULLY

You are a Production Stability Engineer.

Your work is judged by:
✅ System stability (not code beauty)
✅ Zero errors (not refactoring)
✅ Working features (not new features)
✅ Reliable deploy (not clever code)

DO NOT:
❌ Refactor for "cleaner" code
❌ Add new features
❌ Delete working code
❌ Change architecture
❌ Make "improvements"

DO:
✅ Fix root causes
✅ Verify stability
✅ Test thoroughly
✅ Report honestly

═══════════════════════════════════════════════════════════════

🚀 POST-STABILIZATION OPTIONS

After this pass is complete and system is stable:

OPTION 1: LAUNCH PHASE
- First 100 users plan
- Production monitoring
- Support system

OPTION 2: GROWTH PHASE  
- Monetization setup
- Advanced features
- Performance optimization

OPTION 3: SCALE PHASE
- Database optimization
- Caching layer
- Load balancing

═══════════════════════════════════════════════════════════════

START SYSTEM STABILIZATION PASS NOW

NO FEATURE WORK. NO REFACTORING. ONLY STABILITY.

═══════════════════════════════════════════════════════════════
```

---

## 🎯 Quick Verification Commands

```bash
# Architecture check
echo "Modules:" && ls src/modules/ 2>/dev/null | wc -l
echo "Core files:" && ls src/core/ 2>/dev/null
echo "Backend deleted:" && ls backend/ 2>/dev/null || echo "Yes"
echo "Routes registered:" && grep -c "app.use('/api" src/app.ts 2>/dev/null

# Build check
npm run build 2>&1 | tail -5

# API health check
curl -s http://localhost:3000/api/health 2>/dev/null | jq .

# Prisma check
grep -rn "new PrismaClient" src/ --include="*.ts" 2>/dev/null | grep -v "core/prisma.ts" | wc -l
```

---

## 📊 Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Build errors | X | 0 |
| Runtime errors | X | 0 |
| API failures | X | 0 |
| Deploy status | X | Success |
| System health | X | Stable |

---

**Copy the code block above and send to Windsurf** 🚀
