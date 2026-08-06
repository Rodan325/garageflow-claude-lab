import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `supabase/seed.sql` and `scripts/rls-fixtures.sql` both create fixtures, and
 * every insert is `on conflict do nothing`. They once reused the same ids for
 * different rows, so whichever file ran first won and the same uuid named a
 * different account depending on the environment — one hosted project ended up
 * with an owner the other did not have.
 *
 * Their id namespaces must therefore stay disjoint, except for the few ids that
 * are shared on purpose and listed below.
 */

const seed = readFileSync(resolve('supabase/seed.sql'), 'utf8')
const fixtures = readFileSync(resolve('scripts/rls-fixtures.sql'), 'utf8')

/** Ids both files may legitimately name, with the reason each one is allowed. */
const SHARED_ON_PURPOSE = new Map([
  [
    '00000000-0000-0000-0000-000000000000',
    'GoTrue instance_id: a fixed platform constant, not an entity of ours.',
  ],
  [
    'c0000000-0000-4000-8000-000000000001',
    "The seed's demo client, referenced by the Test B service request on purpose: " +
      'the anti-leak check needs one customer visible across two garages.',
  ],
])

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

function uuidsOf(sql: string): Set<string> {
  return new Set((sql.match(UUID) ?? []).map((value) => value.toLowerCase()))
}

describe('fixture uuid namespaces', () => {
  const seedIds = uuidsOf(seed)
  const fixtureIds = uuidsOf(fixtures)
  const shared = [...fixtureIds].filter((id) => seedIds.has(id)).sort()

  it('shares only the ids declared as intentional', () => {
    expect(shared).toEqual([...SHARED_ON_PURPOSE.keys()].sort())
  })

  it('documents a reason for every shared id', () => {
    for (const id of shared) {
      expect(SHARED_ON_PURPOSE.get(id)?.length ?? 0).toBeGreaterThan(20)
    }
  })

  it('keeps the Test B set inside its own 3333 namespace', () => {
    const own = [...fixtureIds].filter((id) => !SHARED_ON_PURPOSE.has(id))
    expect(own.length).toBeGreaterThan(0)
    for (const id of own) {
      expect(id).toMatch(/^[0-9a-f]?3{7}-/)
    }
  })

  it('leaves no reference to the ids the Test B set used to squat', () => {
    for (const previous of [
      '22222222-2222-4222-8222-222222222222',
      'b0000000-0000-4000-8000-000000000001',
      'd2222222-0000-4000-8000-000000000001',
      'e2222222-0000-4000-8000-000000000001',
      'f2222222-0000-4000-8000-000000000001',
    ]) {
      expect(fixtures).not.toContain(previous)
    }
  })

  it('keeps the Test B rows pointing at the Test B garage', () => {
    const garage = '33333333-3333-4333-8333-333333333333'
    // member, customer, vehicle and service request all belong to that garage
    expect(fixtures.match(new RegExp(garage, 'g'))?.length ?? 0).toBeGreaterThanOrEqual(5)
    expect(fixtures).toContain('b3333333-0000-4000-8000-000000000001')
    expect(fixtures).toContain('d3333333-0000-4000-8000-000000000001')
    expect(fixtures).toContain('e3333333-0000-4000-8000-000000000001')
    expect(fixtures).toContain('f3333333-0000-4000-8000-000000000001')
  })

  it('no longer creates an account on the retired demo domain', () => {
    expect(fixtures).not.toContain('ownerb@demo-garage.fr')
    expect(fixtures).toContain('owner.test-b@example.test')
  })

  it('never hardcodes a fixture password in either file', () => {
    for (const sql of [seed, fixtures]) {
      expect(sql).not.toMatch(/crypt\(\s*'/i)
      expect(sql).toContain("current_setting('seed.fixture_password', true)")
      expect(sql).toContain('gen_random_bytes')
    }
  })

  it('documents that the fixtures require the seed to have run first', () => {
    // Order matters: the Test B service request points at the seed's client, so
    // running the fixtures on an empty database fails that one foreign key.
    expect(fixtures).toContain('c0000000-0000-4000-8000-000000000001')
    expect(seed.indexOf('c0000000-0000-4000-8000-000000000001')).toBeGreaterThan(-1)
  })
})
