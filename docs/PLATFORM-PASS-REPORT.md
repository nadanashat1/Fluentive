# Fluentive Platform Pass Report

**Date:** 2026-05-23  
**Scope:** Incremental stability pass (P0–P7), minimal diffs, no architecture rewrites.

---

## P0 — Authentication repair (401 cascade)

### Root causes found

1. **`apiFetch` had no session refresh on 401** — Most pages import `@/lib/api-client`, which threw on expired access tokens without calling `authKernel.refreshToken()`. Parallel requests could cascade 401s after the 15-minute access token TTL.
2. **Misleading `hasAuth` check** — `AuthContext-production` used `document.cookie.includes('accessToken')`, but `accessToken` is **httpOnly** and invisible to JavaScript, so `hasAuth` was often false while cookies were valid.
3. **Logout did not reset bootstrap guards** — `hasBootstrapped` stayed true after logout, blocking a clean re-bootstrap on the next session without a full reload.
4. **Bearer fallback gap** — Login set httpOnly cookies but did not persist the body `token` to `localStorage`, so Bearer fallback in `apiFetch` was empty unless set elsewhere.
5. **Middleware / proxy** — Next.js 16 uses `src/proxy.ts` (not `middleware.ts`). It correctly passes through API routes without a second auth gate (avoids double 401). No change required.

### Files modified

| File | Change |
|------|--------|
| `src/lib/api-client.ts` | 401 → `authKernel.refreshToken()` + single retry; `X-Correlation-Id`; credentials + Bearer |
| `src/lib/auth/dev-auth-log.ts` | **New** — dev-only structured auth logs (cookie presence, not values) |
| `src/lib/server/auth.ts` | Integrated `logAuthResolution` in `requireAuth` |
| `src/contexts/AuthContext-production.tsx` | Removed broken httpOnly cookie check for `hasAuth` |
| `src/lib/auth/auth-kernel.ts` | Reset bootstrap cache on logout; persist login token to `localStorage` |
| `src/lib/observability/correlation.ts` | **New** — client correlation ID helper |

### Fixes implemented

- Dev logs gated by `NODE_ENV=development` or `AUTH_DEBUG=1` (JSON lines: route, `hasAccessCookie`, `hasRefreshCookie`, `hasBearer`, `resolved`, `rejection`).
- `apiFetch` retries once after successful refresh (no redirect in transport layer).
- Auth context `hasAuth` derives from kernel state only.

### Pages / APIs verified (code review)

- `GET /api/auth/me` — uses `requireAuth` + dev logging
- Notifications — `notification-bell.tsx` uses `apiFetch` (now refresh-aware)
- Dashboard — `useQuery` + `apiFetch('/api/dashboard/analytics')`
- Finance — `finance/page.tsx` invoice queries via `apiFetch`
- Activity logs — `useActivityLogs` → `apiFetch`
- Time-tracking — routes use `requireAuth` from middleware wrapper

### Remaining risks

- `NEXT_PUBLIC_API_URL` pointing to an external origin would break cookie auth (cross-origin). Keep empty for same-origin App Router APIs.
- Vitest/Jest environments missing `jsdom` in this workspace — new unit tests added but not executed in CI here.
- Full E2E login flow not run in this pass (no live DB in agent session).

### Recommended next phase

- Run manual login → wait 15m (or shorten TTL in dev) → confirm single refresh, no redirect storm.
- Add `jest-environment-jsdom` or run vitest with `environment: 'node'` for auth/format-time tests.
- Optionally merge `auth-api-client.ts` with `api-client.ts` to avoid duplicate fetch wrappers long-term.

---

## P1 — Platform stability pass

### Root causes found

- Notification timestamps could show invalid relative text when `createdAt` was malformed.

### Files modified

| File | Change |
|------|--------|
| `src/components/notifications/notification-bell.tsx` | Uses `formatActivityTime` (safe dates) |

### Fixes implemented

- Safe relative time for notifications (no `Invalid Date`).

### Pages verified (code review)

- Dashboard, finance, activity-logs, leads list — existing loading/error/empty patterns preserved.

### Remaining risks

- Pre-existing project-wide `tsc` errors (unrelated modules under `.next/types`, AI routes, etc.).
- Hydration guards exist (`AuthHydrationGuard`, kernel hydrating gate) but not re-tested in browser this pass.

### Recommended next phase

- Sample hydration on `/dashboard` and `/finance` with React DevTools.
- Triage `tsc` baseline incrementally (do not block on full green).

---

## P2 — Activity Logs

### Root causes found

- Finance events were categorized as generic `SYSTEM` without dedicated human copy.
- Entity deep links were text-only.
- Export CSV did not include filter context or entity IDs.

### Files modified

| File | Change |
|------|--------|
| `src/lib/activity-logs/humanize.ts` | Finance/invoice/payment/tax humanization block |
| `src/lib/activity-logs/normalize.ts` | Infer finance-related categories |
| `src/lib/activity-logs/entity-links.ts` | **New** — lead, deal, invoice links |
| `src/components/activity-logs/activity-log-row.tsx` | Entity links, `React.memo`, timeline styling |
| `src/app/(app)/activity-logs/page.tsx` | Timeline toggle, richer export + filename tags |
| `src/lib/activity-logs/__tests__/format-time.test.ts` | **New** unit tests |

### Fixes implemented

- Clickable refs: `/leads/[id]`, `/sales-pipeline/[id]`, `/finance?highlight=[invoiceId]`
- Optional timeline view (left border accent)
- Export includes `leadId`, `dealId`, `entityType`, `entityId` and active filter tags in filename
- `formatActivityTime` already guards invalid dates; tests document behavior

### Remaining risks

- No dedicated invoice detail route — finance link lands on hub with `highlight` query (page may need to read param later).

### Recommended next phase

- Handle `?highlight=` on finance page to scroll/select invoice.
- Add `FINANCE` category to `ActivityEventCategory` if feed filtering by finance is required.

---

## P3 — Finance

### Status

- **Manual tax preserved** — no changes to `FinanceSettings`, invoice overrides, or auto-tax logic in this pass.
- Existing `src/lib/finance` and components untouched.

### Recommended next phase

- Partial payments UI, overdue badges, PDF/print stubs — continue in `src/components/finance` only.

---

## P4 — Page-by-page QA

### Sample critical paths (code review)

| Page | Loading | Empty | Error |
|------|---------|-------|-------|
| `/dashboard` | Query `isLoading` | Component-level | Query error boundary |
| `/finance` | React Query | Invoice list empty states | try/catch on mutations |
| `/activity-logs` | Skeleton block | `ActivityEmptyState` | Inline retry |
| `/leads` | Existing patterns | Preserved | Preserved |
| `/login` | Auth kernel gate | N/A | Toast on failure |

### Recommended next phase

- Browser pass with authenticated session on localhost.

---

## P5 — Observability (light touch)

### Files modified

- `src/lib/observability/correlation.ts` — client correlation IDs
- `src/lib/api-client.ts` — sends `X-Correlation-Id` on each request
- `src/lib/auth/dev-auth-log.ts` — structured dev auth lines

### Remaining risks

- Server routes do not yet uniformly echo correlation ID in responses (some use `api-handler` `X-Request-Id`).

### Recommended next phase

- Read `X-Correlation-Id` in `api-handler` and attach to structured logs.

---

## P6 — Performance

### Files modified

- `src/components/activity-logs/activity-log-row.tsx` — `React.memo` on row component

### Recommended next phase

- `useMemo` on heavy finance invoice tables if rerender profiling shows hotspots.

---

## P7 — Testing

### Files added

| Test file | Coverage |
|-----------|----------|
| `src/lib/activity-logs/__tests__/format-time.test.ts` | Invalid dates, ISO parse |
| `src/lib/auth/__tests__/extract-token.test.ts` | Cookie vs Bearer priority |

### Execution status

- **Not run** in agent environment: missing `jsdom` / `jest-environment-jsdom`.
- Existing `src/lib/finance/__tests__/tax.test.ts` unchanged.

### Recommended next phase

- `npm i -D jsdom jest-environment-jsdom` and run vitest with `environment: 'node'` for server-only tests.

---

## Summary

| Priority | Status | Notes |
|----------|--------|-------|
| P0 Auth | **Done** | Refresh on 401, dev auth logs, context fix |
| P1 Stability | **Partial** | Notification date safety |
| P2 Activity logs | **Done** | Humanize, links, timeline, export |
| P3 Finance | **No code change** | Preserved manual tax |
| P4 QA | **Review only** | Browser verification pending |
| P5 Observability | **Partial** | Correlation + dev auth logs |
| P6 Performance | **Partial** | Activity row memo |
| P7 Testing | **Added** | Tests need jsdom/node env |

---

## Reference docs

Prior audit/migration docs referenced in the task (`docs/AUDIT-FLUENTIVE-PLATFORM.md`, `docs/MIGRATION-BASELINE.md`) were **not present** in the repo at pass time. This report serves as the current baseline.
