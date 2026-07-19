import { createHash } from 'node:crypto'
import type { Lang } from '../src/i18n/index'
import type { LegalV2DocumentId } from '../src/config/legalV2'
import { serializeLegalV2Document } from '../src/features/legal/legalV2Content'

const documents: LegalV2DocumentId[] = [
  'legal',
  'terms_pro',
  'terms_client',
  'privacy',
  'cookies',
  'dpa',
  'subprocessors',
  'security',
  'service_levels',
  'ai_policy',
]
const languages: Lang[] = ['fr', 'en', 'ar']

for (const documentId of documents) {
  const hashes = Object.fromEntries(languages.map((language) => [
    language,
    createHash('sha256').update(serializeLegalV2Document(documentId, language)).digest('hex'),
  ]))
  process.stdout.write(`${documentId} ${JSON.stringify(hashes)}\n`)
}
