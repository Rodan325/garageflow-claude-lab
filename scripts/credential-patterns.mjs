/**
 * Shared credential detector.
 *
 * Used by scripts/security-scan.mjs and by the contract test, so both cover the
 * same ground: every tracked text file, not a hand-maintained list.
 *
 * The rule that keeps this usable is what counts as a credential-like literal:
 * at least 8 characters, no whitespace, and a mix of letters and digits. UI
 * labels ("Mot de passe"), short schema-validation values ("short") and prose
 * do not qualify, so the identifier patterns below can be broad without burying
 * the output in false positives.
 */
import { execFileSync } from 'node:child_process'

/** Tracked, non-binary text files. Throws if git cannot answer. */
export function trackedTextFiles(root = process.cwd()) {
  let raw
  try {
    raw = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
  } catch (cause) {
    throw new Error(`cannot list tracked files: git ls-files failed (${cause.message})`)
  }
  return raw
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((p) => p.replace(/\\/g, '/'))
    .sort()
}

/** A NUL byte is the practical marker of a binary blob. */
export function looksBinary(buffer) {
  return buffer.includes(0)
}

/**
 * Values that are self-evidently not usable credentials. Narrow on purpose:
 * being inside a test file is NOT enough to earn an exemption.
 */
const FICTITIOUS = /fictitious|dummy|placeholder|changeme|change-me|your-|example\.|xxxxx|<[a-z-]+>/i

/** Literal that could actually be typed at a login prompt. */
export function credentialLike(value) {
  if (typeof value !== 'string') return false
  if (value.length < 8 || value.length > 200) return false
  if (/\s/.test(value)) return false
  if (FICTITIOUS.test(value)) return false
  return /[A-Za-z]/.test(value) && /[0-9]/.test(value)
}

const IDENT = String.raw`[A-Za-z_$][A-Za-z0-9_$]*`
const IDENT_CHARS = String.raw`[A-Za-z0-9_$]*`
const CRED_WORD = String.raw`(?:password|passwd|passphrase|pwd|secret)`
const CRED_IDENT = `${IDENT_CHARS}${CRED_WORD}${IDENT_CHARS}`

/**
 * Path-scoped exemptions. Each names a reason, each is pinned by a test in
 * scripts/security-scan.test.mjs, and none of them is a general allowlist:
 * being a test file earns nothing by itself.
 */
const PATH_EXEMPTIONS = [
  {
    match: (rel) => /^src\/i18n\//.test(rel),
    reason: 'translation catalogue: values are UI labels, not credentials',
  },
  {
    match: (rel) =>
      rel === 'scripts/credential-patterns.mjs' ||
      rel === 'scripts/security-scan.mjs' ||
      rel === 'src/lib/credentialScanner.test.ts' ||
      rel === 'src/lib/fixtureCredentialHandling.contract.test.ts',
    reason: 'the detector and its own tests quote the shapes they forbid',
  },
  {
    match: (rel) => rel === 'src/features/auth/signupSchema.test.ts',
    reason: 'password-strength validator vectors: they exercise the schema and authenticate nothing',
  },
]

export function exemptionFor(rel) {
  return PATH_EXEMPTIONS.find((e) => e.match(rel))
}

/**
 * The literal a right-hand side evaluates to, if it is made only of string
 * literals — `'a'`, or `'Fix' + 'ture1234'`. Anything else (a call, an env
 * lookup, a variable) returns null.
 */
export function literalValueOf(rhs) {
  const parts = rhs.match(/(['"`])(?:(?!\1)[^\\])*\1/g)
  if (!parts) return null
  const remainder = rhs.replace(/(['"`])(?:(?!\1)[^\\])*\1/g, '').replace(/[\s+]/g, '')
  if (remainder !== '') return null
  return parts.map((p) => p.slice(1, -1)).join('')
}

/** Rules whose capture group 1 is a right-hand side to evaluate. */
const RHS_RULES = [
  {
    name: 'credential-like literal assigned to a password identifier',
    re: new RegExp(String.raw`\b${CRED_IDENT}\s*[:=]\s*([^,;\n)]+)`, 'gi'),
  },
]

/** Rules whose capture group 1 is already the value. */
const VALUE_RULES = [
  {
    name: 'credential-like literal passed to crypt()',
    re: /\bcrypt\s*(?:\/\*[\s\S]*?\*\/\s*)?\(\s*['"]([^'"]+)['"]/gi,
  },
  {
    name: 'fixture password set to a literal on a command line',
    re: /\bSEED_FIXTURE_PASSWORD\s*=\s*['"]?([^\s'"$;]+)/g,
  },
  {
    name: 'credential passed through a psql option',
    re: /(?:--set(?:=|\s+)|--variable(?:=|\s+)|-v\s+|-c\s+['"]?\s*set\s+)[A-Za-z_.]*(?:password|pwd|secret)[A-Za-z_.]*\s*=\s*['"]?([^\s'"]+)/gi,
  },
  {
    name: 'comment naming a reusable password',
    re: new RegExp(String.raw`(?:--|//|#)[^\n]*\b${CRED_WORD}\b[^\n]*?['"]?([A-Za-z0-9!@#$%^&*_-]{8,})['"]?\s*$`, 'gim'),
  },
]

/**
 * A literal parked in an intermediate variable and only then handed to a
 * password identifier: `const seedPw = '…'; const PASSWORD = seedPw`.
 */
function indirectAssignments(text) {
  const holders = new Map()
  for (const [, name, rhs] of text.matchAll(
    new RegExp(String.raw`\b(?:const|let|var)\s+(${IDENT})\s*=\s*([^,;\n)]+)`, 'g'),
  )) {
    const value = literalValueOf(rhs)
    if (value && credentialLike(value)) holders.set(name, value)
  }
  if (holders.size === 0) return []
  const out = []
  const alias = new RegExp(String.raw`\b(${CRED_IDENT})\s*[:=]\s*(${IDENT})\b`, 'gi')
  for (const match of text.matchAll(alias)) {
    if (holders.has(match[2])) {
      out.push({
        name: 'credential-like literal reaching a password identifier through a variable',
        index: match.index,
      })
    }
  }
  return out
}

const lineOf = (text, index) => text.slice(0, index).split(/\r?\n/).length

/** Findings for one file. `rel` must be repo-relative with forward slashes. */
export function findCredentialIssues(rel, text) {
  if (exemptionFor(rel)) return []
  const findings = []

  for (const rule of RHS_RULES) {
    for (const match of text.matchAll(rule.re)) {
      const value = literalValueOf(match[1])
      if (value && credentialLike(value)) {
        findings.push({ rel, line: lineOf(text, match.index), name: rule.name })
      }
    }
  }

  for (const rule of VALUE_RULES) {
    for (const match of text.matchAll(rule.re)) {
      if (credentialLike(match[1])) {
        findings.push({ rel, line: lineOf(text, match.index), name: rule.name })
      }
    }
  }

  for (const hit of indirectAssignments(text)) {
    findings.push({ rel, line: lineOf(text, hit.index), name: hit.name })
  }

  // The value itself is never returned.
  return findings
}
