import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { Garage, Quote, QuoteLine } from '@/types/domain'
import { euro, shortDate } from '@/lib/format'
import { getActiveBrand, getBrand } from '@/branding'
import { translate } from '@/i18n/catalog'
import type { Lang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'
import { demoPublicQuoteBrand, isDemo } from '@/lib/demo'

const ARABIC_PDF_FONT = 'Amiri'

Font.register({
  family: ARABIC_PDF_FONT,
  fonts: [
    { src: '/fonts/Amiri-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Amiri-Bold.ttf', fontWeight: 700 },
  ],
})

export interface QuotePdfData {
  quote: Quote
  lines: QuoteLine[]
  garage: Garage | null
  customer?: { phone?: string | null; email?: string | null } | null
  lang?: Lang
}

function build(accent: string, rtl: boolean) {
  const bold = rtl
    ? { fontFamily: ARABIC_PDF_FONT, fontWeight: 700 as const }
    : { fontFamily: 'Helvetica-Bold' }
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, color: '#1e293b', fontFamily: rtl ? ARABIC_PDF_FONT : 'Helvetica' },
    headerRow: { flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: accent, paddingBottom: 14 },
    brandRow: { flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 },
    logo: { width: 54, height: 54, objectFit: 'contain' },
    logoFallback: { width: 54, height: 54, borderRadius: 6, backgroundColor: accent, color: '#fff', fontSize: 24, textAlign: 'center' },
    logoInitialLatin: { fontFamily: 'Helvetica-Bold', paddingTop: 13 },
    logoInitialArabic: { fontFamily: ARABIC_PDF_FONT, fontWeight: 700, paddingTop: 5 },
    garageName: { fontSize: 14, color: '#0f172a', textAlign: rtl ? 'right' : 'left', ...bold },
    muted: { color: '#64748b' },
    docTitle: { fontSize: 18, color: accent, textAlign: rtl ? 'left' : 'right', ...bold },
    docMeta: { textAlign: rtl ? 'left' : 'right' },
    section: { marginTop: 18, flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between' },
    label: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
    strong: { color: '#0f172a', ...bold },
    subject: { marginTop: 18, fontSize: 12, color: '#0f172a', textAlign: rtl ? 'right' : 'left', ...bold },
    th: { flexDirection: rtl ? 'row-reverse' : 'row', borderBottomWidth: 1, borderBottomColor: accent, paddingBottom: 5, marginTop: 8, fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
    tr: { flexDirection: rtl ? 'row-reverse' : 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 },
    cDesc: { flex: 1, textAlign: rtl ? 'right' : 'left' },
    cNum: { width: 70, textAlign: 'right' },
    totals: { marginTop: 12, alignSelf: rtl ? 'flex-start' : 'flex-end', width: 200 },
    totalRow: { flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 2 },
    totalTtc: { flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: accent, marginTop: 4, paddingTop: 4 },
    totalTtcLabel: { fontSize: 12, ...bold },
    totalTtcVal: { fontSize: 12, color: accent, ...bold },
    conditions: { marginTop: 24, fontSize: 8, color: '#64748b', textAlign: rtl ? 'right' : 'left' },
    conditionsTitle: { color: '#475569', marginBottom: 2, ...bold },
    footer: { marginTop: 28, flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    legal: { fontSize: 7, color: '#94a3b8', maxWidth: 280, textAlign: rtl ? 'right' : 'left' },
    signBox: { width: 180, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, padding: 10, textAlign: 'center' },
    genFooter: { position: 'absolute', bottom: 18, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: '#cbd5e1' },
  })
}

function QuoteDoc({ quote, lines, garage, customer, lang = 'fr' }: QuotePdfData) {
  const tr = (source: string) => translate(lang, source)
  const quoteBrandId = demoPublicQuoteBrand(quote.client_token)
  const quoteBrand = quoteBrandId ? getBrand(quoteBrandId) : getActiveBrand()
  const demoContext = isDemo() || quoteBrandId !== null
  const accent = garage?.accent_color || '#0f766e'
  const s = build(accent, lang === 'ar')
  const legal =
    garage?.legal_info ||
    [garage?.legal_name, garage?.siret ? `SIRET ${garage.siret}` : null, garage?.vat_number].filter(Boolean).join(' · ')
  const [vehicleName, plate] = (quote.vehicle_label ?? '').split(' · ')
  const clientPhone = quote.client_phone || customer?.phone
  const clientEmail = quote.client_email || customer?.email
  const garageInitial = (garage?.name ?? 'G').slice(0, 1)
  const arabicGarageInitial = /[\u0600-\u06ff]/.test(garageInitial)

  return (
    <Document title={`${tr('Devis')} ${quote.number}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.brandRow}>
            {garage?.logo_url ? (
              <Image src={garage.logo_url} style={s.logo} />
            ) : (
              <Text style={[s.logoFallback, arabicGarageInitial ? s.logoInitialArabic : s.logoInitialLatin]}>{garageInitial}</Text>
            )}
            <View>
              <Text style={s.garageName}>{garage?.name ?? tr('Garage')}</Text>
              {garage?.address ? <Text style={s.muted}>{garage.address}{garage.city ? `, ${garage.city}` : ''}</Text> : null}
              <Text style={s.muted}>{[garage?.phone, garage?.email].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
          <View>
            <Text style={s.docTitle}>{tr('Devis').toUpperCase()}</Text>
            <Text style={s.docMeta}>{quote.number}</Text>
            <Text style={[s.muted, s.docMeta]}>{translate(lang, 'Date : {date}', { date: shortDate(quote.created_at, lang) })}</Text>
            {quote.valid_until ? <Text style={[s.muted, s.docMeta]}>{translate(lang, 'Valable jusqu’au {date}', { date: shortDate(quote.valid_until, lang) })}</Text> : null}
          </View>
        </View>

        {/* Client / vehicle */}
        <View style={s.section}>
          <View style={{ width: '48%' }}>
            <Text style={s.label}>{tr('Client')}</Text>
            <Text style={s.strong}>{quote.client_name || '—'}</Text>
            {clientPhone ? <Text style={s.muted}>{clientPhone}</Text> : null}
            {clientEmail ? <Text style={s.muted}>{clientEmail}</Text> : null}
          </View>
          <View style={{ width: '48%' }}>
            <Text style={s.label}>{tr('Véhicule')}</Text>
            <Text style={s.strong}>{vehicleName || quote.vehicle_label || '—'}</Text>
            {plate ? <Text style={[s.strong, { marginTop: 2 }]}>{translate(lang, 'Immatriculation : {plate}', { plate })}</Text> : null}
          </View>
        </View>

        <Text style={s.subject}>{localizeDemoText(quote.title, lang, demoContext)}</Text>

        {/* Lines */}
        <View style={s.th}>
          <Text style={s.cDesc}>{tr('Désignation')}</Text>
          <Text style={s.cNum}>{tr('Qté')}</Text>
          <Text style={s.cNum}>{tr('PU HT')}</Text>
          <Text style={s.cNum}>{tr('TVA')}</Text>
          <Text style={s.cNum}>{tr('Total HT')}</Text>
        </View>
        {lines.map((l) => (
          <View key={l.id} style={s.tr}>
            <Text style={s.cDesc}>{localizeDemoText(l.label, lang, demoContext)}</Text>
            <Text style={s.cNum}>{l.quantity}</Text>
            <Text style={s.cNum}>{euro(l.unit_price, lang)}</Text>
            <Text style={s.cNum}>{l.tax_rate}%</Text>
            <Text style={s.cNum}>{euro(l.line_total, lang)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}><Text style={s.muted}>{tr('Total HT')}</Text><Text>{euro(quote.subtotal, lang)}</Text></View>
          <View style={s.totalRow}><Text style={s.muted}>{tr('TVA')}</Text><Text>{euro(quote.tax_total, lang)}</Text></View>
          <View style={s.totalTtc}><Text style={s.totalTtcLabel}>{tr('Total TTC')}</Text><Text style={s.totalTtcVal}>{euro(quote.total, lang)}</Text></View>
        </View>

        {quote.conditions ? (
          <View style={s.conditions}>
            <Text style={s.conditionsTitle}>{tr('Conditions')}</Text>
            <Text>{localizeDemoText(quote.conditions, lang, demoContext)}</Text>
          </View>
        ) : null}

        <View style={s.footer}>
          <Text style={s.legal}>{legal}</Text>
          <View style={s.signBox}>
            <Text style={s.strong}>{tr('Bon pour accord')}</Text>
            <Text style={[s.muted, { marginTop: 24 }]}>{tr('Date et signature')}</Text>
          </View>
        </View>
        <Text fixed style={s.genFooter}>{tr(quoteBrand.quoteFooterBranding)}</Text>
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
