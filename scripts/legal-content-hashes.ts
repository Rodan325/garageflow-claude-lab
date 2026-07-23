import { createHash } from 'node:crypto'
import type { Lang } from '../src/i18n/index'
import {
  CLIENT_LEGAL_V2_DOCUMENT_IDS,
} from '../src/features/legal/legalV2Content'
import { serializeCanonicalLegalDocumentById } from '../src/features/legal/legalCanonicalDocument'
const languages: Lang[] = ['fr', 'en', 'ar']

for (const documentId of CLIENT_LEGAL_V2_DOCUMENT_IDS) {
  const hashes = Object.fromEntries(languages.map((language) => [
    language,
    createHash('sha256').update(serializeCanonicalLegalDocumentById(documentId, language)).digest('hex'),
  ]))
  process.stdout.write(`${documentId} ${JSON.stringify(hashes)}\n`)
}
