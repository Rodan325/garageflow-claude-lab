import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  getCanonicalLegalDocument,
  hashCanonicalLegalDocumentById,
  serializeCanonicalLegalDocument,
} from './legalCanonicalDocument'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'

const digest = (document: ReturnType<typeof getCanonicalLegalDocument>) => (
  createHash('sha256').update(serializeCanonicalLegalDocument(document)).digest('hex')
)

function changed(
  mutate: (document: ReturnType<typeof getCanonicalLegalDocument>) => void,
) {
  const original = getCanonicalLegalDocument('legal', 'fr')
  const copy = structuredClone(original)
  mutate(copy)
  expect(digest(copy)).not.toBe(digest(original))
}

describe('canonical legal document hashes', () => {
  it('matches the runtime acceptance registry hash', async () => {
    await expect(hashCanonicalLegalDocumentById('dpa', 'ar'))
      .resolves.toBe(LEGAL_V2_DOCUMENTS.dpa.sha256.ar)
  })

  it.each([
    ['publisher', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.identity.entries.find((entry) => entry.id === 'publisher')!.value = 'Different publisher'
    }],
    ['address', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.identity.entries.find((entry) => entry.id === 'address')!.value = 'Different address'
    }],
    ['SIRET', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.identity.entries.find((entry) => entry.id === 'registration')!.value = 'Different SIRET'
    }],
    ['VAT wording', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.identity.entries.find((entry) => entry.id === 'vat')!.value = 'Different VAT regime'
    }],
    ['title', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.title = 'Different title'
    }],
    ['paragraph', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.sections[0].paragraphs[0] = 'Different paragraph'
    }],
    ['language', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.language = 'en'
    }],
    ['version', (document: ReturnType<typeof getCanonicalLegalDocument>) => {
      document.version = 'legal-next'
    }],
  ] as const)('changes when %s changes', (_label, mutate) => changed(mutate))

  it('changes when a table row or annex changes', () => {
    const document = getCanonicalLegalDocument('legal', 'fr')
    document.sections[0].tables.push({
      id: 'fees',
      columns: ['Item', 'Value'],
      rows: [['Support', 'Included']],
    })
    document.annexes.push({
      id: 'annex-a',
      title: 'Annex A',
      paragraphs: ['Annex body'],
      tables: [],
    })
    const baseline = digest(document)

    const tableChange = structuredClone(document)
    tableChange.sections[0].tables[0].rows[0][1] = 'Excluded'
    expect(digest(tableChange)).not.toBe(baseline)

    const annexChange = structuredClone(document)
    annexChange.annexes[0].paragraphs[0] = 'Changed annex body'
    expect(digest(annexChange)).not.toBe(baseline)
  })

  it('is independent from CSS presentation changes', () => {
    const canonical = getCanonicalLegalDocument('legal', 'ar')
    const before = digest(canonical)
    globalThis.document.documentElement.classList.toggle('dark')
    expect(digest(getCanonicalLegalDocument('legal', 'ar'))).toBe(before)
    globalThis.document.documentElement.classList.remove('dark')
  })

  it('normalizes key order, line endings and Unicode deterministically', () => {
    const document = getCanonicalLegalDocument('legal', 'fr')
    const copy = structuredClone(document)
    copy.introduction = copy.introduction?.normalize('NFD').replace(/\n/g, '\r\n') ?? null
    document.introduction = document.introduction?.normalize('NFC') ?? null
    expect(serializeCanonicalLegalDocument(copy)).toBe(serializeCanonicalLegalDocument(document))
  })
})
