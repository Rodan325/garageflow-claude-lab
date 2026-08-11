# Production backup and disaster-recovery runbook

Status: **DR-01 is not closed**. This document defines the approved design and
safety gates. It does not authorize a Production export, a Backblaze mutation,
tool installation, or creation of a Supabase restore project.

Official references used for this design:

- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase restore to a new project](https://supabase.com/docs/guides/platform/clone-project)
- [Supabase Storage object download](https://supabase.com/docs/guides/storage/management/download-objects)
- [Supabase Storage S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
- [Backblaze B2 data regions](https://www.backblaze.com/docs/cloud-storage-data-regions)
- [Backblaze B2 Object Lock](https://www.backblaze.com/docs/cloud-storage-object-lock)
- [Backblaze B2 with restic](https://www.backblaze.com/docs/cloud-storage-integrate-restic-with-backblaze-b2)
- [restic repository setup](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html)

## 1. Purpose

This is the canonical Clikarage recovery runbook. It covers database, Auth,
Storage payloads, bucket configuration, project configuration, application
connectivity, and security invariants. A backup is **not verified** until a
successful restore has been demonstrated on an isolated disposable target.

## 2. Production safety boundary

Never restore directly onto Production during a rehearsal. Production is never
a rehearsal target. Staging is not disposable and must never be overwritten,
reset, restored into, or repurposed for disaster recovery.

No Production read/export begins without a human approval naming the exact
target, data classes, destination, encryption method, expected duration, and
cleanup plan. No restore project, bucket, key, retention rule, lifecycle rule,
tool installation, or destructive cleanup is implicit in this runbook.

The following are prohibited as routine recovery actions: database reset,
migration-history repair, seed inclusion, in-place Production restore, object
deletion/synchronization with delete semantics, and project deletion. A real
incident requiring a destructive action needs a separate human approval.

## 3. Target verification

Before any approved operation, record without secrets:

1. environment name and expected project reference;
2. project health and PostgreSQL version;
3. current Git SHA and migration count;
4. whether the action is read, export, restore, or validation;
5. output destination and retention deadline;
6. operator and approving person;
7. confirmation that neither a cached CLI link nor `supabase/.temp` state is
   authorization to access a hosted project.

Use an explicit connection or an explicitly selected Dashboard project. Abort
when identity is ambiguous. Never use `--linked` as proof of the target.

## 4. RPO and RTO

Pilot targets, not current claims:

| Scope | Target | Verified achievement |
| --- | --- | --- |
| Database | RPO <= 24 hours | Not yet proven continuously; one visible daily restore point was missing |
| Storage payloads | RPO <= 24 hours | Not active or proven |
| Full service | RTO <= 4 hours | Not measured |

Full service includes database, Auth aggregates, Storage payloads and bucket
configuration, project configuration, critical RLS/RPC behavior, and
application connectivity. Never claim RTO from a database-only restore.

## 5. Supabase Pro automatic database backup

Layer A is the Supabase-managed daily database backup. On 2026-08-11, the
Production Dashboard showed seven physical restore points spanning 2026-08-04
through 2026-08-11, but no point dated 2026-08-07 was visible. PITR was disabled.
The latest point was current enough for the immediate health gate, but this
does not prove an uninterrupted historical database RPO of 24 hours.

Dashboard backups cover the database, including database-resident Auth and
Storage metadata. They do not contain the actual Storage object payloads.

## 6. Independent encrypted backup

Layer B is a proposed off-platform logical backup stored in a dedicated private
Backblaze B2 bucket through its S3-compatible API. The proposed bucket name is
non-sensitive and globally unique, for example `clikarage-dr-eu-<random-suffix>`;
it must not contain a Supabase project reference, customer name, or environment
credential.

Use B2 EU Central when the approved B2 account is provisioned in that region.
It stores data in Amsterdam, keeps data in Europe, and is geographically
separate while close to the Production region in Paris. B2 fixes the data
region at account creation, so abort if the approved account is in another
region until the owner accepts that residency decision.

The proposed client is a pinned, verified restic release using the B2
S3-compatible endpoint. restic encrypts and authenticates repository content
client-side before upload. B2 SSE-B2 is a second server-side encryption layer.
No home-grown cryptography is permitted.

This layer is **not active**. Before the first export, obtain separate approval
for the bucket, App Keys, restic installation, and sensitive Production read.

## 7. Storage backup

Database rows in `storage.buckets` and `storage.objects` are metadata only.
Actual payloads require a separate daily export through supported Supabase
Storage APIs or the S3-compatible interface. Never make a private bucket public
and never write directly to the `storage` schema to restore files.

Tracked buckets:

| Bucket | Expected access | Use | Payload classification |
| --- | --- | --- | --- |
| `garage-logos` | Public | Garage branding images | Business/public media |
| `service-request-attachments` | Private | Request images, video, PDF, text and CSV attachments | Potentially sensitive customer, vehicle and workshop data |

The backup must preserve bucket identity, public/private state, MIME metadata,
object path, payload, aggregate object count, and a payload checksum where
feasible. Do not place real object paths, filenames, UUIDs, or counts in Git.

Proposed daily sequence after approval:

1. create a restricted encrypted temporary workspace outside the repository;
2. export an authorized logical database backup and Storage payload tree;
3. produce a manifest without customer data;
4. submit both classes to separate restic snapshot paths/tags;
5. verify snapshot presence and repository integrity;
6. remove only that run's plaintext staging after independent verification;
7. record success or alert failure in the controlled backup register.

## 8. Backup manifest

Use `docs/BACKUP_MANIFEST_TEMPLATE.json` as a schema example only. The actual
manifest lives in the controlled backup register, not Git. It records backup
identity, source environment/reference, Git SHA, timestamps, backup type,
aggregate Storage verification, encrypted archive checksum, encryption method,
key reference, tool versions, operator, destination identifier, retention
expiry, and verification state. It contains no credentials or customer data.

## 9. Retention and Object Lock

| Class | Target | Current state |
| --- | --- | --- |
| Supabase-managed database points | Platform-visible window | Seven visible points; one date gap observed |
| External database snapshots | 30 days | Proposed, not configured |
| External Storage snapshots | 30 days | Proposed, not configured |
| Disposable restore project | Delete only after evidence review and approval | None created |

Create the B2 bucket as PRIVATE. Enable Object Lock only after an explicit
approval acknowledging that it cannot later be disabled. For the pilot,
Governance mode is preferred over Compliance: it protects retained objects but
still permits an authorized recovery from a policy mistake. The daily backup
key must not receive `bypassGovernance`, bucket-retention administration,
lifecycle administration, or account administration.

Do not configure a blanket 30-day default retention until a disposable restic
compatibility rehearsal proves that repository lock cleanup, `forget`, and
`prune` behave safely. Locked object versions can block deletion and lifecycle
rules until expiry. If blanket locking is incompatible, retain immutable daily
encrypted export archives under a separate prefix while keeping restic's
repository metadata operational; document the tested design before activation.

Lifecycle rules must remove only expired, unlocked historical versions after
the 30-day target and must be tested against Object Lock. No lifecycle rule is
currently active or claimed.

## 10. Verification cadence

- Database: inspect the newest Supabase restore point daily; alert on age over
  24 hours or a missing expected point.
- Database and Storage export: daily after the B2 process is activated.
- Backup health: verify expected restic snapshots and run structural
  `restic check` at least weekly.
- Integrity: run `restic check --read-data` on a controlled cadence (proposed
  monthly) after evaluating B2 read/API cost and duration.
- Restore drill: before the first garage, after material DR changes, and at
  least quarterly during the pilot.

None of the external schedules is active until its first monitored run succeeds.

## 11. Disaster declaration

An owner or incident commander declares recovery, identifies the incident
scope, freezes unsafe deployments, selects the newest verified database and
Storage recovery points, records T0, and approves costs and temporary resources.
If source integrity is uncertain, preserve evidence and choose an older verified
point. Never improvise a Production write.

## 12. Restore-to-new-project procedure

The preferred drill is Supabase **Restore to a New Project**, never restore in
place. Before creation, stop for explicit approval with the source timestamp,
Production reference, proposed `clikarage-dr-restore-YYYYMMDD` name, same-region
placement, displayed cost, expected lifetime, deletion plan, and statement that
Production and Staging remain untouched.

The target must be new, disposable, disconnected from Vercel, real domains,
email/SMS providers, webhooks, billing, and real users. Record T1 when creation
starts and T2 when the database is ready. Do not activate outbound integrations.

## 13. Database verification

Use read-only catalog and aggregate checks on the clone. Compare migration
history, schemas, tables, columns, constraints, indexes, sequences, functions,
function security/search paths, triggers, RLS state, policies, grants, and
extensions. Compare only approved aggregates for Auth and critical business
entities. Do not log in as a customer, reveal identities, or run fixture-writing
RLS suites against Production-derived data. Record T3 after verification.

## 14. Storage restore

Restore the selected restic snapshot into a restricted temporary workspace,
validate the repository and recorded checksums, recreate bucket configuration
on the disposable project, and upload payloads using supported Storage/S3 APIs.
Preserve private/public expectations. Compare bucket set, aggregate object
counts, and integrity samples without exposing names or paths. Record T4 only
after both metadata and payload verification pass.

## 15. Auth and configuration reconstruction

Database restore may include Auth database records, but project-level settings
must be reconstructed from a secret-free checklist. Validate Auth aggregates
only. Recreate approved redirect/config settings without Production secrets.

Inventory and reconfigure, without triggering them:

- Edge Functions: `generate-vehicle-ad`, `repair-summary`, and
  `request-to-appointment`;
- Auth providers, redirect allowlists, JWT expiry, email/SMS behavior;
- Storage bucket settings and limits;
- Realtime settings and publications;
- required extensions, project settings, and non-secret environment names.

Do not deploy Production secrets or connect outbound providers for a drill.

## 16. Application recovery

Use an isolated application instance with disposable credentials only. Verify
startup, database connectivity, safe Auth structure, public catalog access,
critical owner/client read paths, and absence of unexpected 5xx errors. Do not
connect Production or Staging domains. Record T5 when critical validation is
complete; full recovery duration is T5 minus T0.

## 17. RLS and security verification

Perform read-only catalog assertions for RLS enablement, policy/grant inventory,
SECURITY DEFINER search paths, RPC ACLs, Storage policy presence, and cross-tenant
invariants. Never run a suite that writes fixtures against Production-derived
data. Use a separate sanitized target for destructive authorization tests.

## 18. Rollback and abort conditions

Abort on ambiguous target identity, missing approval, checksum failure, partial
export, missing bucket, unexpected object-count variance, schema mismatch,
outbound integration risk, plaintext outside the restricted workspace, secret
exposure, or an RTO trajectory over four hours. Do not repair migration history
or overwrite Production. Preserve logs without secrets and escalate.

## 19. Evidence

Update `docs/DR_EVIDENCE.md` with repository-safe results and the controlled
backup register with operational details. Evidence must distinguish target,
configured, observed, and proven states. A dashboard backup alone does not prove
Storage recovery or full-service RTO.

## 20. Disposable-project cleanup

Do not automatically delete the restore project. Report purpose, health, cost,
evidence status, and retention deadline, then request explicit deletion
authorization. After approval, delete only the verified disposable project and
its temporary artifacts. Never delete Production or Staging.

## Credential model for the proposed B2/restic process

- Use a standard B2 App Key, never the master key.
- Scope the daily key to the dedicated private bucket and backup prefix. Grant
  only list/read/write/delete capabilities required by tested restic behavior;
  no account, bucket, lifecycle, retention, legal-hold, or governance-bypass
  administration.
- Use a separate read-only verification/restore key where supported.
- Keep any rare maintenance key separately controlled and inactive by default.
- Store the B2 key and restic password in an approved secret manager, never in
  Git, chat, command arguments, or logs.
- Keep the restic repository password independent of the B2 App Key. Prefer an
  approved password file/command integration over a plaintext environment value.
- Rotate B2 App Keys at least every 90 days and immediately after suspicion;
  validate the replacement before revoking the old key.
- Rotate restic access independently by adding and validating a new repository
  key before removing the old one. Losing all restic keys makes recovery
  impossible.

## Cost and operational risks

Expected cost classes are B2 retained storage and versions, API transactions,
integrity-read/restore egress beyond any current allowance, Supabase's temporary
paid restore project, local encrypted staging space, and operator time. Confirm
current prices in each provider console before activation; no cost is approved
by this document.

Main risks are an irreversible Object Lock configuration, lock/lifecycle/restic
interaction, forgotten repository passwords, broad or leaked App Keys, missed
daily jobs, incomplete Storage export, hidden version growth, and unmeasured
restore time. Each remains a gate until a disposable end-to-end drill succeeds.
