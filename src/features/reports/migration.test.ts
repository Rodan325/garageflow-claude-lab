import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260715040000_delivery_reports_reminders.sql'), 'utf8')

describe('delivery report and reminder migration safeguards', () => {
  it('protects finalized reports and validates mileage', () => {
    expect(sql).toContain("report.status = 'finalized'")
    expect(sql).toContain('Finalized delivery report is immutable')
    expect(sql).toContain('delivery_reports_mileage_order_check')
    expect(sql).toContain('delivery_reports_request_garage_fk')
  })

  it('keeps center and request references inside the organization', () => {
    expect(sql).toContain('delivery_reports_center_garage_fk')
    expect(sql).toContain('maintenance_reminders_center_garage_fk')
    expect(sql).toContain('maintenance_reminders_request_garage_fk')
    expect(sql).toContain('maintenance_reminders_converted_request_garage_fk')
  })

  it('enables RLS without anonymous or direct write grants', () => {
    expect(sql).toContain('alter table public.delivery_reports enable row level security')
    expect(sql).toContain('alter table public.maintenance_reminders enable row level security')
    expect(sql).not.toMatch(/grant\s+(insert|update|delete|all).*\s+to\s+(anon|authenticated)/i)
    expect(sql).not.toMatch(/grant\s+select.*\s+to\s+anon/i)
  })
})
