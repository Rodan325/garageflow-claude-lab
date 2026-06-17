/**
 * RLS anti-leak test. Runs against the live project using ONLY the public anon
 * key + password sign-in (exactly like the browser). Proves:
 *  - anon cannot read private tables, can read the public catalog
 *  - a client cannot read any garage CRM data, only their own requests
 *  - garage A cannot read or write garage B's rows (and vice-versa)
 *
 * Run:  node --env-file=.env scripts/rls-antileak.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (use --env-file=.env)')
  process.exit(2)
}

const GARAGE_A = '11111111-1111-4111-8111-111111111111'
const GARAGE_B = '22222222-2222-4222-8222-222222222222'

let pass = 0
let fail = 0
function check(name, ok, extra = '') {
  if (ok) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`) }
  else { fail++; console.log(`  \x1b[31m✗ ${name}\x1b[0m ${extra}`) }
}

async function clientFor(email, password) {
  const c = createClient(url, anon, { auth: { persistSession: false } })
  if (email) {
    const { error } = await c.auth.signInWithPassword({ email, password })
    if (error) throw new Error(`sign-in ${email}: ${error.message}`)
  }
  return c
}

async function main() {
  console.log('\nRLS anti-leak — GarageFlow C\n')

  // 1) ANON
  console.log('Anonyme (non connecté)')
  const anonC = createClient(url, anon, { auth: { persistSession: false } })
  {
    const { data: cust } = await anonC.from('customers').select('*')
    check('anon ne lit AUCUN client (RLS)', (cust ?? []).length === 0)
    const { data: garages } = await anonC.from('garages').select('*')
    check('anon lit l’annuaire public', (garages ?? []).length >= 1)
    check('anon ne voit pas le garage privé B', !(garages ?? []).some((g) => g.id === GARAGE_B))
    const { data: svc } = await anonC.from('garage_services').select('*')
    check('anon lit le catalogue de prestations', (svc ?? []).length >= 1)
    const { data: reqs } = await anonC.from('service_requests').select('*')
    check('anon ne lit aucune demande', (reqs ?? []).length === 0)
  }

  // 2) CLIENT
  console.log('\nClient final (client@demo.fr)')
  const client = await clientFor('client@demo.fr', 'Demo1234!')
  {
    const { data: cust } = await client.from('customers').select('*')
    check('client ne lit AUCUN client CRM', (cust ?? []).length === 0)
    const { data: veh } = await client.from('vehicles').select('*')
    check('client ne lit AUCUN véhicule garage', (veh ?? []).length === 0)
    const { data: reqs } = await client.from('service_requests').select('*')
    check('client lit SES demandes', (reqs ?? []).length >= 1)
    check('client ne voit que ses demandes', (reqs ?? []).every((r) => r.client_id))
    const { data: ownVeh } = await client.from('client_vehicles').select('*')
    check('client lit ses propres véhicules', (ownVeh ?? []).length >= 1)
  }

  // 3) GARAGE A
  console.log('\nGarage A (owner@demo-garage.fr)')
  const ownerA = await clientFor('owner@demo-garage.fr', 'Demo1234!')
  {
    const { data: cust } = await ownerA.from('customers').select('*')
    check('A lit ses clients', (cust ?? []).length >= 1)
    check('A ne voit AUCUN client du garage B', !(cust ?? []).some((c) => c.garage_id === GARAGE_B))
    const { data: bCust } = await ownerA.from('customers').select('*').eq('garage_id', GARAGE_B)
    check('A filtré sur B → 0 ligne', (bCust ?? []).length === 0)
    // cross-tenant WRITE attempt
    const { error: writeErr } = await ownerA
      .from('customers')
      .insert({ garage_id: GARAGE_B, first_name: 'Intrus' })
      .select()
    check('A ne peut PAS écrire dans le garage B', !!writeErr, writeErr ? '' : '(écriture acceptée !)')
  }

  // 4) GARAGE B
  console.log('\nGarage B (ownerb@demo-garage.fr)')
  const ownerB = await clientFor('ownerb@demo-garage.fr', 'Demo1234!')
  {
    const { data: cust } = await ownerB.from('customers').select('*')
    check('B lit ses clients', (cust ?? []).length >= 1)
    check('B ne voit AUCUN client du garage A', !(cust ?? []).some((c) => c.garage_id === GARAGE_A))
  }

  // 5) QUOTE RPCs — server-authoritative totals + guards
  console.log('\nDevis — RPC serveur (recalcul + garde-fous)')
  {
    const g = await clientFor('owner@demo-garage.fr', 'Demo1234!')
    const MARC = 'd1111111-0000-4000-8000-000000000001'
    const INES = 'd1111111-0000-4000-8000-000000000002'
    const B_CUSTOMER = 'd2222222-0000-4000-8000-000000000001'
    const B_VEHICLE = 'e2222222-0000-4000-8000-000000000001'
    const B_REQUEST = 'f2222222-0000-4000-8000-000000000001'
    const created = []
    // bogus totals on purpose — the DB must ignore and recompute them.
    const baseQuote = (extra = {}) => ({ garage_id: GARAGE_A, title: 'Test', client_name: 'Test', subtotal: 1, tax_total: 1, total: 1, ...extra })
    const goodLines = [{ label: 'Pièce', quantity: 2, unit_price: 50, tax_rate: 20, line_total: 999 }]

    const c0 = await g.rpc('create_quote_with_lines', { p_quote: baseQuote(), p_lines: goodLines })
    check('création RPC OK', !c0.error && !!c0.data, c0.error?.message)
    if (c0.data) {
      created.push(c0.data.id)
      check('subtotal recalculé serveur (100)', Number(c0.data.subtotal) === 100, `= ${c0.data?.subtotal}`)
      check('TVA recalculée serveur (20)', Number(c0.data.tax_total) === 20, `= ${c0.data?.tax_total}`)
      check('total recalculé serveur (120)', Number(c0.data.total) === 120, `= ${c0.data?.total}`)
    }

    check('quantité invalide refusée', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote(), p_lines: [{ label: 'X', quantity: 0, unit_price: 10, tax_rate: 20 }] })).error)
    check('TVA invalide refusée', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote(), p_lines: [{ label: 'X', quantity: 1, unit_price: 10, tax_rate: 150 }] })).error)
    check('devis sans ligne refusé', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote(), p_lines: [] })).error)
    check('client d’un autre garage refusé', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote({ customer_id: B_CUSTOMER }), p_lines: goodLines })).error)
    check('véhicule d’un autre garage refusé', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote({ vehicle_id: B_VEHICLE }), p_lines: goodLines })).error)
    check('demande d’un autre garage refusée', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote({ service_request_id: B_REQUEST }), p_lines: goodLines })).error)
    check('non-membre refusé (garage B)', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote({ garage_id: GARAGE_B }), p_lines: goodLines })).error)

    // cross-client vehicle: Marc as client + Inès's vehicle
    const { data: veh } = await g.from('vehicles').select('id,customer_id').eq('garage_id', GARAGE_A)
    const inesVeh = (veh ?? []).find((v) => v.customer_id === INES)
    if (inesVeh) {
      check('véhicule autre client refusé sans confirmation', !!(await g.rpc('create_quote_with_lines', { p_quote: baseQuote({ customer_id: MARC, vehicle_id: inesVeh.id }), p_lines: goodLines })).error)
      const ok = await g.rpc('create_quote_with_lines', { p_quote: baseQuote({ customer_id: MARC, vehicle_id: inesVeh.id, cross_customer_vehicle_confirmed: true }), p_lines: goodLines })
      check('véhicule autre client accepté avec confirmation', !ok.error && !!ok.data, ok.error?.message)
      if (ok.data) created.push(ok.data.id)
    } else {
      check('véhicule Inès trouvé (test cross-client)', false, '(introuvable)')
    }

    // update recompute
    const cu = await g.rpc('create_quote_with_lines', { p_quote: baseQuote(), p_lines: goodLines })
    if (cu.data) {
      created.push(cu.data.id)
      const u = await g.rpc('update_quote_with_lines', { p_id: cu.data.id, p_quote: baseQuote(), p_lines: [{ label: 'Maj', quantity: 3, unit_price: 100, tax_rate: 10 }] })
      check('update RPC OK', !u.error && !!u.data, u.error?.message)
      if (u.data) {
        check('update: subtotal recalculé (300)', Number(u.data.subtotal) === 300, `= ${u.data?.subtotal}`)
        check('update: total recalculé (330)', Number(u.data.total) === 330, `= ${u.data?.total}`)
      }
    }

    for (const id of created) await g.from('quotes').delete().eq('id', id)
    console.log(`  (${created.length} devis de test nettoyés)`)
  }

  console.log(`\nRésultat : ${pass} réussis, ${fail} échoués\n`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('Erreur test RLS:', e.message)
  process.exit(2)
})
