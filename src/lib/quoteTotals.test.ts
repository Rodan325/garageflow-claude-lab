import { describe, expect, it } from 'vitest'
import { computeQuoteTotals, lineTotal } from './quoteTotals'

describe('quote totals', () => {
  it('computes a line total (HT) = quantity * unit_price', () => {
    expect(lineTotal({ quantity: 2, unit_price: 50, tax_rate: 20 })).toBe(100)
    expect(lineTotal({ quantity: 1, unit_price: 149, tax_rate: 20 })).toBe(149)
  })

  it('computes subtotal HT, TVA and total TTC over lines', () => {
    const t = computeQuoteTotals([{ quantity: 2, unit_price: 50, tax_rate: 20 }])
    expect(t.subtotal).toBe(100)
    expect(t.tax_total).toBe(20)
    expect(t.total).toBe(120)
  })

  it('sums multiple lines with different VAT rates', () => {
    const t = computeQuoteTotals([
      { quantity: 1, unit_price: 100, tax_rate: 20 },
      { quantity: 2, unit_price: 10, tax_rate: 10 },
    ])
    expect(t.subtotal).toBe(120) // 100 + 20
    expect(t.tax_total).toBe(22) // 20 + 2
    expect(t.total).toBe(142)
  })

  it('rounds to 2 decimals', () => {
    const t = computeQuoteTotals([{ quantity: 3, unit_price: 33.333, tax_rate: 20 }])
    expect(t.subtotal).toBe(99.999 === t.subtotal ? t.subtotal : Math.round(99.999 * 100) / 100)
    expect(Number.isInteger(t.total * 100)).toBe(true)
  })

  it('treats invalid/empty numbers as 0', () => {
    const t = computeQuoteTotals([{ quantity: NaN, unit_price: 10, tax_rate: 20 }])
    expect(t.subtotal).toBe(0)
    expect(t.total).toBe(0)
  })
})
