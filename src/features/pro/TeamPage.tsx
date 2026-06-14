import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTeam } from '@/data/proData'
import { ROLE_LABEL, type GarageRole } from '@/types/domain'

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  invited: 'warning',
  disabled: 'neutral',
}

export function TeamPage() {
  const { garage, role } = useAuth()
  const { data: team, isLoading } = useTeam(garage?.id)

  return (
    <div>
      <PageHeader title="Équipe" subtitle="Les membres et leurs rôles dans le garage." />

      {isLoading ? (
        <LoadingState />
      ) : (
        <Card className="divide-y divide-border">
          {(team ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <Avatar name={m.profile?.full_name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.profile?.full_name ?? 'Membre'}</p>
                <p className="text-sm text-muted-foreground">{ROLE_LABEL[m.role as GarageRole] ?? m.role}</p>
              </div>
              <Badge tone={STATUS_TONE[m.status] ?? 'neutral'}>{m.status}</Badge>
            </div>
          ))}
        </Card>
      )}

      <Card className="mt-4 flex items-start gap-3 bg-muted/40 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {role === 'owner' || role === 'admin'
            ? 'L’invitation de nouveaux membres par email sera activée via une Edge Function d’invitation (rôle admin requis). Les rôles sont déjà appliqués côté base par les policies RLS.'
            : 'Seuls le gérant et les administrateurs peuvent gérer l’équipe.'}
        </p>
      </Card>
    </div>
  )
}
