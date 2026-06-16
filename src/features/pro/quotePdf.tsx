import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { Garage, Quote, QuoteLine } from '@/types/domain'
import { euro, shortDate } from '@/lib/format'

export interface QuotePdfData {
  quote: Quote
  lines: QuoteLine[]
  garage: Garage | null
  customer?: { phone?: string | null; email?: string | null } | null
}

function build(accent: string) {
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, color: '#1e293b', fontFamily: 'Helvetica' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: accent, paddingBottom: 14 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logo: { width: 54, height: 54, objectFit: 'contain' },
    logoFallback: { width: 54, height: 54, borderRadius: 6, backgroundColor: accent, color: '#fff', fontSize: 24, fontFamily: 'Helvetica-Bold', textAlign: 'center', paddingTop: 13 },
    garageName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    muted: { color: '#64748b' },
    docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: accent, textAlign: 'right' },
    section: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
    strong: { fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    subject: { marginTop: 18, fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    th: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: accent, paddingBottom: 5, marginTop: 8, fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
    tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 },
    cDesc: { flex: 1 },
    cNum: { width: 70, textAlign: 'right' },
    totals: { marginTop: 12, alignSelf: 'flex-end', width: 200 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    totalTtc: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: accent, marginTop: 4, paddingTop: 4 },
    totalTtcLabel: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
    totalTtcVal: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: accent },
    conditions: { marginTop: 24, fontSize: 8, color: '#64748b' },
    footer: { marginTop: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    legal: { fontSize: 7, color: '#94a3b8', maxWidth: 280 },
    signBox: { width: 180, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, padding: 10, textAlign: 'center' },
    genFooter: { position: 'absolute', bottom: 18, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: '#cbd5e1' },
  })
}

function QuoteDoc({ quote, lines, garage, customer }: QuotePdfData) {
  const accent = garage?.accent_color || '#0f766e'
  const s = build(accent)
  const legal =
    garage?.legal_info ||
    [garage?.legal_name, garage?.siret ? `SIRET ${garage.siret}` : null, garage?.vat_number].filter(Boolean).join(' · ')
  const [vehicleName, plate] = (quote.vehicle_label ?? '').split(' · ')
  const clientPhone = quote.client_phone || customer?.phone
  const clientEmail = quote.client_email || customer?.email

  return (
    <Document title={`Devis ${quote.number}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.brandRow}>
            {garage?.logo_url ? <Image src={garage.logo_url} style={s.logo} /> : <Text style={s.logoFallback}>{(garage?.name ?? 'G').slice(0, 1)}</Text>}
            <View>
              <Text style={s.garageName}>{garage?.name ?? 'Garage'}</Text>
              {garage?.address ? <Text style={s.muted}>{garage.address}{garage.city ? `, ${garage.city}` : ''}</Text> : null}
              <Text style={s.muted}>{[garage?.phone, garage?.email].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
          <View>
            <Text style={s.docTitle}>DEVIS</Text>
            <Text style={{ textAlign: 'right' }}>{quote.number}</Text>
            <Text style={[s.muted, { textAlign: 'right' }]}>Date : {shortDate(quote.created_at)}</Text>
            {quote.valid_until ? <Text style={[s.muted, { textAlign: 'right' }]}>Valable jusqu’au {shortDate(quote.valid_until)}</Text> : null}
          </View>
        </View>

        {/* Client / vehicle */}
        <View style={s.section}>
          <View style={{ width: '48%' }}>
            <Text style={s.label}>Client</Text>
            <Text style={s.strong}>{quote.client_name || '—'}</Text>
            {clientPhone ? <Text style={s.muted}>{clientPhone}</Text> : null}
            {clientEmail ? <Text style={s.muted}>{clientEmail}</Text> : null}
          </View>
          <View style={{ width: '48%' }}>
            <Text style={s.label}>Véhicule</Text>
            <Text style={s.strong}>{vehicleName || quote.vehicle_label || '—'}</Text>
            {plate ? <Text style={[s.strong, { marginTop: 2 }]}>Immatriculation : {plate}</Text> : null}
          </View>
        </View>

        <Text style={s.subject}>{quote.title}</Text>

        {/* Lines */}
        <View style={s.th}>
          <Text style={s.cDesc}>Désignation</Text>
          <Text style={s.cNum}>Qté</Text>
          <Text style={s.cNum}>PU HT</Text>
          <Text style={s.cNum}>TVA</Text>
          <Text style={s.cNum}>Total HT</Text>
        </View>
        {lines.map((l) => (
          <View key={l.id} style={s.tr}>
            <Text style={s.cDesc}>{l.label}</Text>
            <Text style={s.cNum}>{l.quantity}</Text>
            <Text style={s.cNum}>{euro(l.unit_price)}</Text>
            <Text style={s.cNum}>{l.tax_rate}%</Text>
            <Text style={s.cNum}>{euro(l.line_total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}><Text style={s.muted}>Total HT</Text><Text>{euro(quote.subtotal)}</Text></View>
          <View style={s.totalRow}><Text style={s.muted}>TVA</Text><Text>{euro(quote.tax_total)}</Text></View>
          <View style={s.totalTtc}><Text style={s.totalTtcLabel}>Total TTC</Text><Text style={s.totalTtcVal}>{euro(quote.total)}</Text></View>
        </View>

        {quote.conditions ? (
          <View style={s.conditions}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: '#475569', marginBottom: 2 }}>Conditions</Text>
            <Text>{quote.conditions}</Text>
          </View>
        ) : null}

        <View style={s.footer}>
          <Text style={s.legal}>{legal}</Text>
          <View style={s.signBox}>
            <Text style={s.strong}>Bon pour accord</Text>
            <Text style={[s.muted, { marginTop: 24 }]}>Date et signature</Text>
          </View>
        </View>
        <Text fixed style={s.genFooter}>Document généré par GarageFlow</Text>
      </Page>
    </Document>
  )
}

/** Generates a real .pdf file and triggers a download. */
export async function downloadQuotePdf(data: QuotePdfData) {
  const blob = await pdf(<QuoteDoc {...data} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.quote.number}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
