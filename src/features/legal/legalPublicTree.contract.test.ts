import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    return statSync(path).isDirectory() ? filesBelow(path) : [path]
  })
}

describe('public legal documentation tree', () => {
  const legalRoot = resolve(process.cwd(), 'docs/legal')

  it('does not contain a private internal or mixed-source directory', () => {
    for (const directory of ['internal', 'source']) {
      const path = join(legalRoot, directory)
      expect(existsSync(path) ? filesBelow(path) : []).toEqual([])
    }
  })

  it('rejects documents explicitly marked as non-public', () => {
    const prohibited = [
      /^# .*\binterne\b/im,
      /ne doivent pas etre publiees/i,
      /ne doit jamais etre exposee?/i,
      /\bnot for publication\b/i,
      /\bworking draft\b/i,
      /^classification:\s*(internal|confidential|privileged)/im,
      /^## Fiche de validation interne/im,
    ]
    for (const file of filesBelow(legalRoot).filter((path) => path.endsWith('.md'))) {
      const source = readFileSync(file, 'utf8')
      for (const pattern of prohibited) {
        expect(source, `${relative(legalRoot, file)} matches ${pattern}`).not.toMatch(pattern)
      }
    }
  })
})
