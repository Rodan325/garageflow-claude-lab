# Production backup and isolated restore plan

This runbook prepares a future production migration window. It does not authorize a database push, a migration-history repair, a production seed, or a restore on the production project.

## Safety gate

1. Confirm the expected production project reference and database host without printing credentials.
2. Keep all nine schema-dependent feature flags disabled.
3. Create the backup outside the repository, for example under a restricted temporary directory.
4. Never use `db reset`, `--include-seed`, or `migration repair` against production.

## Encrypted backup set

Use a password supplied interactively by an approved secret manager. Do not place it in shell history or an environment file committed to Git.

```powershell
$backupRoot = Join-Path $env:TEMP ("clikarage-backup-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupRoot | Out-Null
npx.cmd supabase db dump --linked --schema-only --file (Join-Path $backupRoot 'schema.sql')
npx.cmd supabase db dump --linked --role-only --file (Join-Path $backupRoot 'roles.sql')
npx.cmd supabase db dump --linked --data-only --use-copy --file (Join-Path $backupRoot 'data.sql')
```

Archive and encrypt the three dumps with an approved local encryption tool, then calculate a SHA-256 checksum for the encrypted archive. Store the archive, checksum, encryption-key reference, project reference, CLI version and creation time in the controlled backup register. Never commit the archive.

Auth users are stored in the `auth` schema and require an explicitly reviewed backup scope. Before relying on the dump, verify that user identities and required Auth metadata are included without exporting credentials into logs. Record aggregate user counts only in the validation report.

Storage needs two separate records: database metadata from `storage.objects` and the object payloads from every bucket. Export object payloads through a privileged server-side process to an encrypted archive, preserving bucket name and object path. Do not make a private bucket public to perform the export.

## Isolated restore rehearsal

1. Create a dedicated empty Supabase test project that is neither staging nor production.
2. Restore roles, schema and data in that order with `psql` using an ephemeral connection string.
3. Restore Storage payloads to matching private/public bucket settings.
4. Compare aggregate counts for Auth users, organizations, centers, requests, quotes, vehicles, clients and Storage objects.
5. Run migration history inspection, RLS/RPC/Storage tests and smoke tests with all feature flags disabled.
6. Destroy the isolated restore project after the approved retention period.

The backup is **not verified** until the encrypted archive checksum succeeds, the isolated restore completes, aggregate counts match, and application access tests pass. Additive migrations are rolled back logically by keeping feature flags off; a physical database rollback uses the verified isolated restoration procedure and a separately approved incident decision.
