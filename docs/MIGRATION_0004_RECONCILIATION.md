# Migration 0004 reconciliation

## Cause

The historical migration now named `20260613125843_seed.sql` originally mixed demonstration fixtures with migration history. Its `client_vehicles` insert declared `fuel, mileage` but supplied `98000, 'Diesel'`, so a clean PostgreSQL bootstrap attempted to cast `Diesel` to an integer and failed.

## Resolution

`20260613125843_seed.sql` keeps the exact migration version recorded in production and remains an intentional no-op marker. All useful fictitious records were moved to `supabase/seed.sql`, where they run after the complete schema and use deterministic identifiers plus conflict handling. The obsolete anonymous pending request was not moved because the current seed already contains explicit independent-garage lifecycle scenarios.

The moved fixtures include the independent organization, its three presentation accounts, memberships, client profile defaults, catalog, news, hours, CRM customers and vehicles, tasks, and the corrected client vehicle (`fuel = 'Diesel'`, `mileage = 98000`). The three historical accounts were merged into the existing fixture CTE, preserving a total of 14 unique local users.

## Why the historical file changed

Applied remote migrations are not replayed: Supabase records their versions in migration history. This exceptional repository reconciliation does not repair or alter remote history. It makes a new database built from the repository reproducible while keeping the `0004` identifier present and separating schema history from optional local data.

## Local verification

Run only against the local Supabase stack after confirming the API and database hosts are loopback addresses:

```powershell
npx supabase stop --no-backup
npx supabase start
npx supabase db reset
npm.cmd run test
npm.cmd run test:rls
```

The reset must apply all 30 migration files and then `supabase/seed.sql` without a copied migration, manual SQL, migration repair, or remote database target.

No production data, migration history, configuration, or Supabase resource was modified by this reconciliation.
