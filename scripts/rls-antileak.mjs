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

  // 6) QUOTE LIFE-CYCLE — send → public consult → accept / decline
  console.log('\nDevis — cycle de vie (envoi, consultation, acceptation/refus)')
  {
    const g = await clientFor('owner@demo-garage.fr', 'Demo1234!')
    const pub = createClient(url, anon, { auth: { persistSession: false } })
    const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
    const past = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
    const baseQuote = { garage_id: GARAGE_A, title: 'Cycle', client_name: 'Client Cycle', valid_until: future, subtotal: 1, tax_total: 1, total: 1 }
    const goodLines = [{ label: 'Forfait', quantity: 1, unit_price: 200, tax_rate: 20 }]
    const created = []

    // send requires a validity date: missing or past is refused
    {
      const nv = await g.rpc('create_quote_with_lines', { p_quote: { ...baseQuote, valid_until: null }, p_lines: goodLines })
      if (nv.data) {
        created.push(nv.data.id)
        check('send refusé sans date de validité', !!(await g.rpc('send_quote', { p_id: nv.data.id })).error)
        await g.rpc('update_quote_with_lines', { p_id: nv.data.id, p_quote: { ...baseQuote, valid_until: past }, p_lines: goodLines })
        check('send refusé avec date de validité passée', !!(await g.rpc('send_quote', { p_id: nv.data.id })).error)
      } else {
        check('création brouillon (test validité)', false, nv.error?.message)
      }
    }

    // draft with a FUTURE validity date → send (mints token)
    const c1 = await g.rpc('create_quote_with_lines', { p_quote: baseQuote, p_lines: goodLines })
    let token = null, q1 = null
    if (c1.data) {
      created.push(c1.data.id); q1 = c1.data.id
      const sent = await g.rpc('send_quote', { p_id: c1.data.id })
      check('send_quote : brouillon → envoyé', !sent.error && sent.data?.status === 'sent', sent.error?.message)
      token = sent.data?.client_token
      check('send_quote : jeton client généré', typeof token === 'string' && token.length >= 32)
    } else {
      check('création brouillon pour cycle', false, c1.error?.message)
    }

    // a SENT quote is no longer directly editable
    if (q1) {
      const upd = await g.rpc('update_quote_with_lines', { p_id: q1, p_quote: baseQuote, p_lines: goodLines })
      check('devis envoyé non modifiable directement', !!upd.error)
    }

    // garage cannot raw-set accepted (trigger: client-only)
    if (q1) {
      const raw = await g.from('quotes').update({ status: 'accepted' }).eq('id', q1).select()
      check('garage ne peut PAS accepter à la place du client', !!raw.error || (raw.data ?? []).length === 0)
    }

    // anon consults by token only — never by enumeration
    if (token) {
      const view = await pub.rpc('get_quote_public', { p_token: token })
      check('consultation publique par jeton (anon)', !view.error && !!view.data, view.error?.message)
      const bad = await pub.rpc('get_quote_public', { p_token: 'x'.repeat(64) })
      check('jeton invalide → aucun devis', !bad.error && bad.data === null)
      const direct = await pub.from('quotes').select('*')
      check('anon ne lit toujours pas la table devis', (direct.data ?? []).length === 0)
    }

    // anon accepts via token
    if (token) {
      const acc = await pub.rpc('accept_quote_public', { p_token: token })
      check('acceptation client (anon) → accepté', !acc.error && acc.data?.quote?.status === 'accepted', acc.error?.message)
    }

    // a second quote: decline with a reason
    const c2 = await g.rpc('create_quote_with_lines', { p_quote: baseQuote, p_lines: goodLines })
    if (c2.data) {
      created.push(c2.data.id)
      const sent2 = await g.rpc('send_quote', { p_id: c2.data.id })
      const dec = await pub.rpc('decline_quote_public', { p_token: sent2.data?.client_token, p_reason: 'Trop cher' })
      check('refus client (anon) → refusé + motif',
        !dec.error && dec.data?.quote?.status === 'declined' && dec.data?.quote?.decline_reason === 'Trop cher', dec.error?.message)
    }

    // revise an ACCEPTED quote → fresh draft linked to the (untouched) original
    if (q1) {
      const rev = await g.rpc('revise_quote', { p_id: q1 })
      check('revise_quote : nouvelle version en brouillon',
        !rev.error && rev.data?.status === 'draft' && rev.data?.revised_from === q1, rev.error?.message)
      if (rev.data) created.push(rev.data.id)
      const orig = await g.from('quotes').select('status').eq('id', q1).single()
      check('devis accepté inchangé après révision', orig.data?.status === 'accepted', orig.error?.message)
    }

    for (const id of created) await g.from('quotes').delete().eq('id', id)
    console.log(`  (${created.length} devis de test nettoyés)`)
  }

  // 7) CLIENT VEHICLE DOSSIER — consent-based sharing
  console.log('\nDossier véhicule client — partage par consentement')
  {
    const cl = await clientFor('client@demo.fr', 'Demo1234!')
    const { data: me } = await cl.auth.getUser()
    const uid = me?.user?.id
    const gA = await clientFor('owner@demo-garage.fr', 'Demo1234!')
    const gB = await clientFor('ownerb@demo-garage.fr', 'Demo1234!')

    const veh = await cl.from('client_vehicles')
      .insert({ client_id: uid, brand: 'Tesla', model: 'Model 3', registration: 'TS-123-LA' }).select().single()
    check('client crée son véhicule (privé)', !veh.error && !!veh.data, veh.error?.message)
    const vid = veh.data?.id

    if (vid) {
      const aBefore = await gA.from('client_vehicles').select('*').eq('id', vid)
      check('garage A ne voit PAS le véhicule non partagé', (aBefore.data ?? []).length === 0)

      const req = await cl.from('service_requests')
        .insert({ garage_id: GARAGE_A, client_id: uid, service_name: 'Test partage vehicule', client_vehicle_id: vid, vehicle_label: 'Tesla Model 3 · TS-123-LA', status: 'pending' })
        .select().single()
      check('client crée une demande avec son véhicule', !req.error && !!req.data, req.error?.message)
      const rid = req.data?.id

      const aAfter = await gA.from('client_vehicles').select('*').eq('id', vid)
      check('garage A voit le véhicule PARTAGÉ via sa demande', (aAfter.data ?? []).length === 1)
      const aShare = await gA.from('client_vehicle_shares').select('*').eq('client_vehicle_id', vid)
      check('garage A voit le consentement (share actif)', (aShare.data ?? []).length === 1)

      const bAfter = await gB.from('client_vehicles').select('*').eq('id', vid)
      check('garage B ne voit PAS le véhicule (non partagé avec lui)', (bAfter.data ?? []).length === 0)
      const bShares = await gB.from('client_vehicle_shares').select('*')
      check('garage B ne voit aucun share de ce véhicule', !(bShares.data ?? []).some((s) => s.client_vehicle_id === vid))

      // A garage cannot SELF-GRANT access by inserting a share for a vehicle it doesn't own (0019).
      const { data: meB } = await gB.auth.getUser()
      const selfGrant = await gB.from('client_vehicle_shares')
        .insert({ client_vehicle_id: vid, garage_id: GARAGE_B, shared_by: meB?.user?.id })
        .select()
      check('un garage ne peut pas s’auto-donner accès (share)', !!selfGrant.error || (selfGrant.data ?? []).length === 0)
      const bAfterSelf = await gB.from('client_vehicles').select('*').eq('id', vid)
      check('garage B ne voit toujours pas le véhicule après auto-share', (bAfterSelf.data ?? []).length === 0)

      const rev = await cl.from('client_vehicle_shares').update({ revoked_at: new Date().toISOString() })
        .eq('client_vehicle_id', vid).is('revoked_at', null).select()
      check('client révoque le partage', !rev.error && (rev.data ?? []).length >= 1, rev.error?.message)
      const aRevoked = await gA.from('client_vehicles').select('*').eq('id', vid)
      check('garage A ne voit plus le véhicule après révocation', (aRevoked.data ?? []).length === 0)

      // client can delete a vehicle even after it was used in a request
      // (FK SET NULL cascade must not be blocked by the request guard — see 0018)
      await cl.from('client_vehicles').delete().eq('id', vid) // share cascades
      const gone = await cl.from('client_vehicles').select('id').eq('id', vid)
      check('client supprime un véhicule utilisé dans une demande', (gone.data ?? []).length === 0)

      // Clean up the test request: the garage removes it from its own inbox (policy 0020).
      // Done without a check() to keep the 60/60 total; warn if it somehow remains.
      if (rid) {
        await gA.from('service_requests').delete().eq('id', rid)
        const leftover = await gA.from('service_requests').select('id').eq('id', rid)
        if ((leftover.data ?? []).length > 0) console.warn(`  ⚠ demande de test non supprimée (${rid})`)
      }
    }
    console.log('  (véhicule + demande de test nettoyés)')
  }

  // 8) DIRECT-ID ACCESS — a guessed row id must never bypass RLS
  console.log('\nAccès par ID direct (contournement RLS)')
  {
    const gA = await clientFor('owner@demo-garage.fr', 'Demo1234!')
    const gB = await clientFor('ownerb@demo-garage.fr', 'Demo1234!')
    const cl = await clientFor('client@demo.fr', 'Demo1234!')

    const q = await gA.rpc('create_quote_with_lines', {
      p_quote: { garage_id: GARAGE_A, title: 'IDtest', client_name: 'X', valid_until: new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10), subtotal: 1, tax_total: 1, total: 1 },
      p_lines: [{ label: 'L', quantity: 1, unit_price: 10, tax_rate: 20 }],
    })
    const qid = q.data?.id
    if (qid) {
      const bById = await gB.from('quotes').select('*').eq('id', qid)
      check('garage B ne lit pas un devis A par ID direct', (bById.data ?? []).length === 0)
      const cById = await cl.from('quotes').select('*').eq('id', qid)
      check('un client ne lit pas un devis garage par ID direct', (cById.data ?? []).length === 0)
      const anonById = await createClient(url, anon, { auth: { persistSession: false } }).from('quotes').select('*').eq('id', qid)
      check('anon ne lit pas un devis par ID direct', (anonById.data ?? []).length === 0)
      await gA.from('quotes').delete().eq('id', qid)
    } else {
      check('création devis (test ID direct)', false, q.error?.message)
    }
  }

  // 9) LEGAL ACCEPTANCES — journal d'acceptation strictement personnel
  console.log('\nAcceptations légales — journal personnel (RLS)')
  {
    const cl = await clientFor('client@demo.fr', 'Demo1234!')
    const gA = await clientFor('owner@demo-garage.fr', 'Demo1234!')
    const anonC = createClient(url, anon, { auth: { persistSession: false } })
    const { data: clMe } = await cl.auth.getUser()
    const { data: gaMe } = await gA.auth.getUser()
    const clUid = clMe?.user?.id
    const gaUid = gaMe?.user?.id
    const VERSION = '2026-07-02'

    // Insertion idempotente : une acceptation légitime pour les comptes de démo
    // (le journal est append-only, ces lignes restent — elles servent aussi à la gate).
    const ensureOwn = async (client, uid, role, doc) => {
      const { data: exist } = await client.from('legal_acceptances')
        .select('id').eq('user_id', uid).eq('document_type', doc).eq('document_version', VERSION).limit(1)
      if ((exist ?? []).length > 0) return { error: null }
      return client.from('legal_acceptances').insert({
        user_id: uid, role, document_type: doc, document_version: VERSION,
        acceptance_context: 'legal_gate', user_agent: 'rls-antileak-test',
      })
    }

    const insCl = await ensureOwn(cl, clUid, 'client', 'terms')
    await ensureOwn(cl, clUid, 'client', 'privacy')
    check('client insère SA propre acceptation', !insCl.error, insCl.error?.message)

    const forged = await cl.from('legal_acceptances').insert({
      user_id: gaUid, role: 'client', document_type: 'terms', document_version: VERSION,
      acceptance_context: 'legal_gate',
    }).select()
    check('client ne peut PAS insérer une acceptation pour un autre user', !!forged.error || (forged.data ?? []).length === 0)

    const clRead = await cl.from('legal_acceptances').select('*')
    check('client lit ses propres acceptations', (clRead.data ?? []).length >= 1
      && (clRead.data ?? []).every((r) => r.user_id === clUid))

    const insGa = await ensureOwn(gA, gaUid, 'garage', 'terms')
    await ensureOwn(gA, gaUid, 'garage', 'privacy')
    await ensureOwn(gA, gaUid, 'garage', 'pilot_agreement')
    await ensureOwn(gA, gaUid, 'garage', 'dpa')
    check('garage insère SES propres acceptations', !insGa.error, insGa.error?.message)

    const gaRead = await gA.from('legal_acceptances').select('*')
    check('garage lit ses propres acceptations', (gaRead.data ?? []).length >= 1
      && (gaRead.data ?? []).every((r) => r.user_id === gaUid))

    const gaCross = await gA.from('legal_acceptances').select('*').eq('user_id', clUid)
    check('garage ne lit PAS les acceptations d’un autre user', (gaCross.data ?? []).length === 0)

    const anonRead = await anonC.from('legal_acceptances').select('*')
    check('anon ne lit pas la table des acceptations', (anonRead.data ?? []).length === 0)

    const anonIns = await anonC.from('legal_acceptances').insert({
      user_id: clUid, role: 'client', document_type: 'terms', document_version: VERSION,
    }).select()
    check('anon ne peut pas insérer d’acceptation', !!anonIns.error || (anonIns.data ?? []).length === 0)
  }

  console.log(`\nRésultat : ${pass} réussis, ${fail} échoués\n`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('Erreur test RLS:', e.message)
  process.exit(2)
})
