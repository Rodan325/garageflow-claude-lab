/**
 * Quote total maths — shared by the editor preview and the demo store so the
 * client mirrors what the database recomputes. On real Supabase, the RPCs are
 * the source of truth (the DB never trusts amounts sent by the frontend).
 */
export interface QuoteLineInput {
  quantity: number
  unit_price: number
  tax_rate: number
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function lineTotal(l: QuoteLineInput): number {
  return round2((Number(l.quantity) || 0) * (Number(l.unit_price) || 0))
}

export function computeQuoteTotals(lines: QuoteLineInput[]) {
  let subtotal = 0
  let tax = 0
  for (const l of lines) {
    const lt = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0)
    subtotal += lt
    tax += lt * ((Number(l.tax_rate) || 0) / 100)
  }
  return { subtotal: round2(subtotal), tax_total: round2(tax), total: round2(subtotal + tax) }
}
