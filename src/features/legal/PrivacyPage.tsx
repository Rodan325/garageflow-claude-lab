import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION, legalVersions } from '@/config/legal'
import { PrivacyPage as HistoricalPrivacyPage } from './HistoricalPrivacy20260702Page'
import { CommercialLegalPage } from './CommercialLegalPage'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'

export function PrivacyPage() {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalPrivacyPage /></HistoricalDocumentNotice>
  }
  return <CommercialLegalPage document="privacy" version={legalVersions.privacy} />
}

