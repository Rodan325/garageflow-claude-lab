import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations')

const historicalMigrations = [
  ['20260613125606_init_schema.sql', 'b92a93565e9be4ae3322fb2cc252805e1439df75d07b44f9e24a77f17a9f4f47'],
  ['20260613125631_functions_triggers.sql', '1721f2d5d5911f9dfcd2c1120b4abd01286b3eda3f23330f98eaef556d34279f'],
  ['20260613125656_rls.sql', 'a41da9744dd173d8381930029ef0315276a14e31f2476a4cfe02fa66f6cbfcb7'],
  ['20260613125843_seed.sql', 'cd59d599e93ac5d4dd04df85fb3c4c8f313013cee18f4c7d93780ed25bc1ef58'],
  ['20260613130039_harden_functions.sql', 'cec71375c6486ed0c7f204de5bb374332436618b26d032643f5fea73a9ab2847'],
  ['20260613130254_revoke_function_grants.sql', '1f5bfa2a7252bfdf623a0c17b68c0b89376cfb23490c5c3747e840bee2c479cb'],
  ['20260614195323_lock_client_request_updates.sql', '63c143a65bce4b1815fec6389d18bb23e3dce7d7c6193c51f5f4cdf187fc63b8'],
  ['20260614195352_catalog_branding_storage.sql', '7f14633006356e5a9679e5f1d9e1b905a4048ce6347e51e3a4bcf9118357610e'],
  ['20260614200407_quote_snapshot_fields.sql', '4b60cf0b6de11a26d240f8d8c879bf2897df9a427be16c49850d53297e0edf5d'],
  ['20260614201258_logos_no_listing.sql', '1d0c8f34f42a67d53bdd0ff56a7a51ced951dadde63415f5fc8ab92b68e9b022'],
  ['20260615172402_quote_numbering_snapshot.sql', 'f6d2308635cc721c451454844fbb98d876eae796375240ab65dedb8cb56ce9ee'],
  ['20260616005424_quote_transactions.sql', '905daad0359225261a631e9c72dee944bea263d4479afa703372d17a6b6e0a23'],
  ['20260616011744_quote_server_authoritative.sql', 'd80cf023fee0953ec782032d63be9d5b635b0ec0d3dea581d4ff793fc579b7a9'],
  ['20260617191239_quote_lifecycle.sql', 'a995f1d44cdc52c4cde81ee508d99c3d6c37f0a7546fd12082c0b30747894c78'],
  ['20260617192653_quote_status_values.sql', 'abda349213398efb70decafec2c1fe31a47fff218a5946b7f79e2fa0da43d994'],
  ['20260619004100_send_quote_requires_validity.sql', 'b91ce6adf13c59356cd3a583df0173e49c0402f27f742ab1ac386b96f5ec27a5'],
  ['20260628191602_client_vehicle_dossier.sql', 'fd0d0224d3079e08454f59f07565d07aa443fc48e6dd807a3a6e654fa89e8f57'],
  ['20260628193002_allow_vehicle_unlink_on_request.sql', '2b7b8ff72c619359c2446a72df166c2a3cf73e2477e4e4715db00b062144b935'],
  ['20260701161357_vehicle_share_owner_only.sql', '9214e6faee32745c90378274141b0b03d7b2ac1945e111b143d762db85756e4e'],
  ['20260702131056_requests_delete_member.sql', 'e47f481b5c0f767bafc68574a58548ccd8e087299e78a34c999b470f49c3b226'],
  ['20260703132019_legal_acceptances.sql', '5f588a499c443e87f3e222212b2f873338e75d73c52d3b429021a8657b159e69'],
] as const

const productVersions = [
  '20260713011000',
  '20260713011100',
  '20260715010000',
  '20260715020000',
  '20260715030000',
  '20260715040000',
  '20260715050000',
  '20260715060000',
  '20260717010000',
  '20260717020000',
  '20260717131215',
] as const

function normalizedHash(fileName: string) {
  const sql = readFileSync(join(migrationsDirectory, fileName), 'utf8').replace(/\r\n/g, '\n')
  return createHash('sha256').update(sql).digest('hex')
}

describe('production migration history reconciliation', () => {
  it('contains exactly the 21 production historical versions and no legacy counters', () => {
    const names = readdirSync(migrationsDirectory).filter((name) => name.endsWith('.sql')).sort()
    const expectedNames = historicalMigrations.map(([name]) => name)

    expect(names.filter((name) => /^(?:000[1-9]|001\d|002[01])_/.test(name))).toEqual([])
    expect(names.slice(0, historicalMigrations.length)).toEqual(expectedNames)

    const versions = expectedNames.map((name) => name.slice(0, 14))
    expect(new Set(versions).size).toBe(versions.length)
    expect([...versions].sort()).toEqual(versions)
  })

  it('preserves every historical SQL file byte-for-byte apart from line endings', () => {
    for (const [name, expectedHash] of historicalMigrations) {
      expect(normalizedHash(name), name).toBe(expectedHash)
    }
  })

  it('keeps the historical seed version as a non-mutating marker', () => {
    const marker = readFileSync(join(migrationsDirectory, '20260613125843_seed.sql'), 'utf8')

    expect(marker).toContain('Historical migration marker')
    expect(marker).not.toMatch(/\binsert\s+into\b|\bupdate\b|\bdelete\s+from\b/i)
  })

  it('keeps the 11 product migrations unique and after reconciled history', () => {
    const names = readdirSync(migrationsDirectory).filter((name) => name.endsWith('.sql'))
    const versions = names.map((name) => name.slice(0, 14))
    const platformAdminVersion = '20260706221227'

    expect(new Set(versions).size).toBe(versions.length)
    expect(productVersions.every((version) => versions.includes(version))).toBe(true)
    expect(productVersions.every((version) => version > platformAdminVersion)).toBe(true)
    expect(productVersions.every((version) => version > '20260703132019')).toBe(true)
  })

  it('keeps demonstration seed data outside ordinary migration pushes', () => {
    const names = readdirSync(migrationsDirectory).filter((name) => name.endsWith('.sql'))
    const migrationSql = names
      .map((name) => readFileSync(join(migrationsDirectory, name), 'utf8'))
      .join('\n')

    expect(names.filter((name) => /seed/i.test(name))).toEqual(['20260613125843_seed.sql'])
    expect(migrationSql).not.toMatch(/insert\s+into\s+auth\.users/i)
    expect(migrationSql).not.toContain('@example.test')
    expect(readFileSync(join(process.cwd(), 'supabase', 'seed.sql'), 'utf8')).toContain(
      'insert into auth.users',
    )
  })
})
