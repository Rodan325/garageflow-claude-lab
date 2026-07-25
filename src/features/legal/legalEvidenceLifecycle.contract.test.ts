import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { canonicalMigrationSha256 } from '../../test/canonicalMigrationHash'

const migrations = join(process.cwd(), 'supabase', 'migrations')
const lifecycleMigrationName = '20260720230821_preserve_legal_acceptance_evidence_lifecycle.sql'
const lifecycleMigration = readFileSync(join(migrations, lifecycleMigrationName), 'utf8')

const canonicalHistoricalMigrationHashes: Record<string, string> = {
  '20260703132019_legal_acceptances.sql': '5f588a499c443e87f3e222212b2f873338e75d73c52d3b429021a8657b159e69',
  '20260719111617_add_legal_acceptance_versioning_contracts.sql': '44524f55b6259c3f87f06d590c2b38a93a9d6ac791de4c22b32465b7d6f341bc',
  '20260719235753_harden_legal_acceptance_v2.sql': '82b62306c23d8cddbe8485fa436b1ec361c0913614e0fd3b3899cc98934402a4',
  '20260720151800_preserve_legacy_legal_acceptance_fail_closed.sql': '48c41cb20d552996b1e73d09e93b4cce8737379a8bd0ddfb5534d9bd6231fcb7',
}

const lineEndingFixture = [
  'create table public.example (',
  '  id uuid primary key,',
  '  label text not null',
  ');',
  '',
  'alter table public.example enable row level security;',
  '',
].join('\n')

function withoutComments(sql: string) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('legal evidence lifecycle migration contract', () => {
  it('never rewrites or removes an existing acceptance', () => {
    const executableSql = withoutComments(lifecycleMigration)
    expect(executableSql).not.toMatch(/\bupdate\s+(?:public\.)?legal_acceptances\b/i)
    expect(executableSql).not.toMatch(/\bdelete\s+from\s+(?:public\.)?legal_acceptances\b/i)
    expect(executableSql).not.toMatch(/\btruncate\s+(?:table\s+)?(?:public\.)?legal_acceptances\b/i)
  })

  it('decouples proof identifiers from destructive foreign keys', () => {
    expect(lifecycleMigration).toContain('drop constraint if exists legal_acceptances_user_id_fkey')
    expect(lifecycleMigration).toContain('drop constraint if exists legal_acceptances_organization_id_fkey')
    expect(lifecycleMigration).toContain('Immutable pseudonymous actor UUID snapshot')
    expect(lifecycleMigration).toContain('Immutable contracting-organization UUID snapshot')
  })

  it('derives a minimal organization snapshot server-side and keeps historical rows null', () => {
    expect(lifecycleMigration).toContain('add column if not exists organization_name_snapshot text')
    expect(lifecycleMigration).toContain('new.organization_name_snapshot := left(v_organization_name, 200)')
    expect(lifecycleMigration).toContain('Historical evidence remains null and is never backfilled')
  })

  it('allows a new proof when either version or hash changes', () => {
    expect(lifecycleMigration).toContain('(user_id, document_id, document_version, document_sha256)')
    expect(lifecycleMigration).toContain('(organization_id, document_id, document_version, document_sha256)')
  })

  it('keeps every older legal migration unchanged apart from line endings', () => {
    const lfHash = canonicalMigrationSha256(lineEndingFixture)
    expect(lfHash).toBe('d1e72f0735c4325b836f3cf923c62817f131446a89306db1207bbfa0992d8e76')
    expect(canonicalMigrationSha256(lineEndingFixture.replace(/\n/g, '\r\n'))).toBe(lfHash)
    expect(canonicalMigrationSha256(lineEndingFixture.replace(/\n/g, '\r'))).toBe(lfHash)

    const addedCommand = `${lineEndingFixture}grant select on public.example to authenticated;\n`
    const removedCommand = lineEndingFixture.replace(
      'alter table public.example enable row level security;\n',
      '',
    )
    const changedCommand = lineEndingFixture.replace(
      'alter table public.example enable row level security;',
      'alter table public.example disable row level security;',
    )
    const changedSpacing = lineEndingFixture.replace('  label text not null', '   label text not null')

    expect(canonicalMigrationSha256(addedCommand)).not.toBe(lfHash)
    expect(canonicalMigrationSha256(removedCommand)).not.toBe(lfHash)
    expect(canonicalMigrationSha256(changedCommand)).not.toBe(lfHash)
    expect(canonicalMigrationSha256(changedSpacing)).not.toBe(lfHash)

    for (const [file, expectedHash] of Object.entries(canonicalHistoricalMigrationHashes)) {
      const actualHash = canonicalMigrationSha256(readFileSync(join(migrations, file), 'utf8'))
      expect(actualHash, file).toBe(expectedHash)
    }
  })
})
