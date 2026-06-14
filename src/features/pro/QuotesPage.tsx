import { useNavigate } from 'react-router-dom'
import { Eye, FileText, Pencil, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useQuotes } from '@/data/proData'
import { QUOTE_STATUS_META, type QuoteStatus } from '@/types/domain'
import { euro, shortDate } from '@/lib/format'

export function QuotesPage() {
  const { garage } = useAuth()
  const navigate = useNavigate()
  const { data: quotes, isLoading } = useQuotes(garage?.id)

  return (
    <div>
      <PageHeader
        title="Devis"
        subtitle="Générés depuis une demande ou créés à la main, prêts à envoyer."
        action={<Button onClick={() => navigate('/pro/quotes/new')}><Plus className="h-4 w-4" /> Nouveau devis</Button>}
      />

      {isLoading ? (
        <LoadingState />
      ) : (quotes ?? []).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun devis"
          description="Créez un devis depuis une réservation (« Créer un devis ») ou à la main."
          action={<Button onClick={() => navigate('/pro/quotes/new')}>Créer un devis</Button>}
        />
      ) : (
        <Card className="divide-y divide-border">
          {quotes!.map((q) => (
            <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{q.title}</p>
                <p className="text-sm text-muted-foreground">
                  {q.number} · {q.client_name ?? '—'} · {shortDate(q.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{euro(q.total)}</span>
                <StatusPill {...QUOTE_STATUS_META[q.status as QuoteStatus] ?? { label: q.status, tone: 'neutral' as const }} />
                <Button size="sm" variant="ghost" onClick={() => navigate(`/print/quote/${q.id}`)}><Eye className="h-4 w-4" /> Aperçu</Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/pro/quotes/${q.id}`)}><Pencil className="h-4 w-4" /> Modifier</Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
