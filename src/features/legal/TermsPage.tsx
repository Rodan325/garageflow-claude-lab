import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION, legalVersions } from '@/config/legal'
import { TermsPage as HistoricalTermsPage } from './HistoricalTerms20260702Page'
import { CommercialLegalPage } from './CommercialLegalPage'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'

export function TermsPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalTermsPage /></HistoricalDocumentNotice>
  }
  return <CommercialLegalPage document="terms" version={legalVersions.terms} />
}

