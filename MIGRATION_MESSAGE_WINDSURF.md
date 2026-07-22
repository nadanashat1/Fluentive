# 🚀 WINDSURF MIGRATION MESSAGE — Copy & Paste This

**Send this exact message to Windsurf to execute the full API migration:**

---

```
🚀 TASK: FULL API MIGRATION (OLD → NEW ARCHITECTURE)

I need you to migrate ALL APIs from the old backend to a new modular architecture (v2).

⚠️ CRITICAL RULES — READ FIRST:
1. PRESERVE EXACT API CONTRACTS — No URL changes, no method changes, no response shape changes
2. Frontend must work WITHOUT any changes after migration
3. All tests must pass after migration
4. Build must succeed

═══════════════════════════════════════════════════════════════

📋 STEP 1: DISCOVER ALL OLD APIs

Scan and catalog EVERY endpoint in:
- backend/src/routes/*.ts
- backend/api/*.ts  
- backend/src/controllers/*.ts
- backend/src/app.ts (route registrations)

For each endpoint, extract:
- HTTP method (GET/POST/PUT/DELETE/PATCH)
- Full path (/api/...)
- Request body shape (if any)
- Response shape (success format)
- Current auth requirements
- Database queries used

Output format REQUIRED:
{
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/leads",
      "auth": true,
      "permissions": ["LEAD_VIEW"],
      "requestBody": null,
      "responseShape": { "success": true, "data": "Lead[]" },
      "dbQueries": ["prisma.lead.findMany"]
    }
  ]
}

═══════════════════════════════════════════════════════════════

📋 STEP 2: CREATE NEW MODULE STRUCTURE

For EACH API module, create this EXACT structure:

modules/{module}/
├── {module}.controller.ts    # Handle HTTP requests
├── {module}.service.ts     # Business logic + DB queries
├── {module}.routes.ts       # Route definitions
├── {module}.validation.ts  # Zod schemas for validation
├── {module}.types.ts      # TypeScript interfaces (if needed)
└── index.ts               # Barrel export

═══════════════════════════════════════════════════════════════

📋 STEP 3: IMPLEMENTATION TEMPLATES

Use these EXACT patterns:

--- TEMPLATE: Service Layer ---
// modules/leads/leads.service.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class LeadsService {
  async getAll(tenantId: string, filters?: any) {
    return prisma.lead.findMany({
      where: { tenantId, ...filters },
      include: { notes: true, attachments: true },
    });
  }

  async getById(id: string, tenantId: string) {
    return prisma.lead.findFirst({
      where: { id, tenantId },
      include: { notes: true, attachments: true },
    });
  }

  async create(data: any, tenantId: string, userId: string) {
    return prisma.lead.create({
      data: { ...data, tenantId, createdBy: userId },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    return prisma.lead.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    return prisma.lead.deleteMany({
      where: { id, tenantId },
    });
  }
}

export const leadsService = new LeadsService();

--- TEMPLATE: Controller Layer ---
// modules/leads/leads.controller.ts
import { leadsService } from './leads.service';
import { getTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth';

export const leadsController = {
  getAll: async (req: any) => {
    const tenant = getTenant(req);
    const data = await leadsService.getAll(tenant.tenantId, req.query);
    return { success: true, count: data.length, data };
  },

  getById: async (req: any) => {
    const tenant = getTenant(req);
    const data = await leadsService.getById(req.params.id, tenant.tenantId);
    if (!data) return { success: false, error: 'Lead not found' };
    return { success: true, data };
  },

  create: async (req: any) => {
    const tenant = getTenant(req);
    const user = getCurrentUser(req);
    const data = await leadsService.create(req.body, tenant.tenantId, user.id);
    return { success: true, data };
  },

  update: async (req: any) => {
    const tenant = getTenant(req);
    const data = await leadsService.update(req.params.id, req.body, tenant.tenantId);
    return { success: true, data };
  },

  delete: async (req: any) => {
    const tenant = getTenant(req);
    await leadsService.delete(req.params.id, tenant.tenantId);
    return { success: true, message: 'Lead deleted' };
  },
};

--- TEMPLATE: Routes Layer ---
// modules/leads/leads.routes.ts
import { Router } from 'express';
import { leadsController } from './leads.controller';
import { validate } from '@/middleware/validate';
import { auth } from '@/middleware/auth';
import { requirePermission } from '@/middleware/permissions';
import { safeHandler } from '@/lib/safe-handler';
import { createLeadSchema, updateLeadSchema } from './leads.validation';

const router = Router();

// All routes require authentication
router.use(auth);

// GET /api/leads
router.get(
  '/',
  requirePermission('LEAD_VIEW'),
  safeHandler(leadsController.getAll)
);

// GET /api/leads/:id
router.get(
  '/:id',
  requirePermission('LEAD_VIEW'),
  safeHandler(leadsController.getById)
);

// POST /api/leads
router.post(
  '/',
  requirePermission('LEAD_CREATE'),
  validate(createLeadSchema),
  safeHandler(leadsController.create)
);

// PUT /api/leads/:id
router.put(
  '/:id',
  requirePermission('LEAD_UPDATE'),
  validate(updateLeadSchema),
  safeHandler(leadsController.update)
);

// DELETE /api/leads/:id
router.delete(
  '/:id',
  requirePermission('LEAD_DELETE'),
  safeHandler(leadsController.delete)
);

export default router;

--- TEMPLATE: Validation Layer ---
// modules/leads/leads.validation.ts
import { z } from 'zod';

export const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

--- TEMPLATE: Safe Handler ---
// lib/safe-handler.ts
export function safeHandler(fn: (req: any) => Promise<any>) {
  return async (req: any, res: any, next: any) => {
    try {
      const result = await fn(req);
      
      // Preserve exact response format
      if (result.success === false) {
        const statusCode = result.status || 400;
        return res.status(statusCode).json(result);
      }
      
      res.json(result);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal Server Error' 
          : error.message,
      });
    }
  };
}

═══════════════════════════════════════════════════════════════

📋 STEP 4: MIGRATION ORDER (CRITICAL)

Migrate in this EXACT order to avoid dependency issues:

1. Core utilities first:
   - lib/prisma.ts
   - lib/tenant.ts
   - lib/auth.ts
   - lib/safe-handler.ts
   - middleware/auth.ts
   - middleware/validate.ts
   - middleware/permissions.ts

2. Shared modules:
   - modules/tenants/
   - modules/users/

3. Feature modules (in dependency order):
   - modules/auth/          (no dependencies)
   - modules/leads/         (depends: auth, tenants)
   - modules/deals/         (depends: leads, auth)
   - modules/activities/    (depends: leads, users)
   - modules/ai/            (depends: leads)
   - modules/notifications/   (depends: users, leads)
   - modules/time-tracking/   (depends: users)
   - modules/dashboard/       (depends: leads, deals)
   - modules/monitoring/      (no dependencies)
   - modules/intelligence/    (depends: monitoring)
   - modules/evolution/       (depends: intelligence)
   - modules/maintenance/     (admin only)

═══════════════════════════════════════════════════════════════

📋 STEP 5: PRESERVE EXACT API RESPONSES

Compare OLD vs NEW responses — they must match EXACTLY:

OLD Response:
{
  "success": true,
  "data": {
    "id": "123",
    "firstName": "John",
    "lastName": "Doe"
  }
}

NEW Response (MUST MATCH):
{
  "success": true,
  "data": {
    "id": "123",
    "firstName": "John",
    "lastName": "Doe"
  }
}

⚠️ FORBIDDEN CHANGES:
- ❌ Changing "data" to "result"
- ❌ Wrapping in additional layers
- ❌ Changing snake_case to camelCase
- ❌ Removing/adding fields without checking old code

═══════════════════════════════════════════════════════════════

📋 STEP 6: MIGRATE EACH MODULE

For each module, follow this checklist:

☑️ 1. Create folder structure
☑️ 2. Copy business logic from old controller
☑️ 3. Convert DB calls to service layer
☑️ 4. Add tenant isolation to ALL queries
☑️ 5. Create validation schemas
☑️ 6. Create routes with exact same paths
☑️ 7. Add auth middleware
☑️ 8. Add permission checks
☑️ 9. Wrap with safeHandler
☑️ 10. Test endpoint manually
☑️ 11. Verify response matches old API

═══════════════════════════════════════════════════════════════

📋 STEP 7: VERIFY EVERYTHING

After migration, verify:

Build Verification:
☑️ npm run build completes without errors
☑️ No TypeScript errors
☑️ No circular dependencies

API Verification:
☑️ All old endpoints respond on new system
☑️ All methods match (GET stays GET, etc.)
☑️ All paths match exactly
☑️ Response shapes identical

Test Verification:
☑️ npm test passes
☑️ All existing tests still pass
☑️ No test file modifications needed

Frontend Verification:
☑️ Frontend can login
☑️ Frontend can fetch leads
☑️ Frontend can create/update/delete
☑️ No console errors in frontend

═══════════════════════════════════════════════════════════════

📋 STEP 8: FINAL CLEANUP (ONLY AFTER VERIFY)

After 100% verification:

☑️ Delete old backend/src/routes/
☑️ Delete old backend/src/controllers/
☑️ Delete old backend/api/ (if empty)
☑️ Update backend/src/app.ts to import from modules/
☑️ Verify imports use @/ alias not relative paths

═══════════════════════════════════════════════════════════════

📋 STEP 9: DELIVERABLES

Provide:
1. ✅ List of all migrated endpoints
2. ✅ Verification that all endpoints work
3. ✅ Test results (npm test output)
4. ✅ Build success confirmation
5. ✅ Any manual verification steps needed

═══════════════════════════════════════════════════════════════

🚨 MANDATORY SUCCESS CRITERIA:

Before declaring success, ALL must be true:

✅ 1. Every old endpoint exists in new system
✅ 2. Every endpoint responds with correct method
✅ 3. Response shapes match exactly
✅ 4. npm run build succeeds
✅ 5. npm test passes
✅ 6. Frontend works without changes
✅ 7. No 500 errors on any endpoint
✅ 8. Tenant isolation works (users see only their data)

═══════════════════════════════════════════════════════════════

START MIGRATION NOW. DO NOT SKIP STEPS.
```

---

## 📎 After Sending This Message

**Also provide Windsurf with:**
1. Path to old backend: `backend/src/`
2. Path for new modules: `backend/src/modules/`
3. The existing test files so they can verify
4. Any existing `tsconfig.json` with path aliases

**Monitor progress by asking Windsurf to:**
1. Report after each module migration
2. Show the old vs new response comparison
3. Run tests after each batch
4. Stop immediately if any check fails
