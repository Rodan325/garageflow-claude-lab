// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const runbook = readFileSync(
  resolve(process.cwd(), 'docs/PRODUCTION_BACKUP_RESTORE.md'),
  'utf8',
)
const normalized = runbook.toLowerCase()

function fencedCommandLines(markdown: string) {
  const blocks = markdown.match(/```[^\n]*\n[\s\S]*?```/g) ?? []
  return blocks.flatMap((block) =>
    block
      .replace(/^```[^\n]*\n/, '')
      .replace(/```$/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  )
}

describe('backup recovery policy', () => {
  it('keeps rehearsals isolated from Production and Staging', () => {
    expect(normalized).toContain('never restore directly onto production during a rehearsal')
    expect(normalized).toContain('staging is not disposable')
    expect(normalized).toContain('disposable')
    expect(normalized).toContain('restore to a new project')
    expect(normalized).toContain('explicit approval')
  })

  it('documents measurable database, Storage and full-service targets', () => {
    expect(normalized).toMatch(/database[^\n]*rpo\s*<=\s*24 hours/)
    expect(normalized).toMatch(/storage payloads[^\n]*rpo\s*<=\s*24 hours/)
    expect(normalized).toMatch(/full service[^\n]*rto\s*<=\s*4 hours/)
    expect(normalized).toContain('actual storage object payloads')
    expect(normalized).toContain('daily export')
  })

  it('requires encryption, integrity verification and restore proof', () => {
    expect(normalized).toContain('encrypted')
    expect(normalized).toContain('checksum')
    expect(normalized).toContain('restic check')
    expect(normalized).toContain('not verified')
    expect(normalized).toContain('successful restore')
    expect(normalized).toContain('no credentials or customer data')
  })

  it('does not publish routine destructive rehearsal commands', () => {
    const commands = fencedCommandLines(runbook)
    expect(commands.some((line) => /\bdb\s+reset\b/i.test(line))).toBe(false)
    expect(commands.some((line) => /\bmigration\s+repair\b/i.test(line))).toBe(false)
    expect(commands.some((line) => /--include-seed\b/i.test(line))).toBe(false)
    expect(commands.some((line) => /\bstorage\s+rm\b/i.test(line))).toBe(false)
    expect(commands.some((line) => /\bs3\s+sync\b.*--delete/i.test(line))).toBe(false)
  })
})
