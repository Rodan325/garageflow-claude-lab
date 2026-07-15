import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { afterEach, describe, expect, it } from 'vitest'
import { DEMO_QUOTE_LINK_HINT } from '@/lib/demo'
import { localizeDemoText } from './demoContent'
import { hasTranslation } from './catalog'

const roots = [
  'src/features/client',
  'src/features/pro',
  'src/features/auth',
  'src/features/legal',
  'src/features/workshop',
  'src/features/recommendations',
  'src/components',
  'src/lib',
]

function sourceFiles() {
  const files: string[] = []
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) walk(path)
      else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.includes('.test.')) files.push(path)
    }
  }
  roots.forEach(walk)
  return files
}

function literalTranslationSources(path: string) {
  const source = readFileSync(path, 'utf8')
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const values: string[] = []
  const collectStrings = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node)) values.push(node.text)
    else ts.forEachChild(node, collectStrings)
  }
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'tr' && node.arguments[0]) {
      collectStrings(node.arguments[0])
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return values
}

describe('translation catalog coverage', () => {
  it('contains English and Arabic entries for every literal tr() source', () => {
    const staticSources = sourceFiles().flatMap(literalTranslationSources)
    const dynamicSources = [
      DEMO_QUOTE_LINK_HINT,
      'Version pilote',
      'Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL', 'Autre',
      'Actif', 'À l’atelier', 'Archivé',
      'En attente', 'En cours', 'Confirmées', 'Archivées', 'Toutes',
      'Démo', 'Démo Speedy (non officielle)', 'Speedy — Démo',
      'Clikarage',
      'Démo personnalisée à titre de présentation — non officielle',
      'Espace centre auto et compte client.', 'Prenez rendez-vous dans votre centre auto.',
    ]
    const sources = [...new Set([...staticSources, ...dynamicSources])]

    expect(sources.filter((source) => !hasTranslation('en', source))).toEqual([])
    expect(sources.filter((source) => !hasTranslation('ar', source))).toEqual([])
  })
})

afterEach(() => sessionStorage.clear())

describe('demo content localization', () => {
  it('localizes exact application seeds reversibly without touching unknown user content', () => {
    sessionStorage.setItem('gf-demo', 'client')

    const arabic = localizeDemoText('Révision constructeur', 'ar')
    expect(arabic).toBe('صيانة حسب توصيات الصانع')
    expect(localizeDemoText(arabic, 'en')).toBe('Manufacturer service')
    expect(localizeDemoText('Manufacturer service', 'fr')).toBe('Révision constructeur')
    expect(localizeDemoText('Texte libre du garage', 'ar')).toBe('Texte libre du garage')
  })

  it('localizes a stored public demo quote without requiring an active demo role', () => {
    expect(localizeDemoText('Révision constructeur', 'en', true)).toBe('Manufacturer service')
    expect(localizeDemoText('Révision constructeur', 'en', false)).toBe('Révision constructeur')
  })
})
