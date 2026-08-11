// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Supabase CLI operator safety', () => {
  it('exposes one explicit local-only migration command', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>
    }
    const command = packageJson.scripts?.['db:push:local']

    expect(command).toBe('supabase db push --local')
    expect(command).not.toContain('--linked')
    expect(command).not.toContain('--db-url')
    expect(command).not.toContain('zazdhzmfrtecxtglhoso')
    expect(command).not.toContain('tftmfhwmzkhzlvgwcnje')
  })

  it('documents the local command without recommending a bare push', () => {
    const setup = read('SUPABASE_SETUP.md')
    const releaseProcess = read('docs/product/RELEASE_PROCESS.md')
    const executableLines = `${setup}\n${releaseProcess}`
      .split(/\r?\n/)
      .map((line) => line.trim())

    expect(setup).toContain('npm run db:push:local')
    expect(setup).toContain('Le défaut sûr du dépôt est **LOCAL**')
    expect(setup).toContain('La commande nue `supabase db push` ne doit')
    expect(executableLines).not.toContain('supabase db push')
    expect(executableLines).not.toContain('npx supabase db push')
  })
})
