# DR-01 recovery evidence

This file contains repository-safe operational evidence only. It contains no
credentials, customer identifiers, object paths, or record values.

## Evidence record: 2026-08-11

| Field | Result |
| --- | --- |
| Inspection UTC | 2026-08-11T18:35:30Z |
| Frozen/source Git SHA | `6634686b4544bac41f1ad6f004beadfc31769966` |
| Source environment | Production |
| Supabase plan | Pro |
| Scheduled Production database backup verified | YES |
| Latest backup UTC | 2026-08-11T03:37:12Z |
| Latest backup age at inspection | Approximately 14 hours 58 minutes |
| Visible restore points | 7 physical restore points spanning 2026-08-04 to 2026-08-11 |
| PITR enabled | NO |
| External encrypted backup verified | NO |
| Storage payload backup verified | NO |
| Disposable restore performed | NO |
| Database schema match | NO - not tested |
| Auth aggregate match | NO - not tested |
| Critical business aggregate match | NO - not tested |
| Storage bucket match | NO - not tested |
| Storage object match | NO - not tested |
| Security/RLS invariant checks | NOT RUN on a restore target |
| Measured full-service RTO | Not measured |
| Achieved database RPO | Not proven continuously |
| Achieved Storage RPO | Not proven |
| Operator | Codex, with human Dashboard validation |
| Independent reviewer status | Pending |

## Deviations and interpretation

- No restore point dated 2026-08-07 was visible. The visible window therefore
  does not demonstrate an uninterrupted historical database RPO of 24 hours.
- Supabase scheduled database backup verification does not cover actual Storage
  payloads.
- The approved external destination is Backblaze B2, but no bucket, App Key,
  lifecycle, Object Lock policy, restic repository, export, or schedule has been
  created or activated.
- DR-01 remains open until an encrypted database and Storage backup is created,
  checked, restored to a disposable target, compared, and timed end to end.

## Current decision

`scheduled Production DB backup verified = PASS`

`DR-01 = NOT CLOSED`
