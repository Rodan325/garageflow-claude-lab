import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { LegalPage as HistoricalLegalPage } from './HistoricalLegalNotice20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'

export function LegalPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalLegalPage /></HistoricalDocumentNotice>
  }
  return <LegalV2DocumentPage documentId="legal" />
}
