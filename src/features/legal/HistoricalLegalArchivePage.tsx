import { useParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { NotFoundPage } from '@/features/marketing/NotFoundPage'
import { LegalPage as HistoricalLegalNotice } from './HistoricalLegalNotice20260702Page'
import { PrivacyPage as HistoricalPrivacy } from './HistoricalPrivacy20260702Page'
import { TermsPage as HistoricalTerms } from './HistoricalTerms20260702Page'
import { DpaPage as HistoricalDpa } from './HistoricalDpa20260702Page'
import { PilotAgreementPage as HistoricalPilotAgreement } from './HistoricalPilotAgreement20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { DpaAccessGuard } from './DpaAccessGuard'

const historicalDocuments = {
  legal: HistoricalLegalNotice,
  legal_notice: HistoricalLegalNotice,
  privacy: HistoricalPrivacy,
  terms: HistoricalTerms,
  dpa: HistoricalDpa,
  pilot_agreement: HistoricalPilotAgreement,
} as const

export function HistoricalLegalArchivePage() {
  const { documentId, version } = useParams()
  if (version !== HISTORICAL_LEGAL_VERSION || !documentId || !(documentId in historicalDocuments)) {
    return <NotFoundPage />
  }
  const Page = historicalDocuments[documentId as keyof typeof historicalDocuments]
  const content = <HistoricalDocumentNotice><Page /></HistoricalDocumentNotice>
  return documentId === 'dpa' ? <DpaAccessGuard>{content}</DpaAccessGuard> : content
}
