import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { PrivacyPage as HistoricalPrivacyPage } from './HistoricalPrivacy20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { legalDocsV2Enabled } from '@/lib/features'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'
import { CommercialLegalPage } from './CommercialLegalPage'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'

export function PrivacyPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalPrivacyPage /></HistoricalDocumentNotice>
  }
  if (legalDocsV2Enabled()) return <LegalV2DocumentPage documentId="privacy" />
  return (
    <CommercialLegalPage
      document="privacy"
      version={LEGAL_V2_DOCUMENTS.privacy.version}
      reviewOnly
    />
  )
}
