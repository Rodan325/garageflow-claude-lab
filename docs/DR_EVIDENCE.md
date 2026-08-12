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
| Scheduled Production database backup availability verified | YES |
| Latest backup UTC | 2026-08-11T03:37:12Z |
| Latest backup age at inspection | Approximately 14 hours 58 minutes |
| Visible restore points | 7 physical restore points spanning 2026-08-04 to 2026-08-11 |
| PITR enabled | NO |
| Local encrypted restic repository initialized | YES - synthetic data only |
| Synthetic restic backup/check/restore | PASS |
| Synthetic source/restored SHA-256 | MATCH |
| Synthetic snapshot retained | NO - forgotten and pruned after verification |
| Off-site backup implemented | NO - accepted pilot residual risk |
| Storage payload backup verified | NO |
| Production Storage bucket inventory | PASS - exact tracked bucket set |
| Production Storage object inventory | PASS - valid empty inventory |
| Production Storage source objects | 0 |
| Production Storage source bytes | 0 |
| Production payload download path verified | NO - no payload existed |
| Production Storage snapshot created | NO - not required for an empty source |
| Disposable restore performed | NO |
| Database restore proof | NOT VERIFIED - isolated restore not yet performed |
| Database recoverability | NOT VERIFIED |
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
- On 2026-08-12, one approved read-only list request per tracked bucket returned
  HTTP 200 with a complete empty array. The valid source baseline is therefore
  `source_object_count = 0` and `source_total_bytes = 0`.
- No payload download or Production restic snapshot was needed for that empty
  source. The result proves inventory handling only and does not prove the real
  Production payload download/checksum path.
- The approved Storage destination is the local encrypted restic repository on
  the owner's SSD. It is initialized and synthetically verified, but contains
  no Production or Staging data and has no active schedule.
- No off-site copy exists. Workstation/SSD co-failure, theft, and ransomware
  remain accepted pilot risks and must not be represented as mitigated.
- DR-01 remains open. The first real Production Storage backup must run after
  at least one payload appears or during the next approved DR drill, and a full
  database-plus-Storage recovery must still be checked, compared, and timed end
  to end on an isolated disposable target.

## Current decision

`scheduled Production DB backup verified = PASS`

`Scheduled Production database backup availability = VERIFIED - Supabase Pro`

`Database restore proof = NOT VERIFIED - isolated restore not yet performed`

`Database recoverability = NOT VERIFIED`

`Storage backup = LOCAL ENCRYPTED RESTIC REPOSITORY ON SSD (SOURCE INVENTORY VALID AND EMPTY; SYNTHETIC RESTIC TEST ONLY)`

`Off-site backup = NOT IMPLEMENTED - ACCEPTED PILOT RESIDUAL RISK`

`DR-01 = NOT CLOSED`
