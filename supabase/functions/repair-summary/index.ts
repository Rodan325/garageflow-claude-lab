// Summarises a repair for the client and for internal notes.
// OpenAI key stays server-side; deterministic template fallback otherwise.
import { z } from 'npm:zod@3'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const Body = z.object({
  symptom: z.string().optional(),
  diagnostic: z.string().optional(),
  parts: z.array(z.string()).max(40).optional(),
  hours: z.number().optional(),
  status: z.string().optional(),
})

function template(v: z.infer<typeof Body>) {
  return {
    client_summary: `Nous avons examiné votre véhicule${v.symptom ? ` suite à : ${v.symptom}` : ''}. ${
      v.diagnostic ? `Diagnostic : ${v.diagnostic}. ` : ''
    }${v.parts?.length ? `Pièces concernées : ${v.parts.join(', ')}. ` : ''}Nous restons disponibles pour toute question.`.replace(/\s+/g, ' ').trim(),
    internal_summary: `Symptôme: ${v.symptom ?? '—'} | Diag: ${v.diagnostic ?? '—'} | Pièces: ${
      v.parts?.join(', ') ?? '—'
    } | Temps: ${v.hours ?? '—'}h | Statut: ${v.status ?? '—'}`,
    next_action:
      v.status === 'ready' ? 'Prévenir le client pour la restitution.' : 'Poursuivre la réparation et tenir le client informé.',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400)

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return json({ source: 'template', summary: template(parsed.data) })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es réceptionnaire de garage. Réponds en JSON {client_summary, internal_summary, next_action}. Pas de données personnelles inutiles.' },
          { role: 'user', content: JSON.stringify(parsed.data) },
        ],
        response_format: { type: 'json_object' },
      }),
    })
    const data = await res.json()
    const summary = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    return json({ source: 'openai', summary })
  } catch {
    return json({ source: 'template', summary: template(parsed.data) })
  }
})
