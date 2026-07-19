import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION, legalVersions } from '@/config/legal'
import { LegalPage as HistoricalLegalPage } from './HistoricalLegalNotice20260702Page'
import { CommercialLegalPage } from './CommercialLegalPage'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'

export function LegalPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalLegalPage /></HistoricalDocumentNotice>
  }
  return <CommercialLegalPage document="legal" version={legalVersions.legalNotice} />
}

