# 🚀 COMPLETE SCAN + MIGRATION MESSAGE — Send to Windsurf

```
🚀 TASK: FULL BACKEND SCAN + COMPLETE MIGRATION TO NEW ARCHITECTURE

⚠️ START BY SCANNING — DO NOT CODE UNTIL SCAN COMPLETE

═══════════════════════════════════════════════════════════════

🔍 STEP 1: FULL BACKEND SCAN (MANDATORY)

Scan the ENTIRE backend/ directory. Find every file.

Command to start:
find backend/ -type f -name "*.ts" | sort

Categories to find:
☑️ All route files (*.routes.ts, *Route*.ts, router files)
☑️ All controllers (*controller*.ts)
☑️ All services (*service*.ts)
☑️ All middleware (*middleware*.ts)
☑️ All database queries (prisma calls)
☑️ All utility functions (utils/, helpers/)
☑️ All config files

REQUIRED OUTPUT — Reply with this JSON:

{
  "scanSummary": {
    "totalFiles": 0,
    "routesFiles": [],
    "controllerFiles": [],
    "serviceFiles": [],
    "middlewareFiles": [],
    "utilFiles": [],
    "configFiles": []
  },
  "endpointsFound": [
    {
      "method": "GET",
      "path": "/api/example",
      "sourceFile": "backend/src/routes/example.ts",
      "newLocation": "src/modules/example/routes.ts"
    }
  ],
  "modulesDetected": [
    "auth", "users", "leads", "deals", "ai", "notifications", "time-tracking"
  ]
}

═══════════════════════════════════════════════════════════════

🗺️ STEP 2: MAP OLD FILES → NEW ARCHITECTURE

Create this mapping table:

OLD FILE → NEW LOCATION
--------------------------------------------------
backend/src/routes/auth.ts → src/modules/auth/auth.routes.ts
backend/src/routes/leads.ts → src/modules/leads/leads.routes.ts
backend/src/routes/users.ts → src/modules/users/users.routes.ts
backend/src/routes/deals.ts → src/modules/deals/deals.routes.ts
backend/src/routes/ai.ts → src/modules/ai/ai.routes.ts
backend/src/routes/notifications.ts → src/modules/notifications/notifications.routes.ts
backend/src/routes/timeTracking.ts → src/modules/time-tracking/time-tracking.routes.ts
backend/src/routes/*.ts → src/modules/*/routes.ts

backend/src/controllers/* → src/modules/*/controller.ts
backend/src/services/* → src/modules/*/service.ts
backend/src/middleware/* → src/core/middleware/
backend/src/utils/* → src/core/utils/
backend/src/lib/* → src/core/

═══════════════════════════════════════════════════════════════

📦 STEP 3: CREATE MODULES AUTOMATICALLY

For EACH module detected, create this structure:

src/modules/{module}/
├── {module}.controller.ts    # HTTP request handlers
├── {module}.service.ts       # Business logic + DB
├── {module}.routes.ts        # Express routes
├── {module}.validation.ts    # Zod schemas
├── {module}.types.ts         # Interfaces (optional)
└── index.ts                  # Barrel exports

Required modules (create all):
☑️ auth/ — Authentication (login, register, JWT, 2FA)
☑️ users/ — User management (admin only)
☑️ leads/ — Lead CRUD + notes + attachments
☑️ deals/ — Deals/pipeline
☑️ ai/ — AI analytics + dashboard
☑️ notifications/ — Notifications + preferences
☑️ time-tracking/ — Time tracking + heartbeat
☑️ dashboard/ — Dashboard summary
☑️ monitoring/ — Health + metrics
☑️ activities/ — Activity logs
☑️ intelligence/ — Intelligence system
☑️ evolution/ — Evolution system
☑️ advanced-ai/ — Advanced AI features
☑️ maintenance/ — Admin maintenance

═══════════════════════════════════════════════════════════════

🔄 STEP 4: PRESERVE EVERYTHING (CRITICAL)

🚨 FORBIDDEN:
❌ Delete any API endpoint
❌ Change endpoint URL
❌ Change HTTP method
❌ Change response format
❌ Change business logic
❌ Remove any feature

✅ REQUIRED:
☑️ Same behavior 100%
☑️ Same request/response
☑️ Same database queries
☑️ Copy ALL code logic exactly

═══════════════════════════════════════════════════════════════

🔒 STEP 5: ADD REQUIRED SYSTEM LAYERS

Every API endpoint MUST have:

1. safeHandler wrapper:
   export const getLeads = safeHandler(async (req) => {
     // logic here
   });

2. Auth middleware:
   router.use(authMiddleware);

3. Tenant isolation:
   const tenantId = req.user.tenantId;
   // ALL queries must include: where: { tenantId }

4. Validation (for POST/PUT):
   router.post('/', validate(createSchema), handler);

═══════════════════════════════════════════════════════════════

🗄️ STEP 6: MIGRATE DATABASE ACCESS

Rules:
☑️ ALL Prisma calls → service layer only
☑️ NO direct prisma in routes
☑️ NO direct prisma in controllers
☑️ Use repository pattern if complex

Example migration:

OLD (in route):
router.get('/', async (req, res) => {
  const leads = await prisma.lead.findMany({ where: { tenantId } });
  res.json(leads);
});

NEW (service layer):
// service.ts
export const getLeads = async (tenantId: string) => {
  return prisma.lead.findMany({ where: { tenantId } });
};

// controller.ts
export const getLeadsHandler = safeHandler(async (req) => {
  const leads = await leadsService.getLeads(req.user.tenantId);
  return { success: true, data: leads };
});

// routes.ts
router.get('/', authMiddleware, getLeadsHandler);

═══════════════════════════════════════════════════════════════

🧪 STEP 7: VERIFY AFTER MIGRATION

For EACH endpoint, verify:

Checklist:
☑️ Endpoint exists in new location
☑️ Same URL (e.g., /api/leads)
☑️ Same HTTP method
☑️ Same request body
☑️ Same response format
☑️ Auth working (401 without token)
☑️ Tenant isolation (only see own data)
☑️ No 500 errors

Test commands:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer TOKEN"

═══════════════════════════════════════════════════════════════

🧹 STEP 8: CLEANUP OLD BACKEND (ONLY AFTER FULL VERIFY)

⚠️ REQUIREMENTS BEFORE DELETE:
☑️ npm run build succeeds
☑️ All endpoints tested and working
☑️ Frontend connects successfully
☑️ No imports from old backend
☑️ No missing functionality

THEN DELETE:
rm -rf backend/

Verify nothing breaks after delete:
☑️ npm run build (still works)
☑️ npm test (still passes)
☑️ Quick API test (still works)

═══════════════════════════════════════════════════════════════

🔨 STEP 9: FINAL BUILD CHECK

Run:
npm run build

Must show:
✅ "Build completed successfully"
✅ No TypeScript errors
✅ No "Cannot find module" errors
✅ dist/ folder created
✅ All files compiled

If errors:
→ Read FIRST error
→ Fix that file
→ Rebuild
→ Repeat

═══════════════════════════════════════════════════════════════

📦 STEP 10: FINAL OUTPUT

Deliver:

1. ✅ Clean new architecture in src/
2. ✅ All modules in src/modules/
3. ✅ Core utilities in src/core/
4. ✅ All APIs migrated and tested
5. ✅ Old backend/ deleted
6. ✅ Build succeeds
7. ✅ Ready to deploy

═══════════════════════════════════════════════════════════════

📋 PROGRESS REPORTING

After EACH step, report:
- Step number completed
- What was found/done
- Any issues encountered
- Next step starting

═══════════════════════════════════════════════════════════════

🆘 IF STUCK

Stop immediately and report:
1. Current step
2. Error message (exact text)
3. File causing issue
4. What you tried

═══════════════════════════════════════════════════════════════

START WITH STEP 1 NOW — SCAN THE BACKEND DIRECTORY
```

---

## 📎 Additional Commands for Windsurf

### Quick Scan Commands:
```bash
# Count all TypeScript files
echo "Total TS files:" && find backend/ -name "*.ts" | wc -l

# List all routes
echo "Routes files:" && find backend/ -name "*route*" -o -name "*Route*" | head -20

# Find all API endpoints
grep -r "router\." backend/src/routes/*.ts 2>/dev/null | grep -E "(get|post|put|delete)" | head -30

# Find all Prisma queries
grep -r "prisma\." backend/src --include="*.ts" | wc -l
```

### Verify Migration:
```bash
# Check if old backend still has files
ls backend/src/routes/*.ts 2>/dev/null && echo "❌ Old routes still exist" || echo "✅ Old routes cleaned"

# Check if new modules exist
ls src/modules/*/index.ts 2>/dev/null && echo "✅ New modules exist" || echo "❌ New modules missing"

# Build test
npm run build 2>&1 | tail -5
```

---

**Copy the code block above and send to Windsurf** 🚀
