export const APPROVED_STAGING_REF = 'zazdhzmfrtecxtglhoso'
export const FORBIDDEN_PRODUCTION_REF = 'tftmfhwmzkhzlvgwcnje'

const LOCAL_PORT = '54321'

function projectRefFromHostname(hostname) {
  const suffix = '.supabase.co'
  return hostname.endsWith(suffix) ? hostname.slice(0, -suffix.length) : null
}

export function assertSupabaseTestTarget(rawUrl, options = {}) {
  if (!rawUrl) throw new Error('VITE_SUPABASE_URL is required')

  const target = new URL(rawUrl)
  const actualRef = projectRefFromHostname(target.hostname)
  if (actualRef === FORBIDDEN_PRODUCTION_REF) {
    throw new Error(`Refusing forbidden production project: ${FORBIDDEN_PRODUCTION_REF}`)
  }

  const mode = options.mode || 'local'
  if (mode === 'local') {
    const localHost = target.hostname === '127.0.0.1' || target.hostname === 'localhost'
    if (target.protocol !== 'http:' || !localHost || target.port !== LOCAL_PORT) {
      throw new Error(`Refusing non-local Supabase target: ${target.origin}`)
    }
    return target
  }

  if (mode !== 'staging') throw new Error(`Unsupported Supabase test target: ${mode}`)
  if (options.expectedRef !== APPROVED_STAGING_REF) {
    throw new Error('Staging validation requires the approved project ref')
  }
  if (options.forbiddenRef && options.forbiddenRef !== FORBIDDEN_PRODUCTION_REF) {
    throw new Error('Production deny-list ref does not match the repository guard')
  }

  const expectedHost = `${APPROVED_STAGING_REF}.supabase.co`
  if (target.protocol !== 'https:' || target.hostname !== expectedHost || actualRef !== options.expectedRef) {
    throw new Error(`Refusing unapproved staging target: ${target.origin}`)
  }
  return target
}

export function assertPublishableKey(key) {
  if (!key) throw new Error('VITE_SUPABASE_ANON_KEY is required')
  if (key.startsWith('sb_secret_') || /service_role/i.test(key)) {
    throw new Error('Refusing a server-side Supabase key')
  }

  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
      if (payload.role === 'service_role') throw new Error('Refusing a service_role JWT')
    } catch (error) {
      if (/service_role/.test(error.message)) throw error
      throw new Error('Invalid legacy Supabase publishable key')
    }
  }
  return key
}
