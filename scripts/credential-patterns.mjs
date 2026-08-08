/**
 * Shared credential detector.
 *
 * Used by scripts/security-scan.mjs and by the contract test, so both cover the
 * same ground: every tracked text file, not a hand-maintained list.
 *
 * What counts as a credential-like literal: at least 10 characters, containing
 * a letter. A digit is NOT required, and whitespace is allowed — a passphrase is
 * a credential too. What is filtered out is prose, by word count, sentence
 * punctuation, non-ASCII text and common function words in both interface
 * languages, so UI labels and validation messages do not drown the output.
 *
 * This is a high-confidence heuristic, not a proof that the tree holds no
 * secret: a short value, prose that happens to read like a passphrase, or a
 * secret assembled at run time can still slip through.
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

/**
 * Exact values that exist to be rejected by something. Listed one by one, with
 * the reason: this is not a prefix rule and it cannot be widened by accident.
 */
const KNOWN_TEST_VECTORS = new Map([
  ['password1234', 'canonical weak-password example, asserted to be refused by the signup schema'],
])

export function knownTestVectorReason(value) {
  return KNOWN_TEST_VECTORS.get(value)
}

/**
 * Could this literal be typed at a login prompt?
 *
 * Deliberately does NOT require a digit, and does not reject spaces: a
 * passphrase is a credential too. What it does reject is prose, because the
 * high-confidence contexts below sit next to translation catalogues full of
 * sentences about passwords.
 */
export function credentialLike(value) {
  if (typeof value !== 'string') return false
  // An unresolved `${…}` is filled in at run time; what is written here is not
  // the credential. Judge only the fixed part.
  value = value.replace(/\$\{[^}]*\}/g, '')
  if (value.length < 10 || value.length > 200) return false
  if (FICTITIOUS.test(value)) return false
  if (KNOWN_TEST_VECTORS.has(value)) return false
  if (!/[A-Za-z]/.test(value)) return false

  if (/\s/.test(value)) {
    const words = value.trim().split(/\s+/)
    // A passphrase is a handful of bare words. Prose has more of them, or
    // sentence punctuation, or letters outside the ASCII range.
    if (words.length < 3 || words.length > 8) return false
    if (/[.,;:!?]/.test(value)) return false
    if (/[^\x20-\x7E]/.test(value)) return false
    // …and prose leans on function words that a passphrase rarely strings together.
    if (words.some((w) => FUNCTION_WORDS.has(w.toLowerCase()))) return false
  }
  return true
}

/**
 * Prose leans on these; a passphrase rarely strings several together. Both
 * languages of the interface are covered, because the catalogues are French and
 * the messages talk about passwords.
 */
const FUNCTION_WORDS = new Set([
  // English
  'a', 'an', 'the', 'is', 'are', 'be', 'to', 'of', 'and', 'or', 'not', 'must',
  'should', 'can', 'may', 'with', 'without', 'for', 'from', 'in', 'on', 'at',
  'this', 'that', 'it', 'your', 'you', 'we', 'us', 'contain', 'contains',
  'use', 'used', 'uses', 'least', 'more', 'than',
  // French
  'un', 'une', 'le', 'la', 'les', 'de', 'des', 'du', 'et', 'ou', 'pour',
  'avec', 'sans', 'votre', 'vos', 'vous', 'doit', 'doivent', 'dans', 'sur',
  'par', 'au', 'aux', 'ne', 'pas', 'est', 'sont', 'que', 'qui', 'plus',
])

/** Identifiers that name a piece of interface, not a secret. */
const UI_IDENT =
  /(label|placeholder|message|description|hint|title|text|help|error|aria|toggle|show|hide|confirm|strength|requirement|policy|rule|prompt|caption|tooltip)/i

const IDENT = String.raw`[A-Za-z_$][A-Za-z0-9_$]*`
const IDENT_CHARS = String.raw`[A-Za-z0-9_$]*`
const CRED_WORD = String.raw`(?:password|passwd|passphrase|pwd|secret)`
const CRED_IDENT = `${IDENT_CHARS}${CRED_WORD}${IDENT_CHARS}`

const CREDENTIAL_IDENT_FINDING = 'credential-like literal assigned to a password identifier'

/**
 * Exemptions are per finding and per shape — never per file. Nothing here can
 * silence a whole path: a `const`, a `crypt()` call, a psql option, a comment or
 * an indirect assignment is still reported wherever it appears, including in the
 * files listed below. Each entry carries a reason and is pinned by a test.
 */
const SHAPE_EXEMPTIONS = [
  {
    name: 'translation catalogue label',
    reason:
      'i18n catalogues map credential-named keys to interface strings; only the ' +
      'object-property shape is spared there, and only for this finding type',
    applies: ({ rel, findingName, operator }) =>
      /^src\/i18n\//.test(rel) && findingName === CREDENTIAL_IDENT_FINDING && operator === ':',
  },
]

export function shapeExemptionFor(context) {
  return SHAPE_EXEMPTIONS.find((e) => e.applies(context))
}

/** Kept for callers that want to know an exemption exists at all. */
export function exemptionReasons() {
  return SHAPE_EXEMPTIONS.map((e) => ({ name: e.name, reason: e.reason }))
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

/** Groups: 1 = identifier, 2 = `:` or `=`, 3 = right-hand side. */
const CREDENTIAL_ASSIGNMENT = new RegExp(String.raw`\b(${CRED_IDENT})\s*([:=])\s*([^,;\n)]+)`, 'gi')

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
    // `-- shared password: correct horse battery staple` — the value follows the
    // credential word after `is`, `:` or `=`. Prose is filtered by credentialLike.
    name: 'comment naming a reusable password',
    re: new RegExp(
      String.raw`(?:--|//|#)[^\n]*\b${CRED_WORD}\b\s*(?:is|are|=|:)\s*['"]?([^\n'"]{10,})['"]?\s*$`,
      'gim',
    ),
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
  const findings = []

  for (const match of text.matchAll(CREDENTIAL_ASSIGNMENT)) {
    const [, identifier, operator, rhs] = match
    if (UI_IDENT.test(identifier)) continue
    const value = literalValueOf(rhs)
    if (!value || !credentialLike(value)) continue
    if (shapeExemptionFor({ rel, findingName: CREDENTIAL_IDENT_FINDING, operator, identifier })) continue
    findings.push({ rel, line: lineOf(text, match.index), name: CREDENTIAL_IDENT_FINDING })
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
