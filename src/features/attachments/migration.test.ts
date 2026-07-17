import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260715030000_attachments_notifications.sql'), 'utf8')

describe('attachment and notification migration safeguards', () => {
  it('keeps the attachment bucket private and constrained', () => {
    expect(sql).toContain("'service-request-attachments'")
    expect(sql).toMatch(/false,\s*26214400/)
    expect(sql).toContain('service_attachments_customer_read_objects')
    expect(sql).toContain('service_attachments_staff_insert_objects')
    expect(sql).toContain('Attachment limit reached')
  })

  it('enables RLS and grants no anonymous table access', () => {
    expect(sql).toContain('alter table public.service_request_attachments enable row level security')
    expect(sql).toContain('alter table public.notification_outbox enable row level security')
    expect(sql).not.toMatch(/grant\s+(select|insert|update|delete).*\s+to\s+anon/i)
  })

  it('exposes registration only through an authenticated RPC', () => {
    expect(sql).toContain('register_service_request_attachment')
    expect(sql).toMatch(/revoke all on function public\.register_service_request_attachment[\s\S]+from public, anon/)
    expect(sql).toMatch(/grant execute on function public\.register_service_request_attachment[\s\S]+to authenticated/)
  })
})
