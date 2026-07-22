# COMPLETE API INVENTORY REPORT

## **AUTH ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| POST | /api/auth/register | No | src/app/api/auth/register/route.ts | ✅ Working |
| POST | /api/auth/login | No | src/app/api/auth/login/route.ts | ❌ Broken |
| POST | /api/auth/logout | Yes | src/app/api/auth/logout/route.ts | ❓ Untested |
| POST | /api/auth/refresh | Yes | src/app/api/auth/refresh/route.ts | ❓ Untested |
| GET | /api/auth/me | Yes | src/app/api/auth/me/route.ts | ❌ Broken |
| POST | /api/auth/2fa/disable | Yes | src/app/api/auth/2fa/disable/route.ts | ❓ Untested |
| POST | /api/auth/2fa/verify | Yes | src/app/api/auth/2fa/verify/route.ts | ❓ Untested |
| POST | /api/auth/change-password | Yes | src/app/api/auth/change-password/route.ts | ❓ Untested |
| POST | /api/auth/register-temp | No | src/app/api/auth/register-temp/route.ts | ❓ Untested |

## **LEADS ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/leads | Yes | src/app/api/leads/route.ts | ❌ Broken (Auth) |
| POST | /api/leads | Yes | src/app/api/leads/route.ts | ❌ Broken (Auth) |
| GET | /api/leads/stats | Yes | src/app/api/leads/stats/route.ts | ❓ Untested |
| GET | /api/leads/[id] | Yes | src/app/api/leads/[id]/route.ts | ❓ Untested |
| PUT | /api/leads/[id] | Yes | src/app/api/leads/[id]/route.ts | ❓ Untested |
| DELETE | /api/leads/[id] | Yes | src/app/api/leads/[id]/route.ts | ❓ Untested |
| POST | /api/leads/[id]/notes | Yes | src/app/api/leads/[id]/notes/route.ts | ❓ Untested |
| GET | /api/leads/[id]/notes/[noteId] | Yes | src/app/api/leads/[id]/notes/[noteId]/route.ts | ❓ Untested |
| DELETE | /api/leads/[id]/notes/[noteId] | Yes | src/app/api/leads/[id]/notes/[noteId]/route.ts | ❓ Untested |
| GET | /api/leads/[id]/attachments/[attachmentId] | Yes | src/app/api/leads/[id]/attachments/[attachmentId]/route.ts | ❓ Untested |

## **DEALS ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/deals | Yes | src/app/api/deals/route.ts | ❓ Untested |
| POST | /api/deals | Yes | src/app/api/deals/route.ts | ❓ Untested |
| GET | /api/deals/[id] | Yes | src/app/api/deals/[id]/route.ts | ❓ Untested |
| PUT | /api/deals/[id] | Yes | src/app/api/deals/[id]/route.ts | ❓ Untested |
| DELETE | /api/deals/[id] | Yes | src/app/api/deals/[id]/route.ts | ❓ Untested |

## **ACTIVITIES ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/activity-logs | Yes | src/app/api/activity-logs/route.ts | ❓ Untested |

## **DASHBOARD ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/dashboard/summary | Yes | src/app/api/dashboard/summary/route.ts | ❓ Untested |

## **USERS ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/users | Yes | src/app/api/users/route.ts | ❓ Untested |
| GET | /api/users/[id] | Yes | src/app/api/users/[id]/route.ts | ❓ Untested |
| PUT | /api/users/[id] | Yes | src/app/api/users/[id]/route.ts | ❓ Untested |
| POST | /api/users/[id]/unlock | Yes | src/app/api/users/[id]/unlock/route.ts | ❓ Untested |

## **NOTIFICATIONS ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/notifications | Yes | src/app/api/notifications/route.ts | ❓ Untested |
| GET | /api/notifications/[id] | Yes | src/app/api/notifications/[id]/route.ts | ❓ Untested |
| POST | /api/notifications/[id]/read | Yes | src/app/api/notifications/[id]/read/route.ts | ❓ Untested |
| POST | /api/notifications/read-all | Yes | src/app/api/notifications/read-all/route.ts | ❓ Untested |

## **ORGANIZATIONS ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/organizations | Yes | src/app/api/organizations/route.ts | ❓ Untested |
| POST | /api/organizations/invitations | Yes | src/app/api/organizations/invitations/route.ts | ❓ Untested |

## **TIME TRACKING ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/time-tracking/active-users | Yes | src/app/api/time-tracking/active-users/route.ts | ❓ Untested |
| GET | /api/time-tracking/activities | Yes | src/app/api/time-tracking/activities/route.ts | ❓ Untested |
| GET | /api/time-tracking/all-time | Yes | src/app/api/time-tracking/all-time/route.ts | ❓ Untested |
| POST | /api/time-tracking/end-session | Yes | src/app/api/time-tracking/end-session/route.ts | ❓ Untested |
| POST | /api/time-tracking/heartbeat | Yes | src/app/api/time-tracking/heartbeat/route.ts | ❓ Untested |
| GET | /api/time-tracking/my-time | Yes | src/app/api/time-tracking/my-time/route.ts | ❓ Untested |
| POST | /api/time-tracking/page-views | Yes | src/app/api/time-tracking/page-views/route.ts | ❓ Untested |
| POST | /api/time-tracking/track-page | Yes | src/app/api/time-tracking/track-page/route.ts | ❓ Untested |

## **SYSTEM ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/health | No | src/app/api/health/route.ts | ✅ Working |

## **AI ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/ai/dashboard | Yes | src/app/api/ai/dashboard/route.ts | ❓ Untested |

## **TEST ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/test-auth | No | src/app/api/test-auth/route.ts | ❓ Untested |
| POST | /api/test-logging | No | src/app/api/test-logging/route.ts | ❓ Untested |
| POST | /api/test-normalization | No | src/app/api/test-normalization/route.ts | ❓ Untested |
| POST | /api/test-retry | No | src/app/api/test-retry/route.ts | ❓ Untested |
| POST | /api/test-zod | No | src/app/api/test-zod/route.ts | ❓ Untested |

## **MAINTENANCE ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/maintenance/my-stats | Yes | src/app/api/maintenance/my-stats/route.ts | ❓ Untested |

## **V2 ENDPOINTS**

| Method | Route | Auth Required | File Location | Status |
|---------|--------|---------------|---------------|---------|
| GET | /api/v2/leads | Yes | src/app/api/v2/leads/route.ts | ❓ Untested |
| POST | /api/v2/security-log | Yes | src/app/api/v2/security-log/route.ts | ❓ Untested |
| GET | /api/v2/security-log/list | Yes | src/app/api/v2/security-log/list/route.ts | ❓ Untested |

---

## **SUMMARY**

- **Total Endpoints**: 47
- **Working**: 2 (4.3%)
- **Broken**: 3 (6.4%)
- **Untested**: 42 (89.4%)

**Critical Issues**: Authentication system completely broken
