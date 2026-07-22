# Prisma migration baseline (brownfield / P3005)

This document records the **safe production baseline** applied to the Fluentive Supabase database without `prisma migrate reset` or data destruction.

## Root cause of P3005

| Factor | Detail |
|--------|--------|
| **Error** | `P3005: The database schema is not empty` |
| **Cause** | The database was built over time via legacy SQL under `migrations/` (and ad-hoc changes). Prisma Migrate had **never** run, so `_prisma_migrations` did not exist. |
| **Trigger** | `npx prisma migrate deploy` on a non-empty database with no migration history. |
| **Extra risk** | `20260507212813_sync_core_schema` is a **stub** (creates `User`/`Lead`/`Deal` with PascalCase). Running it on production would conflict with the live schema (`users`/`invoices`/snake_case tables). It must be **resolved as applied**, not executed. |

## Migration inventory (`prisma/migrations`)

| Migration | Purpose | Run on prod? |
|-----------|---------|----------------|
| `20260507000000_baseline_existing_db` | Empty marker; establishes Prisma history | `migrate resolve --applied` only |
| `20260507212813_sync_core_schema` | Historical stub; does not match live DB | `migrate resolve --applied` only |
| `20260523120000_finance_manual_tax` | Finance tax settings + nullable invoice columns | `migrate deploy` (additive) |

Legacy folder: `migrations/` at repo root (older history). Prisma’s canonical path is `prisma/migrations` per `prisma.config.ts`.

## Tax migration safety verdict (`20260523120000_finance_manual_tax`)

**SAFE / additive-only** for existing invoice data:

- Creates `TaxMode` enum and `finance_settings` table (new).
- Adds nullable columns: `invoices.taxRatePercent`, `taxModeOverride`, `taxEnabledOverride`.
- Adds `invoices.discountAmount` with `DEFAULT 0` (existing rows get 0).
- Adds `invoice_items` tax columns with defaults where NOT NULL.
- **No** `DROP COLUMN`, **no** destructive `ALTER`, **no** forced NOT NULL without defaults.

## Commands executed (2026-05-23)

Environment: `DATABASE_URL` pointed at Supabase pooler (`aws-0-eu-west-1.pooler.supabase.com`).

```bash
# 1. Inspect
npx prisma migrate status
# → 2 pending migrations; DB not baselined

# 2. Reproduce P3005
npx prisma migrate deploy
# → Error P3005 (schema not empty, no _prisma_migrations)

# 3. Baseline (no DDL)
npx prisma migrate resolve --applied 20260507000000_baseline_existing_db
npx prisma migrate resolve --applied 20260507212813_sync_core_schema

# 4. Apply additive finance migration only
npx prisma migrate deploy
# → Applied 20260523120000_finance_manual_tax successfully

# 5. Post-check
npx prisma migrate status   # Database schema is up to date!
npx prisma generate
npx tsx scripts/check-db-state.mjs
# → finance_settings: true, _prisma_migrations: true
```

### Commands that must **never** be used on production data

```bash
npx prisma migrate reset   # DESTROYS DATA — forbidden
```

### `migrate dev` note

`npx prisma migrate dev` failed with **P3006/P3018** on the shadow DB because `sync_core_schema` does not match the full datamodel and `finance_manual_tax` expects `invoices` only after prior evolution. Use **`migrate deploy`** + **`migrate resolve`** for brownfield DBs, not `migrate dev` against production.

## Drift check (optional)

To compare live DB vs `schema.prisma` without applying:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

After finance deploy, remaining diff may still include enum value additions (`ActivityType`, `LeadStatus`) not in the finance migration—schedule separately if needed.

## Production runbook (other environments)

For each **existing** Supabase/Postgres instance with data:

1. Backup database (Supabase dashboard or `pg_dump`).
2. Confirm `invoices` exists and `finance_settings` does not (or skip deploy if already applied).
3. Deploy migration files including `20260507000000_baseline_existing_db`.
4. Run resolve + deploy sequence from above.
5. `npx prisma generate` on app servers / CI.
6. Smoke-test: `GET /api/finance/settings` (authenticated, org context).

If `DATABASE_URL` is unavailable locally, run the same resolve/deploy steps in CI or a bastion with secrets—**do not** reset.

## Post-migration verification

- [x] `_prisma_migrations` table created
- [x] `finance_settings` table exists
- [x] `invoices` / `invoice_items` retain existing rows; new columns nullable or defaulted
- [x] `npx prisma migrate status` → up to date
- [ ] App: finance settings page loads (requires valid session + `organizationId` on user)
- [ ] App: activity log timestamps show `—` when unparseable (see `src/lib/activity-logs/format-time.ts`)

## Helper script

`scripts/check-db-state.mjs` — lists public tables and checks `_prisma_migrations`, `invoices`, `finance_settings`.
