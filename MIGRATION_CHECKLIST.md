# 🔄 API Migration Checklist — Old → New Architecture

**Use this checklist to track migration progress**

---

## 📋 Pre-Migration

- [ ] Backup current backend
- [ ] Document all existing endpoints
- [ ] Export current database schema
- [ ] Run full test suite on old system
- [ ] Record baseline performance metrics

---

## 🔍 Step 1: Discovery (Complete First!)

Scan and catalog all old APIs:

- [ ] Find all route files: `backend/src/routes/*.ts`
- [ ] Find all controllers: `backend/src/controllers/*.ts`
- [ ] Find all API handlers: `backend/api/*.ts`
- [ ] Check `backend/src/app.ts` for route registrations
- [ ] Document each endpoint with:
  - [ ] HTTP method
  - [ ] Full path
  - [ ] Request body schema
  - [ ] Response shape
  - [ ] Auth requirements
  - [ ] Database queries

**Output:** `api-discovery-report.json`

---

## 🏗️ Step 2: Core Infrastructure

Build foundation first:

- [ ] Create `src/lib/prisma.ts`
- [ ] Create `src/lib/tenant.ts` - Extract tenant from request
- [ ] Create `src/lib/auth.ts` - JWT utilities
- [ ] Create `src/lib/safe-handler.ts` - Error wrapper
- [ ] Create `src/middleware/auth.ts` - Auth middleware
- [ ] Create `src/middleware/validate.ts` - Zod validation
- [ ] Create `src/middleware/permissions.ts` - RBAC middleware
- [ ] Update `tsconfig.json` with path aliases (`@/`)

---

## 📦 Step 3: Module Migration (In Order!)

### Priority 1: Foundation
- [ ] `modules/tenants/` - Tenant management
- [ ] `modules/users/` - User management

### Priority 2: Auth
- [ ] `modules/auth/` - Authentication
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

### Priority 3: Core Features
- [ ] `modules/leads/` - Lead management
  - [ ] GET /api/leads
  - [ ] POST /api/leads
  - [ ] GET /api/leads/stats
  - [ ] GET /api/leads/export
  - [ ] GET /api/leads/:id
  - [ ] PUT /api/leads/:id
  - [ ] DELETE /api/leads/:id
  - [ ] GET /api/leads/:id/logs
  - [ ] GET /api/leads/:id/attachments
  - [ ] POST /api/leads/:id/attachments
  - [ ] GET /api/leads/:id/notes
  - [ ] POST /api/leads/:id/notes

- [ ] `modules/deals/` - Deal/pipeline
  - [ ] GET /api/deals
  - [ ] POST /api/deals
  - [ ] GET /api/deals/:id
  - [ ] PUT /api/deals/:id
  - [ ] DELETE /api/deals/:id

### Priority 4: Supporting Features
- [ ] `modules/activities/` - Activity logging
- [ ] `modules/notifications/` - Notifications
  - [ ] GET /api/notifications
  - [ ] PATCH /api/notifications/:id/read
  - [ ] PATCH /api/notifications/read-all
  - [ ] DELETE /api/notifications/:id
  - [ ] GET /api/notification-preferences
  - [ ] PUT /api/notification-preferences

- [ ] `modules/time-tracking/` - Time tracking
  - [ ] POST /api/time-tracking/heartbeat
  - [ ] GET /api/time-tracking/my-time
  - [ ] GET /api/time-tracking/active-users
  - [ ] POST /api/time-tracking/end-session

### Priority 5: Dashboard & AI
- [ ] `modules/dashboard/` - Dashboard
  - [ ] GET /api/dashboard/summary

- [ ] `modules/ai/` - AI analytics
  - [ ] GET /api/ai/dashboard
  - [ ] GET /api/ai/prioritized-leads
  - [ ] GET /api/ai/leads/:id/score
  - [ ] POST /api/ai/chat

- [ ] `modules/advanced-ai/` - Advanced AI
- [ ] `modules/intelligence/` - Intelligence system
- [ ] `modules/evolution/` - Evolution system

### Priority 6: System
- [ ] `modules/monitoring/` - Health checks
  - [ ] GET /health
  - [ ] GET /api/monitoring/health
  - [ ] GET /api/monitoring/status
  - [ ] GET /api/monitoring/metrics

- [ ] `modules/maintenance/` - Maintenance tasks

---

## ✅ Step 4: Verification Per Module

For each migrated module, verify:

- [ ] All endpoints respond
- [ ] HTTP methods match
- [ ] Paths match exactly
- [ ] Response shapes identical
- [ ] Auth middleware applied
- [ ] Tenant isolation working
- [ ] Validation schemas correct
- [ ] Error handling working

---

## 🧪 Step 5: Global Verification

### Build & Tests
- [ ] `npm run build` succeeds with no errors
- [ ] `npm test` passes all tests
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No circular dependencies

### API Compatibility
- [ ] All old endpoints exist in new system
- [ ] Frontend works without changes
- [ ] Response formats match exactly
- [ ] Auth flow works end-to-end

### Security
- [ ] All protected routes require auth
- [ ] Tenant isolation verified (cross-tenant data leak test)
- [ ] Input validation working
- [ ] No stack traces in production errors

### Performance
- [ ] Response times < 500ms for standard endpoints
- [ ] Database queries optimized
- [ ] No N+1 query problems

---

## 🧹 Step 6: Cleanup (After Verification!)

**⚠️ ONLY after 100% verification:**

- [ ] Delete `backend/src/routes/` (old routes)
- [ ] Delete `backend/src/controllers/` (old controllers)
- [ ] Update `backend/src/app.ts` to use new modules
- [ ] Verify no references to old code
- [ ] Run final test suite
- [ ] Tag release in git

---

## 📊 Migration Status Summary

| Module | Status | Tests Pass | Notes |
|--------|--------|------------|-------|
| auth | ⬜ | ⬜ | |
| leads | ⬜ | ⬜ | |
| users | ⬜ | ⬜ | |
| deals | ⬜ | ⬜ | |
| notifications | ⬜ | ⬜ | |
| time-tracking | ⬜ | ⬜ | |
| dashboard | ⬜ | ⬜ | |
| ai | ⬜ | ⬜ | |
| monitoring | ⬜ | ⬜ | |

**Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Blocked

---

## 🚀 Final Deployment Checklist

Before switching to new system:

- [ ] All modules migrated
- [ ] All tests passing
- [ ] Build successful
- [ ] Frontend tested against new API
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Monitoring in place
- [ ] Team notified

---

## 🆘 Emergency Rollback

If issues after deploy:

1. **Immediate:** Revert to previous container/image
2. **Database:** No rollback needed (schema compatible)
3. **Notify:** Alert team in #incidents
4. **Investigate:** Check logs for root cause
5. **Fix:** Address issue in next deployment

---

## 📞 Migration Support

| Resource | Location |
|----------|----------|
| Full Message | `MIGRATION_MESSAGE_WINDSURF.md` |
| Templates | `backend/src/modules/_templates/` |
| Verification | `scripts/verify-migration.js` |
| Test Suite | `backend/tests/api/` |
| API Report | `backend/API_ENDPOINTS_REPORT.md` |

---

**Last Updated:** Auto-generated  
**Migration Version:** v2.0.0
