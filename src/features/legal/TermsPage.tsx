import { Navigate, useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION, legalVersions } from '@/config/legal'
import { TermsPage as HistoricalTermsPage } from './HistoricalTerms20260702Page'
import { CommercialLegalPage } from './CommercialLegalPage'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { legalDocsV2Enabled } from '@/lib/features'

export function TermsPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalTermsPage /></HistoricalDocumentNotice>
  }
  if (legalDocsV2Enabled()) return <Navigate to="/terms/client" replace />
  return <CommercialLegalPage document="terms" version={legalVersions.terms} />
}
