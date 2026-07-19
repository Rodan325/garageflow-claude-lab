import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION, legalVersions } from '@/config/legal'
import { DpaPage as HistoricalDpaPage } from './HistoricalDpa20260702Page'
import { CommercialLegalPage } from './CommercialLegalPage'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { legalDocsV2Enabled } from '@/lib/features'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'

export function DpaPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalDpaPage /></HistoricalDocumentNotice>
  }
  if (legalDocsV2Enabled()) return <LegalV2DocumentPage documentId="dpa" />
  return <CommercialLegalPage document="dpa" version={legalVersions.dpa} />
}
