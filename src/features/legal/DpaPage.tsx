import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { DpaPage as HistoricalDpaPage } from './HistoricalDpa20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { dpaSelfServiceEnabled, legalDocsV2Enabled } from '@/lib/features'
import { NotFoundPage } from '@/features/marketing/NotFoundPage'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'

export function DpaPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalDpaPage /></HistoricalDocumentNotice>
  }
  // The V2 DPA is organization-scoped and intentionally non-public. Reading it
  // and accepting it through self-service therefore share the dedicated flag.
  if (dpaSelfServiceEnabled()) return <LegalV2DocumentPage documentId="dpa" />
  if (legalDocsV2Enabled()) return <NotFoundPage />
  return <HistoricalDpaPage />
}
