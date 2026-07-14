import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTeam } from '@/data/proData'
import type { GarageRole } from '@/types/domain'
import { roleLabel } from '@/i18n/domainLabels'
import { useLang } from '@/i18n'

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  invited: 'warning',
  disabled: 'neutral',
}

export function TeamPage() {
  const { lang, tr } = useLang()
  const { garage, role } = useAuth()
  const { data: team, isLoading } = useTeam(garage?.id)

  return (
    <div>
      <PageHeader title={tr('Équipe')} subtitle={tr('Les membres et leurs rôles dans le garage.')} />

      {isLoading ? (
        <LoadingState />
      ) : (
        <Card className="divide-y divide-border">
          {(team ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <Avatar name={m.profile?.full_name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.profile?.full_name ?? tr('Membre')}</p>
                <p className="text-sm text-muted-foreground">{roleLabel(m.role as GarageRole, lang)}</p>
              </div>
              <Badge tone={STATUS_TONE[m.status] ?? 'neutral'}>{tr(m.status)}</Badge>
            </div>
          ))}
        </Card>
      )}

      <Card className="mt-4 flex items-start gap-3 bg-muted/40 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {role === 'owner' || role === 'admin'
            ? tr('L’invitation de nouveaux membres par email sera activée via une Edge Function d’invitation (rôle admin requis). Les rôles sont déjà appliqués côté base par les policies RLS.')
            : tr('Seuls le gérant et les administrateurs peuvent gérer l’équipe.')}
        </p>
      </Card>
    </div>
  )
}
