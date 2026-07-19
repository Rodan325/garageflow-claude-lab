import { aiFeaturesEnabled, legalDocsV2Enabled, subprocessorRegistryEnabled } from '@/lib/features'
import type { LegalV2DocumentId } from '@/config/legalV2'
import { NotFoundPage } from '@/features/marketing/NotFoundPage'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'

export function LegalV2Route({ documentId }: { documentId: LegalV2DocumentId }) {
  if (!legalDocsV2Enabled()) return <NotFoundPage />
  if (documentId === 'subprocessors' && !subprocessorRegistryEnabled()) return <NotFoundPage />
  if (documentId === 'ai_policy' && !aiFeaturesEnabled()) return <NotFoundPage />
  return <LegalV2DocumentPage documentId={documentId} />
}
