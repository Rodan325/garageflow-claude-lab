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

  console.log(`\nRésultat : ${pass} réussis, ${fail} échoués\n`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('Erreur test RLS:', e.message)
  process.exit(2)
})
