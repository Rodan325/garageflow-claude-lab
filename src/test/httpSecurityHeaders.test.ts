// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type Header = { key: string; value: string }
type HeaderRule = { source: string; headers: Header[] }

function readConfig() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
    headers?: HeaderRule[]
  }
}

function parseCsp(value: string) {
  return new Map(value.split(';').map((part) => {
    const [directive, ...sources] = part.trim().split(/\s+/)
    return [directive, sources]
  }))
}

describe('HTTP security headers', () => {
  const config = readConfig()
  const globalRule = config.headers?.find((rule) => rule.source === '/(.*)')
  const headers = new Map(globalRule?.headers.map(({ key, value }) => [key, value]))

  it('enforces the safe baseline globally without a blocking CSP', () => {
    expect(globalRule).toBeDefined()
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    )
    expect(headers.has('Content-Security-Policy')).toBe(false)
  })

  it('keeps the report-only CSP strict and limited to exact known origins', () => {
    const value = headers.get('Content-Security-Policy-Report-Only')
    expect(value).toBeDefined()

    const directives = parseCsp(value!)
    expect(directives.get('default-src')).toEqual(["'self'"])
    expect(directives.get('base-uri')).toEqual(["'self'"])
    expect(directives.get('object-src')).toEqual(["'none'"])
    expect(directives.get('frame-ancestors')).toEqual(["'none'"])
    expect(directives.get('script-src')).toEqual(["'self'"])
    expect(directives.get('script-src')).not.toContain("'unsafe-inline'")
    expect(value).not.toContain("'unsafe-eval'")
    expect(value).not.toContain('*.supabase.co')
    expect(value).not.toMatch(/(?:default-src|connect-src|script-src)\s+\*/)
    expect(directives.has('report-uri')).toBe(false)
    expect(directives.has('report-to')).toBe(false)

    const exactSupabaseOrigins = new Set([
      'https://tftmfhwmzkhzlvgwcnje.supabase.co',
      'https://zazdhzmfrtecxtglhoso.supabase.co',
      'wss://tftmfhwmzkhzlvgwcnje.supabase.co',
      'wss://zazdhzmfrtecxtglhoso.supabase.co',
    ])
    const configuredSupabaseOrigins = [...directives.values()]
      .flat()
      .filter((source) => source.includes('supabase.co'))

    expect(configuredSupabaseOrigins.every((source) => exactSupabaseOrigins.has(source))).toBe(true)
  })
})
