import { createHash } from 'node:crypto'

export function canonicalizeMigrationLineEndings(sql: string) {
  return sql.replace(/\r\n?/g, '\n')
}

export function canonicalMigrationSha256(sql: string) {
  return createHash('sha256')
    .update(canonicalizeMigrationLineEndings(sql), 'utf8')
    .digest('hex')
}
