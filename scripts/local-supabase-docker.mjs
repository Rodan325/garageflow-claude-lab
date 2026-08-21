import { spawnSync } from 'node:child_process'

export const LOCAL_SUPABASE_PROJECT_ID = 'garageflow-claude-lab'
export const LOCAL_SUPABASE_DB_PORT = '54322'

function runDocker(spawn, args) {
  const result = spawn('docker', args, {
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  })

  if (result.error || result.status !== 0) {
    throw new Error('Unable to inspect the local Supabase Docker stack')
  }
  return result.stdout ?? ''
}

function parseInspection(raw) {
  try {
    const value = JSON.parse(raw)
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error()
    return value
  } catch {
    throw new Error('Docker returned an invalid database-container inspection')
  }
}

export function findLocalSupabaseDatabase({
  projectId,
  expectedHostPort,
  requireHealthy = false,
  spawn = spawnSync,
} = {}) {
  if (!projectId || /[\r\n\t]/.test(projectId)) {
    throw new Error('An exact local Supabase project id is required')
  }
  if (expectedHostPort !== undefined && !/^\d+$/.test(expectedHostPort)) {
    throw new Error('The expected local database port must be numeric')
  }

  const names = runDocker(spawn, [
    'ps',
    '-a',
    '--filter', `label=com.supabase.cli.project=${projectId}`,
    '--format', '{{.Names}}',
  ])
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter((name) => name.startsWith('supabase_db_'))

  if (names.length !== 1) {
    throw new Error(`Expected exactly one local database container for project ${projectId}; found ${names.length}`)
  }

  const containerName = names[0]
  const inspection = parseInspection(runDocker(spawn, [
    'inspect',
    '--format',
    '{{json .}}',
    containerName,
  ]))
  const actualProject = inspection.Config?.Labels?.['com.supabase.cli.project']

  if (actualProject !== projectId) {
    throw new Error('The local database container has the wrong Supabase project label')
  }
  if (inspection.State?.Running !== true) {
    throw new Error('The local Supabase database container is not running')
  }
  if (requireHealthy && inspection.State?.Health?.Status !== 'healthy') {
    throw new Error('The local Supabase database container is not healthy')
  }

  if (expectedHostPort !== undefined) {
    const bindings = inspection.NetworkSettings?.Ports?.['5432/tcp']
    if (!Array.isArray(bindings) || bindings.length === 0) {
      throw new Error('The local database container does not publish PostgreSQL port 5432')
    }
    const mappedPorts = new Set(bindings.map((binding) => binding?.HostPort))
    if (mappedPorts.size !== 1 || !mappedPorts.has(expectedHostPort)) {
      throw new Error(`The local database port mapping is not exactly ${expectedHostPort} -> 5432`)
    }
  }

  return {
    containerId: inspection.Id,
    containerName,
    projectId,
    hostPort: expectedHostPort,
    containerPort: '5432',
  }
}
