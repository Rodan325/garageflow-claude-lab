import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { LegalPage as HistoricalLegalPage } from './HistoricalLegalNotice20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { legalDocsV2Enabled } from '@/lib/features'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'
import { CommercialLegalPage } from './CommercialLegalPage'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'

export function LegalPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalLegalPage /></HistoricalDocumentNotice>
  }
  if (legalDocsV2Enabled()) return <LegalV2DocumentPage documentId="legal" />
  return (
    <CommercialLegalPage
      document="legal"
      version={LEGAL_V2_DOCUMENTS.legal.version}
      reviewOnly
    />
  )
}
