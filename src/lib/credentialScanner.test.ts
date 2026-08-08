import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain ESM helper shared with scripts/security-scan.mjs
import { credentialLike, exemptionReasons, findCredentialIssues, knownTestVectorReason, literalValueOf, looksBinary, shapeExemptionFor, trackedTextFiles } from '../../scripts/credential-patterns.mjs'

/**
 * Unit tests for the detector. The contract test checks the repository; this one
 * checks the detector would actually notice — including the shapes an earlier
 * version let through: passphrases, values with no digit, and secrets dropped
 * into files that used to be exempt as a whole.
 *
 * The sample values are assembled at run time. Writing them as literals would
 * put credential-shaped strings in a tracked file, which is exactly what the
 * detector is meant to report — and it would have to be excused by an exemption.
 * Building them keeps this file clean under its own rules.
 */
const j = (...parts: string[]) => parts.join('')

const V = {
  plain: j('Trom', 'bone42', 'Vertical'),
  noDigit: j('Correct', 'Horse', 'Battery', 'Staple'),
  passphrase: j('correct', ' ', 'horse', ' ', 'battery', ' ', 'staple'),
  short: j('Correct', 'Horse', 'Battery'),
  symbols: j('Only', 'Letters', 'And', 'Symbols', '!'),
  template: j('Super', 'Secret', 'Value1'),
  // The retired fixture address, assembled so this file does not name it either.
  retiredAddress: j('owner', 'b@', 'demo-', 'garage.fr'),
}

const scan = (text: string, rel = 'scripts/example.mjs') =>
  (findCredentialIssues(rel, text) as Array<{ name: string }>).length

describe('credential detector — shapes it must catch', () => {
  const caught: Array<[string, string]> = [
    ['literal on a password identifier', `const PASSWORD = '${V.plain}'`],
    ['lower-case identifier', `const password = '${V.noDigit}'`],
    ['mixed-case identifier', `const PASSword = '${V.noDigit}'`],
    ['pwd identifier', `let seedPwd = '${V.noDigit}'`],
    ['secret identifier', `const apiSecret = '${V.noDigit}'`],
    ['a passphrase with spaces', `const password = '${V.passphrase}'`],
    ['a long value with no digit at all', `const password = '${V.noDigit}'`],
    ['letters and punctuation only', `const secret = '${V.symbols}'`],
    ['a template literal', `const password = \`${V.template}\``],
    ['a two-part concatenation', `const PASSWORD = 'Correct' + 'HorseBattery'`],
    ['a three-part concatenation', `const password = 'Corr' + 'ectHorse' + 'BatteryX'`],
    ['a literal via an intermediate variable', `const holder = '${V.short}'\nconst PASSWORD = holder`],
    ['crypt() with a literal', `crypt('${V.short}', gen_salt('bf'))`],
    ['crypt() with an interleaved comment', `crypt /* note */ ('${V.short}', x)`],
    ['env prefix on a command line', `env SEED_FIXTURE_PASSWORD=${V.short} npm run test:rls`],
    ['bare assignment on a command line', `SEED_FIXTURE_PASSWORD=${V.short} npm run test:rls`],
    ['psql --set', `psql --set=seed.fixture_password=${V.short} -f a.sql`],
    ['psql -v', `psql -v fixture_password=${V.short} -f a.sql`],
    ['psql -c with a SET', `psql -c "set seed.fixture_password = '${V.short}'"`],
    ['a comment handing out a passphrase', `-- shared password: ${V.passphrase}`],
  ]

  it.each(caught)('catches %s', (_label, sample) => {
    expect(scan(sample)).toBeGreaterThan(0)
  })
})

describe('credential detector — no file is exempt as a whole', () => {
  // Every path below was previously skipped entirely. A real credential dropped
  // into any of them must still be reported.
  const formerlyExempt = [
    'src/i18n/fr.ts',
    'scripts/credential-patterns.mjs',
    'scripts/security-scan.mjs',
    'src/lib/credentialScanner.test.ts',
    'src/lib/fixtureCredentialHandling.contract.test.ts',
    'src/features/auth/signupSchema.test.ts',
  ]

  it.each(formerlyExempt)('still reports a declared credential in %s', (rel) => {
    expect(scan(`const password = '${V.noDigit}'`, rel)).toBeGreaterThan(0)
  })

  it.each(formerlyExempt)('still reports a crypt() literal in %s', (rel) => {
    expect(scan(`crypt('${V.noDigit}', x)`, rel)).toBeGreaterThan(0)
  })
})

describe('credential detector — shapes it must leave alone', () => {
  const allowed: Array<[string, string]> = [
    ['reading the environment', 'const PASSWORD = process.env.SEED_FIXTURE_PASSWORD'],
    ['per-command assignment from a shell variable', 'SEED_FIXTURE_PASSWORD="$fixture_pw" npm run test:rls'],
    ['a short schema value', "password: 'short'"],
    ['a value marked fictitious', "const key = 'sb_publishable_fictitious123'"],
    ['a placeholder', "const PASSWORD = 'placeholder-1234'"],
    ['unrelated string building', "token: scopedToken('abc' + 'def123')"],
    ['an assertion about an old address', `expect(sql).not.toContain('${V.retiredAddress}')`],
    ['a UI identifier', "const passwordLabel = 'Choose your password here'"],
    ['a UI placeholder identifier', "passwordPlaceholder: 'Enter a strong password'"],
    ['prose in a comment', '-- the password is stored hashed and never logged'],
  ]

  it.each(allowed)('allows %s', (_label, sample) => {
    expect(scan(sample)).toBe(0)
  })

  it('leaves translation-catalogue labels alone, by shape not by path', () => {
    expect(scan("    password: 'Mot de passe',", 'src/i18n/fr.ts')).toBe(0)
    expect(scan("    passwordCommon: 'Choose a password that is not common',", 'src/i18n/en.ts')).toBe(0)
    // …but the same file is still scanned for every other shape.
    expect(scan(`const password = '${V.short}'`, 'src/i18n/fr.ts')).toBeGreaterThan(0)
  })
})

describe('credential detector — helpers', () => {
  it('accepts passphrases and digitless values, rejects prose', () => {
    expect(credentialLike(V.noDigit)).toBe(true)
    expect(credentialLike(V.passphrase)).toBe(true)
    expect(credentialLike(V.symbols)).toBe(true)
    expect(credentialLike('short1')).toBe(false) // below the length floor
    expect(credentialLike('Mot de passe')).toBe(false) // a label, and function words
    expect(credentialLike('the password must contain a digit')).toBe(false) // prose
    expect(credentialLike('Choisissez un mot de passe robuste')).toBe(false) // French prose
    expect(credentialLike('1234567890')).toBe(false) // no letter
  })

  it('resolves only pure literal expressions', () => {
    expect(literalValueOf("'Corr' + 'ect'")).toBe('Correct')
    expect(literalValueOf("'plain'")).toBe('plain')
    expect(literalValueOf('process.env.X')).toBeNull()
    expect(literalValueOf("fn('a')")).toBeNull()
  })

  it('treats a NUL byte as binary', () => {
    expect(looksBinary(Buffer.from([0x41, 0x00, 0x42]))).toBe(true)
    expect(looksBinary(Buffer.from('plain text'))).toBe(false)
  })
})

describe('credential detector — exemptions stay narrow', () => {
  it('documents a reason for every shape exemption', () => {
    const reasons = exemptionReasons() as Array<{ name: string; reason: string }>
    expect(reasons.length).toBeGreaterThan(0)
    for (const entry of reasons) expect(entry.reason.length).toBeGreaterThan(20)
  })

  it('exempts a shape, never a path', () => {
    const finding = 'credential-like literal assigned to a password identifier'
    // The i18n exemption is bound to the object-property form of one finding.
    expect(shapeExemptionFor({ rel: 'src/i18n/fr.ts', findingName: finding, operator: ':' })).toBeTruthy()
    expect(shapeExemptionFor({ rel: 'src/i18n/fr.ts', findingName: finding, operator: '=' })).toBeUndefined()
    expect(shapeExemptionFor({ rel: 'scripts/rls-antileak.mjs', findingName: finding, operator: ':' })).toBeUndefined()
  })

  it('names each known test vector individually, with a reason', () => {
    expect(knownTestVectorReason('password1234')).toMatch(/weak-password/i)
    expect(knownTestVectorReason(V.noDigit)).toBeUndefined()
  })
})

describe('credential detector — file enumeration', () => {
  it('lists tracked files only, with forward slashes', () => {
    const files = trackedTextFiles() as string[]
    expect(files.length).toBeGreaterThan(100)
    expect(files).toContain('supabase/seed.sql')
    expect(files.some((f) => f.includes('\\'))).toBe(false)
    // Generated by a local `supabase start`; untracked, so never scanned.
    expect(files.some((f) => f.startsWith('supabase/.temp/'))).toBe(false)
    expect(files.some((f) => f.startsWith('node_modules/'))).toBe(false)
  })
})
