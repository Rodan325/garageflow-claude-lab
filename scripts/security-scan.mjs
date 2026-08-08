/**
 * Clikarage — secret & frontend-safety scanner.
 * Blocks the OBVIOUS leaks (real key values, private keys) and WARNS on
 * frontend references to server-only things. Not a full SAST — a guardrail.
 *
 * Run:  npm run security:scan   (exit 1 if a hard secret is found)
 */
import { readFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { trackedTextFiles, looksBinary, findCredentialIssues } from './credential-patterns.mjs'

const ROOT = process.cwd()

// Only tracked files are scanned. Generated artefacts — `supabase/.temp`, build
// output, anything a local `supabase start` drops — are untracked, so they can
// no longer fail the scan for a developer who happens to have the stack running.
const SKIP_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'])

// Server-only code lives here — legitimately uses Deno.env + Bearer (never shipped to the browser).
const SERVER_ONLY = ['supabase/functions/']
// Where browser code lives (warnings about server-only terms apply here).
const FRONTEND = ['src/', 'public/']

// --- HARD secrets: any match fails the scan -------------------------------
const BLOCK = [
  { name: 'OpenAI/Anthropic API key', re: /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: 'JWT key value hardcoded (anon/service_role)', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}/ },
  { name: 'Service-role / secret env assigned a value', re: /\b(?:SUPABASE_SERVICE_ROLE_KEY|[A-Z0-9_]*(?:SECRET|PRIVATE_KEY|ACCESS_KEY|WEBHOOK_SECRET)[A-Z0-9_]*)\s*[:=]\s*['"]?[^\s'"#]{8,}/ },
  { name: 'Provider secret assigned a value', re: /\b(?:ANTHROPIC_API_KEY|OPENAI_API_KEY|STRIPE_SECRET_KEY|STRIPE_API_KEY|GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*['"]?[^\s'"#]{8,}/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
]

// --- WARNINGS: frontend references to server-only things (review, non-blocking)
const WARN_FRONTEND = [
  { name: 'server-only term `service_role` in frontend', re: /service_role/i },
  { name: 'raw `Bearer ` token in frontend', re: /Bearer\s+[A-Za-z0-9._-]/ },
  { name: 'server-only env key referenced in frontend', re: /\b(OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\b/ },
  { name: 'console.log in frontend (avoid logging tokens/sessions)', re: /console\.(log|debug|info)\s*\(/ },
]

// An env assignment that is NOT empty and NOT clearly a public VITE_ var.
const ENV_NONPUBLIC = /^\s*(?!VITE_|#)([A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE|API_KEY|TOKEN|PASSWORD)[A-Z0-9_]*)\s*=\s*\S+/m

const under = (rel, prefixes) => prefixes.some((p) => rel.replace(/\\/g, '/').startsWith(p))

const blocks = []
const warns = []

let tracked
try {
  tracked = trackedTextFiles(ROOT)
} catch (err) {
  console.error(`\x1b[31m✗ ${err.message}\x1b[0m`)
  console.error('  The scan needs the git index to know which files are real.\n')
  process.exit(2)
}

for (const rel of tracked) {
  if (SKIP_FILES.has(basename(rel))) continue
  let raw
  try { raw = readFileSync(join(ROOT, rel)) } catch { continue }
  if (looksBinary(raw)) continue
  const text = raw.toString('utf8')
  const lines = text.split(/\r?\n/)

  blocks.push(...findCredentialIssues(rel, text).map((f) => ({ ...f, text: '(value withheld)' })))

  lines.forEach((line, i) => {
    for (const p of BLOCK) if (p.re.test(line)) blocks.push({ rel, line: i + 1, name: p.name, text: line.trim().slice(0, 100) })
    if (under(rel, FRONTEND) && !under(rel, SERVER_ONLY)) {
      for (const p of WARN_FRONTEND) if (p.re.test(line)) warns.push({ rel, line: i + 1, name: p.name })
    }
  })

  // .env.example must never carry a real non-public value.
  if (basename(rel) === '.env.example' && ENV_NONPUBLIC.test(text)) {
    blocks.push({ rel, line: 0, name: 'non-public value in .env.example', text: '(review .env.example)' })
  }
}

console.log('\nClikarage — security scan\n')
if (warns.length) {
  console.log(`\x1b[33m${warns.length} avertissement(s) (à revoir, non bloquant) :\x1b[0m`)
  for (const w of warns) console.log(`  ~ ${w.rel}:${w.line} — ${w.name}`)
  console.log('')
}
if (blocks.length) {
  console.log(`\x1b[31m${blocks.length} secret(s) potentiel(s) détecté(s) — BLOQUANT :\x1b[0m`)
  for (const b of blocks) console.log(`  \x1b[31m✗\x1b[0m ${b.rel}:${b.line} — ${b.name}\n      ${b.text}`)
  console.log('\nÉchec : retirez le secret, tournez la clé, et ne committez jamais de secret.\n')
  process.exit(1)
}
console.log('\x1b[32m✓ Aucun secret évident détecté.\x1b[0m Le frontend n\'utilise que la clé publique (anon).')
console.log(`  (${warns.length} avertissement(s) à revoir manuellement.)\n`)
process.exit(0)
