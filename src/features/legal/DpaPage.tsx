import { useSearchParams } from 'react-router-dom'
import { HISTORICAL_LEGAL_VERSION } from '@/config/legal'
import { DpaPage as HistoricalDpaPage } from './HistoricalDpa20260702Page'
import { HistoricalDocumentNotice } from './HistoricalDocumentNotice'
import { legalDocsV2Enabled } from '@/lib/features'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'
import { DpaAccessGuard } from './DpaAccessGuard'

export function DpaPage() {
  return (
    <DpaAccessGuard>
      {(access) => <DpaContent canAccept={access.canAccept} />}
    </DpaAccessGuard>
  )
}

function DpaContent({ canAccept }: { canAccept: boolean }) {
  const [params] = useSearchParams()
  if (params.get('version') === HISTORICAL_LEGAL_VERSION) {
    return <HistoricalDocumentNotice><HistoricalDpaPage /></HistoricalDocumentNotice>
  }
  if (legalDocsV2Enabled()) {
    return (
      <div data-dpa-can-accept={canAccept ? 'true' : 'false'}>
        <LegalV2DocumentPage documentId="dpa" />
      </div>
    )
  }
  return <HistoricalDocumentNotice><HistoricalDpaPage /></HistoricalDocumentNotice>
}
