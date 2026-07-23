import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { PrivacyPage as HistoricalPrivacyPage } from './HistoricalPrivacy20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'

export function PrivacyPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalPrivacyPage /></HistoricalDocumentNotice>
  }
  return <LegalV2DocumentPage documentId="privacy" />
}
