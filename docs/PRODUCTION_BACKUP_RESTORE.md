# Production backup and disaster-recovery runbook

Status: **DR-01 is not closed**. This document defines the approved pilot
design and safety gates. It does not authorize a Production export, a Supabase
mutation, or creation of a Supabase restore project.

Official references used for this design:

- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase restore to a new project](https://supabase.com/docs/guides/platform/clone-project)
- [Supabase Storage object download](https://supabase.com/docs/guides/storage/management/download-objects)
- [Supabase Storage S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
- [restic repository setup](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html)
- [restic restore](https://restic.readthedocs.io/en/stable/050_restore.html)
- [restic repository checks](https://restic.readthedocs.io/en/stable/045_working_with_repos.html#checking-integrity-and-consistency)

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
cleanup plan. No restore project, retention policy, backup schedule, tool
installation, or destructive cleanup is implicit in this runbook.

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

## 6. Pilot backup architecture

**Scheduled Production database backup availability: VERIFIED - Supabase Pro.**
The Supabase-managed automatic physical backup exists and remains the pilot's
database backup layer. **Database restore proof: NOT VERIFIED - isolated
restore not yet performed.** Database recoverability is therefore not verified.
No independent logical database export is configured or claimed.

**Storage backup: LOCAL ENCRYPTED RESTIC REPOSITORY ON SSD.** The approved
destination is a dedicated directory on the owner's personal SSD. The SSD
remains a normal shared volume: it is not repartitioned, reformatted, or
encrypted as a whole. restic encrypts and authenticates only repository
content before writing it to disk. No home-grown cryptography is permitted.

The repository is initialized at `D:\Clikarage-DR\repository` on the confirmed
NTFS volume `L3ziz`. A synthetic backup/check/restore rehearsal succeeded with
restic 0.19.1. The test snapshot was forgotten and pruned, so the initialized
repository is empty and contains no Production or Staging data.

**Off-site backup: NOT IMPLEMENTED - ACCEPTED PILOT RESIDUAL RISK.** Loss,
theft, ransomware, or simultaneous failure affecting the workstation and SSD
can therefore remove this Storage recovery layer. This must not be described
as geographic redundancy or disaster isolation.

Before the first Storage payload export, obtain separate approval naming the
Production project, allowed buckets, local plaintext staging directory,
repository destination, cleanup plan, and verification evidence.

On 2026-08-12, an approved read-only Production inventory returned HTTP 200
and a complete empty array for each tracked bucket. This is a **valid empty
inventory**, not a backup failure: `source_object_count = 0` and
`source_total_bytes = 0`. No payload download was required and no empty
Production restic snapshot was created merely to satisfy a test. This proves
the authenticated bucket and object-list inventory path only. It does **not**
prove the download, checksum, snapshot, or restore path for a real Production
payload.

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

Proposed daily Storage sequence after approval:

1. inventory the exact authorized bucket set and record aggregate count/bytes;
2. treat HTTP 200 plus a complete zero-object inventory as a successful empty
   source state, record `0` objects and `0` bytes, and stop without download,
   plaintext staging, or snapshot;
3. when at least one payload exists, create a restricted temporary workspace
   outside the repository and download only the authorized payload tree;
4. produce a private manifest without customer data;
5. create a dedicated restic snapshot with environment and date tags;
6. verify snapshot presence, file count, checksums, and repository integrity;
7. remove only that run's plaintext staging after independent verification;
8. record success or alert failure in the controlled backup register.

The first real Production Storage backup must run after at least one payload
appears or during the next approved DR drill. Until then, the synthetic restic
backup/check/restore remains the only proof of the local encrypted repository
mechanism. DR-01 remains open.

## 8. Backup manifest

Use `docs/BACKUP_MANIFEST_TEMPLATE.json` as a schema example only. The actual
manifest lives in the controlled backup register, not Git. It records backup
identity, source environment/reference, Git SHA, timestamps, backup type,
aggregate Storage verification, encrypted archive checksum, encryption method,
key reference, tool versions, operator, destination identifier, retention
expiry, and verification state. It contains no credentials or customer data.

## 9. Retention

| Class | Target | Current state |
| --- | --- | --- |
| Supabase-managed database points | Platform-visible window | Seven visible points; one date gap observed |
| Independent database snapshots | None for pilot | Supabase Pro remains the database layer |
| Local encrypted Storage snapshots | 30 days | No Production snapshot: source inventory is valid and empty |
| Off-site snapshots | None | Accepted pilot residual risk |
| Disposable restore project | Delete only after evidence review and approval | None created |

No immutable retention or off-site lifecycle exists in this pilot design.
Apply the proposed 30-day Storage retention only through a reviewed restic
`forget`/`prune` policy after real backup scheduling is separately authorized.
The synthetic rehearsal proved those maintenance operations on test data only;
it did not authorize deletion of a real snapshot.

## 10. Verification cadence

- Database: inspect the newest Supabase restore point daily; alert on age over
  24 hours or a missing expected point.
- Storage export: daily after the local SSD process is explicitly activated.
- Empty Storage source: inventory and record `0` objects / `0` bytes; do not
  create an empty snapshot solely as proof of a payload backup.
- First real Storage backup: after at least one Production payload appears or
  during the next approved DR drill.
- Backup health: verify expected restic snapshots and run structural
  `restic check` at least weekly.
- Integrity: run `restic check --read-data` on a controlled cadence (proposed
  monthly) after evaluating local duration and SSD health.
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

An expected, complete HTTP 200 inventory of zero objects is not a missing
bucket or object-count variance. It is a valid empty source state and must be
recorded without manufacturing an empty Production snapshot.

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

## Credential model for the local restic repository

- Keep the restic repository password in the owner's personal password manager,
  never in Git, chat, command arguments, logs, or a persistent environment
  variable.
- The local automation uses a Windows DPAPI CurrentUser blob outside the
  repository and a password-command helper that decrypts only in process memory.
- The password manager copy and DPAPI blob are separate recovery dependencies.
  Losing both makes the encrypted repository unrecoverable.
- Rotate access independently by adding and validating a new restic repository
  key before removing the old key. A rotation is a separately reviewed
  maintenance operation.
- Do not copy the DPAPI blob as if it were a portable recovery key: it is bound
  to the Windows user context. Any portable recovery procedure must rely on the
  separately protected password-manager record.

## Cost and operational risks

Expected pilot costs are the existing Supabase Pro plan, local SSD capacity,
temporary local staging space, a future disposable Supabase restore project,
and operator time. No additional cloud backup service is configured.

Main risks are single-site SSD loss or theft, ransomware, media failure,
forgotten repository passwords, missed daily jobs, incomplete Storage export,
unbounded repository growth, and unmeasured end-to-end restore time. The real
payload download path remains unverified while Production Storage is empty.
Each remains a gate until a non-empty Production-authorized Storage export (or
the next approved DR drill with representative payloads) and a disposable
end-to-end drill succeed.
