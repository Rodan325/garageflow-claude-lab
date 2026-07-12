/**
 * Clikarage — secret & frontend-safety scanner.
 * Blocks the OBVIOUS leaks (real key values, private keys) and WARNS on
 * frontend references to server-only things. Not a full SAST — a guardrail.
 *
 * Run:  npm run security:scan   (exit 1 if a hard secret is found)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, basename } from 'node:path'

const ROOT = process.cwd()
const SELF = 'security-scan.mjs'

// Directories/files we never scan.
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dev-dist', '.git', '.claude', 'coverage', '.vscode'])
const SKIP_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'])
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.html', '.css', '.yml', '.yaml', '.txt', '.sql', ''])

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

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full, out)
    } else if (!SKIP_FILES.has(entry) && entry !== SELF && SCAN_EXT.has(extname(entry))) {
      out.push(full)
    }
  }
  return out
}

const under = (rel, prefixes) => prefixes.some((p) => rel.replace(/\\/g, '/').startsWith(p))

const blocks = []
const warns = []

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file)
  let text
  try { text = readFileSync(file, 'utf8') } catch { continue }
  const lines = text.split(/\r?\n/)

  lines.forEach((line, i) => {
    for (const p of BLOCK) if (p.re.test(line)) blocks.push({ rel, line: i + 1, name: p.name, text: line.trim().slice(0, 100) })
    if (under(rel, FRONTEND) && !under(rel, SERVER_ONLY)) {
      for (const p of WARN_FRONTEND) if (p.re.test(line)) warns.push({ rel, line: i + 1, name: p.name })
    }
  })

  // .env.example must never carry a real non-public value.
  if (basename(file) === '.env.example' && ENV_NONPUBLIC.test(text)) {
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
