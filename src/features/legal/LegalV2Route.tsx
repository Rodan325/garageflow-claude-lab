import { legalDocsV2Enabled, subprocessorRegistryEnabled } from '@/lib/features'
import { LEGAL_V2_DOCUMENTS, type LegalV2DocumentId } from '@/config/legalV2'
import { NotFoundPage } from '@/features/marketing/NotFoundPage'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'
import { isClientLegalV2DocumentId } from './legalV2Content'

export function LegalV2Route({ documentId }: { documentId: LegalV2DocumentId }) {
  if (!legalDocsV2Enabled()) return <NotFoundPage />
  if (!LEGAL_V2_DOCUMENTS[documentId].public || !isClientLegalV2DocumentId(documentId)) return <NotFoundPage />
  if (documentId === 'subprocessors' && !subprocessorRegistryEnabled()) return <NotFoundPage />
  return <LegalV2DocumentPage documentId={documentId} />
}
