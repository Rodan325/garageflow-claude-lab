import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { PrivacyPage as HistoricalPrivacyPage } from './HistoricalPrivacy20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { legalDocsV2Enabled } from '@/lib/features'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'

export function PrivacyPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalPrivacyPage /></HistoricalDocumentNotice>
  }
  if (legalDocsV2Enabled()) return <LegalV2DocumentPage documentId="privacy" />
  return <HistoricalPrivacyPage />
}
