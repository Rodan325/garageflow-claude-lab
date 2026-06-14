// Generates a vehicle ad. The OpenAI key lives ONLY in this function's env.
// Without a key, it returns a clean deterministic template so the demo still works.
import { z } from 'npm:zod@3'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const Body = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().optional(),
  mileage: z.number().int().optional(),
  fuel: z.string().optional(),
  gearbox: z.string().optional(),
  price: z.number().optional(),
  options: z.array(z.string()).max(30).optional(),
})

function template(v: z.infer<typeof Body>) {
  const head = `${v.brand} ${v.model}${v.year ? ` (${v.year})` : ''}`
  return {
    title: `${head}${v.mileage ? ` · ${v.mileage.toLocaleString('fr-FR')} km` : ''}`,
    description: `${head} entretenue et révisée. ${v.fuel ?? ''} ${v.gearbox ?? ''}. ${
      v.mileage ? `${v.mileage.toLocaleString('fr-FR')} km. ` : ''
    }${v.options?.length ? `Équipements : ${v.options.join(', ')}.` : ''} Disponible immédiatement, dossier complet sur place.`.replace(/\s+/g, ' ').trim(),
    highlights: [
      v.year ? `Année ${v.year}` : 'Bon état général',
      v.fuel ?? 'Motorisation fiable',
      v.gearbox ?? 'Conduite agréable',
      'Entretien à jour',
    ],
    social: `🚗 ${head} dispo au garage ! ${v.price ? `À partir de ${v.price} €. ` : ''}Contactez-nous pour un essai.`,
    seo: `${head} occasion ${v.fuel ?? ''} ${v.gearbox ?? ''} — garage de confiance`.trim(),
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400)

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return json({ source: 'template', ad: template(parsed.data) })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en annonces automobiles. Réponds en JSON {title, description, highlights[], social, seo}.' },
          { role: 'user', content: JSON.stringify(parsed.data) },
        ],
        response_format: { type: 'json_object' },
      }),
    })
    const data = await res.json()
    const ad = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    return json({ source: 'openai', ad })
  } catch {
    return json({ source: 'template', ad: template(parsed.data) })
  }
})
