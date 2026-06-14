// Converts an accepted/confirmed service_request into a CRM customer (+ vehicle)
// and a planned appointment. Runs with the CALLER's JWT, so every write is still
// enforced by RLS — no service_role key is used here.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const Body = z.object({ request_id: z.string().uuid() })

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function splitName(name: string | null) {
  const parts = (name ?? '').trim().split(/\s+/)
  if (parts.length <= 1) return { first: parts[0] ?? '', last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

function parseVehicle(label: string | null) {
  if (!label) return { brand: 'Véhicule', model: '', registration: null as string | null }
  const [namePart, platePart] = label.split(/\s+[·-]\s+/)
  const tokens = namePart.trim().split(/\s+/)
  return {
    brand: tokens[0] ?? 'Véhicule',
    model: tokens.slice(1).join(' '),
    registration: platePart?.trim() ?? null,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization' }, 401)

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  // Read the request (RLS: only a member of the request's garage can read it).
  const { data: reqRow, error: reqErr } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', parsed.data.request_id)
    .single()
  if (reqErr || !reqRow) return json({ error: 'Request not found or not authorized' }, 404)

  // Build appointment start from proposed slot if present, else requested slot.
  const date = reqRow.proposed_date ?? reqRow.requested_date
  const time = (reqRow.proposed_time ?? reqRow.requested_time ?? '09:00:00').slice(0, 5)
  const startsAt = date ? new Date(`${date}T${time}:00`).toISOString() : new Date().toISOString()

  // Find or create the customer (garage CRM).
  let customerId = reqRow.customer_id as string | null
  if (!customerId) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('garage_id', reqRow.garage_id)
      .eq('linked_user_id', reqRow.client_id)
      .maybeSingle()

    if (existing) {
      customerId = existing.id
    } else {
      const { first, last } = splitName(reqRow.contact_name)
      const { data: created, error: custErr } = await supabase
        .from('customers')
        .insert({
          garage_id: reqRow.garage_id,
          linked_user_id: reqRow.client_id,
          first_name: first,
          last_name: last,
          phone: reqRow.contact_phone,
          email: reqRow.contact_email,
          source: 'reservation',
        })
        .select('id')
        .single()
      if (custErr) return json({ error: `customer: ${custErr.message}` }, 400)
      customerId = created.id
    }
  }

  // Best-effort: create the vehicle in the garage CRM.
  let vehicleId: string | null = null
  {
    const v = parseVehicle(reqRow.vehicle_label)
    const { data: createdVehicle } = await supabase
      .from('vehicles')
      .insert({
        garage_id: reqRow.garage_id,
        customer_id: customerId,
        brand: v.brand,
        model: v.model || '—',
        registration: v.registration,
        status: 'in_service',
      })
      .select('id')
      .single()
    vehicleId = createdVehicle?.id ?? null
  }

  // Create the appointment.
  const { data: appt, error: apptErr } = await supabase
    .from('appointments')
    .insert({
      garage_id: reqRow.garage_id,
      customer_id: customerId,
      vehicle_id: vehicleId,
      service_request_id: reqRow.id,
      title: `${reqRow.service_name} — ${reqRow.vehicle_label ?? ''}`.trim(),
      starts_at: startsAt,
      status: 'scheduled',
    })
    .select('id')
    .single()
  if (apptErr) return json({ error: `appointment: ${apptErr.message}` }, 400)

  // Link everything back to the request and confirm it.
  const { error: updErr } = await supabase
    .from('service_requests')
    .update({ status: 'confirmed', customer_id: customerId, appointment_id: appt.id })
    .eq('id', reqRow.id)
  if (updErr) return json({ error: `update: ${updErr.message}` }, 400)

  return json({ appointment_id: appt.id, customer_id: customerId })
})
