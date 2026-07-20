import { createHash } from 'node:crypto'
import type { Lang } from '../src/i18n/index'
import {
  CLIENT_LEGAL_V2_DOCUMENT_IDS,
  serializeLegalV2Document,
} from '../src/features/legal/legalV2Content'
const languages: Lang[] = ['fr', 'en', 'ar']

for (const documentId of CLIENT_LEGAL_V2_DOCUMENT_IDS) {
  const hashes = Object.fromEntries(languages.map((language) => [
    language,
    createHash('sha256').update(serializeLegalV2Document(documentId, language)).digest('hex'),
  ]))
  process.stdout.write(`${documentId} ${JSON.stringify(hashes)}\n`)
}
