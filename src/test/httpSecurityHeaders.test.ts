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

  it('enforces the safe baseline and CSP globally', () => {
    expect(globalRule).toBeDefined()
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    )
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(headers.has('Content-Security-Policy')).toBe(true)
    expect(headers.has('Content-Security-Policy-Report-Only')).toBe(false)

    const headerKeys = globalRule!.headers.map(({ key }) => key.toLowerCase())
    expect(new Set(headerKeys).size).toBe(headerKeys.length)
  })

  it('keeps the enforced CSP strict and limited to exact known origins', () => {
    const value = headers.get('Content-Security-Policy')
    expect(value).toBeDefined()

    const directives = parseCsp(value!)
    expect([...directives.keys()]).toEqual([
      'default-src',
      'base-uri',
      'object-src',
      'frame-ancestors',
      'form-action',
      'script-src',
      'style-src',
      'img-src',
      'font-src',
      'connect-src',
      'worker-src',
      'media-src',
      'frame-src',
      'manifest-src',
    ])
    expect(directives.get('default-src')).toEqual(["'self'"])
    expect(directives.get('base-uri')).toEqual(["'self'"])
    expect(directives.get('object-src')).toEqual(["'none'"])
    expect(directives.get('frame-ancestors')).toEqual(["'none'"])
    expect(directives.get('form-action')).toEqual(["'self'"])
    expect(directives.get('script-src')).toEqual(["'self'"])
    expect(directives.get('style-src')).toEqual(["'self'", "'unsafe-inline'"])
    expect(directives.get('img-src')).toEqual([
      "'self'",
      'data:',
      'https://tftmfhwmzkhzlvgwcnje.supabase.co',
      'https://zazdhzmfrtecxtglhoso.supabase.co',
    ])
    expect(directives.get('font-src')).toEqual(["'self'"])
    expect(directives.get('connect-src')).toEqual([
      "'self'",
      'https://tftmfhwmzkhzlvgwcnje.supabase.co',
      'https://zazdhzmfrtecxtglhoso.supabase.co',
    ])
    expect(directives.get('worker-src')).toEqual(["'self'"])
    expect(directives.get('media-src')).toEqual(["'none'"])
    expect(directives.get('frame-src')).toEqual(["'none'"])
    expect(directives.get('manifest-src')).toEqual(["'self'"])

    const sources = [...directives.values()].flat()
    expect(directives.get('script-src')).not.toContain("'unsafe-inline'")
    expect(value).not.toContain("'unsafe-eval'")
    expect(value).not.toContain('*.supabase.co')
    expect(sources).not.toContain('*')
    expect(sources).not.toContain('https:')
    expect(sources).not.toContain('wss:')
    expect(sources).not.toContain('blob:')
    expect(sources.some((source) => source.startsWith('wss://'))).toBe(false)
    expect(sources.some((source) => source.includes('vercel'))).toBe(false)
    expect(directives.has('report-uri')).toBe(false)
    expect(directives.has('report-to')).toBe(false)

    const exactSupabaseOrigins = new Set([
      'https://tftmfhwmzkhzlvgwcnje.supabase.co',
      'https://zazdhzmfrtecxtglhoso.supabase.co',
    ])
    const configuredSupabaseOrigins = [...directives.values()]
      .flat()
      .filter((source) => source.includes('supabase.co'))

    expect(configuredSupabaseOrigins.every((source) => exactSupabaseOrigins.has(source))).toBe(true)
  })
})
