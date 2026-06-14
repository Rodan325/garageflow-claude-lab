import { useMemo, useState } from 'react'
import { Plus, Search, UserPlus, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useCreateCustomer, useCustomers } from '@/data/proData'

export function ClientsPage() {
  const { garage } = useAuth()
  const gid = garage?.id
  const { data: customers, isLoading } = useCustomers(gid)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const list = customers ?? []
    if (!q) return list
    const s = q.toLowerCase()
    return list.filter((c) =>
      [c.first_name, c.last_name, c.email, c.phone, c.city].filter(Boolean).join(' ').toLowerCase().includes(s),
    )
  }, [customers, q])

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Le carnet d’adresses du garage."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau client</Button>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client…" className="pl-9" />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Aucun client" description="Ajoutez votre premier client." action={<Button onClick={() => setOpen(true)}><UserPlus className="h-4 w-4" /> Ajouter</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex items-start gap-3 p-4">
              <Avatar name={`${c.first_name ?? ''} ${c.last_name ?? ''}`} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Client'}</p>
                <p className="truncate text-sm text-muted-foreground">{c.email ?? c.phone ?? '—'}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.city && <Badge tone="neutral">{c.city}</Badge>}
                  {c.marketing_consent && <Badge tone="success">Marketing OK</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && <NewCustomerModal garageId={gid!} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewCustomerModal({ garageId, onClose }: { garageId: string; onClose: () => void }) {
  const create = useCreateCustomer()
  const toast = useToast()
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', city: '', consent: false })
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.first_name && !form.last_name) {
      toast.error('Indiquez au moins un nom')
      return
    }
    try {
      await create.mutateAsync({
        garage_id: garageId,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
        email: form.email || null,
        city: form.city || null,
        marketing_consent: form.consent,
      })
      toast.success('Client ajouté')
      onClose()
    } catch (e) {
      toast.error('Création impossible', (e as Error).message)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nouveau client" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={create.isPending} onClick={submit}>Ajouter</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" htmlFor="fn"><Input id="fn" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} /></Field>
        <Field label="Nom" htmlFor="ln"><Input id="ln" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} /></Field>
        <Field label="Téléphone" htmlFor="ph"><Input id="ph" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Email" htmlFor="em"><Input id="em" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Ville" htmlFor="ci"><Input id="ci" value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" className="h-4 w-4 rounded border-input" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
        Consentement communications marketing
      </label>
    </Modal>
  )
}
