import { Navigate, useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { TermsPage as HistoricalTermsPage } from './HistoricalTerms20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { legalDocsV2Enabled } from '@/lib/features'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'

export function TermsPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalTermsPage /></HistoricalDocumentNotice>
  }
  if (legalDocsV2Enabled()) return <Navigate to="/terms/client" replace />
  return <LegalV2DocumentPage documentId="terms_client" />
}
