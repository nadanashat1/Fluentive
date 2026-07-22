# Fluentive platform audit (living document)

## Post-migration verification (2026-05-23)

### Prisma / finance schema

- **P3005 resolved** via baseline + `migrate resolve` for stub `sync_core_schema`; finance tax migration deployed additively.
- See [MIGRATION-BASELINE.md](./MIGRATION-BASELINE.md) for commands and production runbook.
- Live DB now includes `finance_settings`; invoice tax columns are backward-compatible.

### Auth (finance settings 401)

- **API**: `requireAuth` reads `accessToken` cookie or `Authorization: Bearer` (`src/lib/server/auth.ts`).
- **Client**: `src/lib/api-client.ts` sends `credentials: "include"` and retries once after `/api/auth/refresh` on 401.
- **Fix applied**: cookie refresh is attempted even when `AuthKernel` is still `ANONYMOUS` (direct navigation before bootstrap).
- **Remaining env checks**: user must have `organizationId` or settings API returns 400; access token TTL 15m—refresh cookie must be present.

### Activity logs

- Invalid/missing timestamps render as `—` (`formatActivityTime` in `src/lib/activity-logs/format-time.ts`).

### Dual migration paths

| Path | Role |
|------|------|
| `migrations/` (root) | Legacy SQL history; pre-Prisma |
| `prisma/migrations/` | Canonical Prisma Migrate; use going forward |

Do not run `sync_core_schema` SQL on production—it is marked applied for history only.
