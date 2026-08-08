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

/**
 * Hosts that are unambiguously this machine. Compared by exact equality after
 * normalisation — never by substring, so `localhost.evil.example` and
 * `127.0.0.1.evil.example` are rejected like any other remote name.
 */
export const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:'])

/**
 * Parse a PostgreSQL connection URL and refuse anything that is not a local
 * database. Returns the pieces the caller should hand to psql through the
 * environment, so the password never reaches a command line.
 *
 * Throws with an actionable message and never echoes the URL or the password.
 */
export function assertLocalPostgresUrl(rawUrl, varName = 'SUPABASE_LOCAL_DB_URL') {
  if (rawUrl === undefined || rawUrl === null || String(rawUrl).trim() === '') {
    throw new Error(`${varName} is required and must not be empty`)
  }
  const raw = String(rawUrl)
  if (/[\r\n\t]/.test(raw)) {
    throw new Error(`${varName} must not contain line breaks or tabs`)
  }

  let url
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`${varName} is not a valid URL`)
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    throw new Error(`Refusing ${varName}: expected a postgres:// or postgresql:// URL`)
  }

  // URL keeps IPv6 literals in brackets; compare the address itself.
  const hostname = url.hostname.toLowerCase()
  const host = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(
      `Refusing ${varName}: the host is not a loopback address. ` +
        'Only localhost, 127.0.0.1 and ::1 are accepted, so this workflow cannot ' +
        'reach a hosted project. Point it at your local Supabase database.',
    )
  }

  if (!/^\d+$/.test(url.port)) {
    throw new Error(`Refusing ${varName}: an explicit numeric port is required`)
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!database) {
    throw new Error(`Refusing ${varName}: no database name in the URL path`)
  }

  return {
    host,
    port: url.port,
    database,
    user: url.username ? decodeURIComponent(url.username) : '',
    password: url.password ? decodeURIComponent(url.password) : '',
  }
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
