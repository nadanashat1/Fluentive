# 🚀 BACKEND MIGRATION SPECIFICATION
## Complete Task Definition for Windsurf / Developer

---

## 🎯 MISSION OBJECTIVE

Transform the **entire old backend implementation** into the **new Backend V2 architecture** with 100% feature preservation, ensuring:
- ✅ Production-ready system
- ✅ Successful build on Vercel + Render
- ✅ Zero legacy code remaining
- ✅ Zero build failures

---

## 📋 PHASE 1: FULL AUDIT (MANDATORY FIRST)

### Step 1.1: Scan Entire Project
```bash
# Run these commands and document findings
find . -type f -name "*.ts" | grep -E "(backend|server|route)" | head -50
ls -la backend/src/routes/
cat backend/src/app.ts | head -100
grep -r "router\." backend/src/routes/ | wc -l
```

### Step 1.2: Create OLD → NEW Mapping Report

**Required Output Format:**
```yaml
audit_report:
  timestamp: "2024-01-15T10:00:00Z"
  
  old_structure:
    backend_folder: "backend/"
    route_files: 17
    service_files: 12
    middleware_files: 4
    
  modules_found:
    - name: "auth"
      routes: ["register", "login", "logout", "me", "2fa"]
      services: ["auth.service", "email.service"]
      
    - name: "leads"
      routes: ["CRUD", "notes", "attachments", "export"]
      services: ["leads.service"]
      
    - name: "users"
      routes: ["CRUD", "unlock"]
      
    - name: "deals"
      routes: ["CRUD"]
      
    - name: "notifications"
      routes: ["read", "broadcast"]
      
    - name: "time-tracking"
      routes: ["heartbeat", "stats"]

  migration_plan:
    - old: "backend/src/routes/auth.ts"
      new: "src/backend-v2/modules/auth/routes.ts"
      status: "pending"
      
    - old: "backend/src/routes/leads.ts"
      new: "src/backend-v2/modules/leads/routes.ts"
      status: "pending"
```

---

## 🔁 PHASE 2: MIGRATION EXECUTION

### Step 2.1: Structure Setup
Create the new directory structure:
```
src/backend-v2/
├── modules/
│   ├── auth/
│   │   ├── routes.ts          # Express routes
│   │   ├── controller.ts      # Route handlers
│   │   ├── service.ts         # Business logic
│   │   └── types.ts           # TypeScript types
│   │
│   ├── leads/
│   │   ├── routes.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── repository.ts      # DB layer
│   │   └── types.ts
│   │
│   ├── users/
│   ├── deals/
│   ├── notifications/
│   ├── time-tracking/
│   └── ai/
│
├── core/
│   ├── database/
│   │   └── prisma.ts          # DB singleton
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── error-handler.ts
│   │   ├── rate-limiter.ts
│   │   ├── request-logger.ts
│   │   └── tenant-resolver.ts
│   │
│   ├── security/
│   │   └── permissions.ts
│   │
│   ├── errors/
│   │   └── AppError.ts
│   │
│   └── utils/
│       └── validation.ts
│
├── app.ts                     # Entry point
└── server.ts                  # Server bootstrap
```

### Step 2.2: Route Migration Pattern

**OLD (Express Pattern):**
```typescript
// backend/src/routes/auth.ts
import express from 'express';
import { register, login } from '../controllers/auth';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
```

**NEW (Backend V2 Pattern):**
```typescript
// src/backend-v2/modules/auth/routes.ts
import { Router } from 'express';
import { AuthController } from './controller';
import { authMiddleware } from '../../core/middleware/auth';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes
router.get('/me', authMiddleware, controller.getMe);
router.post('/logout', authMiddleware, controller.logout);

export { router as authRoutes };
```

### Step 2.3: Controller Pattern

```typescript
// src/backend-v2/modules/auth/controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { success, error } from '../../core/utils/response';

export class AuthController {
  private service = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.register(req.body);
      res.status(201).json(success(result));
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.login(req.body);
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getUser(req.user!.id);
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  };
}
```

### Step 2.4: Service Pattern

```typescript
// src/backend-v2/modules/auth/service.ts
import { prisma } from '../../core/database/prisma';
import { AppError } from '../../core/errors/AppError';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  async register(data: any) {
    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existing) {
      throw new AppError('User already exists', 409, 'CONFLICT');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'sales',
        tenantId: data.tenantId,
      },
      select: { id: true, name: true, email: true, role: true }
    });

    return { user, token: this.generateToken(user) };
  }

  async login(data: any) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user || !await bcrypt.compare(data.password, user.password)) {
      throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    return { user, token: this.generateToken(user) };
  }

  private generateToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
  }
}
```

---

## ⚠️ PHASE 3: CRITICAL RULES (NON-NEGOTIABLE)

### ❌ FORBIDDEN (Will be rejected):
1. **Delete any feature** - All 55+ endpoints must be migrated
2. **Change API contracts** - Response shapes must stay identical
3. **Change DB schema intent** - Prisma schema logic preserved
4. **Break frontend integration** - Frontend must work unchanged
5. **Skip middleware** - All auth/rate limiting must be included

### ✅ REQUIRED:
1. **Reorganize only** - Same code, better structure
2. **Improve architecture** - Service + Repository pattern
3. **Guarantee same behavior** - 100% feature parity

---

## 🔐 PHASE 4: VERIFY BEFORE DELETE

### Pre-Deletion Checklist (MUST PASS):

For each module, verify:

```bash
# 1. Endpoint verification
curl http://localhost:3001/api/auth/register    # Must work
curl http://localhost:3001/api/auth/login       # Must work
curl http://localhost:3001/api/auth/me          # Must work (with token)

# 2. Health check
curl http://localhost:3001/api/health           # Must return 200

# 3. Build verification
npm run build                                     # Must succeed
npm run typecheck                                 # Must pass
npm run lint                                      # Must pass

# 4. Feature count verification
# Count routes in old: find backend/src/routes -name "*.ts" | xargs grep -c "router\." | awk '{s+=$1} END {print s}'
# Count routes in new: find src/backend-v2/modules -name "routes.ts" | xargs grep -c "router\." | awk '{s+=$1} END {print s}'
# These numbers MUST match
```

### Verification Matrix:

| Module | Old Routes | New Routes | Status |
|--------|------------|------------|--------|
| auth | 12 | 12 | ⬜ |
| leads | 17 | 17 | ⬜ |
| users | 6 | 6 | ⬜ |
| deals | 5 | 5 | ⬜ |
| notifications | 4 | 4 | ⬜ |
| time-tracking | 7 | 7 | ⬜ |

---

## 🧹 PHASE 5: SAFE DELETION

### ONLY AFTER FULL VERIFICATION:

```bash
# ⚠️ DANGER: ONLY RUN AFTER VERIFICATION CHECKLIST PASSES

# Step 1: Create backup branch
git checkout -b backup-old-backend
git add backend/
git commit -m "backup: old backend before deletion"
git push origin backup-old-backend

# Step 2: Delete old backend
rm -rf backend/

# Step 3: Verify build still works
npm run build

# Step 4: Verify tests pass
npm run test:quick

# Step 5: Commit deletion
git add .
git commit -m "cleanup: remove old backend after successful migration"
```

---

## 🚀 PHASE 6: FINAL BUILD VALIDATION

### Mandatory Commands (All must pass):

```bash
# 1. Build
npm run build
# EXPECTED: ✓ Compiled successfully

# 2. Type checking
npm run typecheck
# EXPECTED: 0 errors, 0 warnings

# 3. Linting
npm run lint
# EXPECTED: ✓ No ESLint errors

# 4. Health check
curl http://localhost:3001/api/health
# EXPECTED: {"success":true,"data":{"status":"ok"}}

# 5. API smoke test
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test123!"}'
# EXPECTED: 201 Created with user object
```

### Success Criteria:
- [ ] Zero build errors
- [ ] Zero TypeScript errors
- [ ] Zero missing routes
- [ ] Zero SSR failures
- [ ] Health check passes
- [ ] API endpoints respond correctly
- [ ] Frontend connects without errors

---

## 📦 PHASE 7: FINAL OUTPUT REQUIREMENTS

After migration, the project MUST have:

```
✅ Single backend architecture (no duplicates)
✅ Clean modular system (src/backend-v2/)
✅ Fully deployed-compatible (Vercel + Render)
✅ No old backend code remaining
✅ No build-breaking files
✅ All 55+ endpoints working
✅ All tests passing
✅ Production-ready status
```

---

## 🧾 DELIVERABLES CHECKLIST

### Code Deliverables:
- [ ] All modules migrated to `src/backend-v2/modules/`
- [ ] All routes working with new pattern
- [ ] All services using new pattern
- [ ] All middleware in `src/backend-v2/core/middleware/`
- [ ] Database layer in `src/backend-v2/core/database/`
- [ ] Error system in `src/backend-v2/core/errors/`

### Documentation Deliverables:
- [ ] OLD → NEW mapping report
- [ ] API endpoint verification results
- [ ] Build validation report
- [ ] Deployment guide updated

### Git Deliverables:
- [ ] Backup branch created
- [ ] Old backend deleted safely
- [ ] Clean commit history
- [ ] Main branch stable

---

## 🚨 FAILURE BLOCKERS

### Any of these = DEPLOY BLOCKED:
1. Any old backend endpoint not migrated
2. Any route returning different response shape
3. Any missing middleware (auth, rate limit, etc.)
4. Build errors or TypeScript failures
5. Health check failures
6. Frontend integration broken

---

## ✅ APPROVAL CRITERIA

Migration is complete when:

```
✓ All 55+ endpoints migrated
✓ All services migrated
✓ All middleware migrated
✓ Zero old backend code
✓ Build passes (npm run build)
✓ Type check passes (npm run typecheck)
✓ Lint passes (npm run lint)
✓ Health check passes (/api/health)
✓ API test passes (manual curl tests)
✓ Frontend connects successfully
✓ Deploy-ready to Vercel
✓ Deploy-ready to Render
```

---

## 💡 NOTES FOR IMPLEMENTER

### Common Pitfalls to Avoid:
1. **Don't skip middleware** - Auth, rate limiting, tenant isolation must be in place
2. **Don't change response shapes** - Frontend expects specific JSON structure
3. **Don't skip error handling** - Every route needs try/catch
4. **Don't forget health checks** - Required for deployment
5. **Don't delete before verifying** - Always backup first

### Helpful Commands:
```bash
# Count endpoints
find src/backend-v2/modules -name "routes.ts" -exec grep -c "router\." {} \;

# List all routes
grep -r "router\.(get|post|put|delete|patch)" src/backend-v2/modules/

# Test specific endpoint
curl -s http://localhost:3001/api/health | jq .
```

---

**🎯 FINAL GOAL: Production SaaS Backend V2 (clean, scalable, deploy-safe)**

*This specification must be followed exactly. Any deviation must be approved.*

*Document Version: 1.0*  
*Migration Status: READY TO EXECUTE*
